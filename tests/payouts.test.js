/* eslint-env jest */
// Host payout setup with Stripe Express.
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/stripeClient', () => ({
    accounts: { create: jest.fn(), retrieve: jest.fn(), createLoginLink: jest.fn() },
    accountLinks: { create: jest.fn() },
    paymentIntents: { create: jest.fn() },
    isConfigured: true,
    stripeMode: 'test',
    publishableKey: 'pk_test_123',
}));

const stripe = require('../services/stripeClient');
const User = require('../models/user');

let mongoServer;
let app;

const stripeError = (props) => Object.assign(new Error(props.message || 'stripe error'), props);
const tokenFor = (user) => jwt.sign({ userName: user.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
const makeHost = (overrides = {}) => User.create({ firstName: 'Lena', lastName: 'Ortiz', userName: 'lenaortiz', email: 'lena@example.com', password: 'x', isTeacher: true, ...overrides });

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
    app.use('/stripe', require('../routes/stripe.routes'));
    app.use(require('../middleware/errorHandler'));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
    stripe.accountLinks.create.mockResolvedValue({ url: 'https://connect.stripe.com/setup/e/abc' });
});

describe('Payout onboarding', () => {
    it("creates a Stripe Express account for hosts who don't have one, then returns the onboarding link", async () => {
        const host = await makeHost();
        stripe.accounts.create.mockResolvedValue({ id: 'acct_new' });

        const res = await request(app).post('/stripe/payouts/onboarding-link').set('Authorization', `Bearer ${tokenFor(host)}`).expect(200);

        expect(res.body.url).toBe('https://connect.stripe.com/setup/e/abc');
        expect(stripe.accounts.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'express', email: 'lena@example.com' }));
        expect(stripe.accountLinks.create).toHaveBeenCalledWith(expect.objectContaining({
            account: 'acct_new',
            type: 'account_onboarding',
            refresh_url: 'https://getstudiotime.com/payouts/refresh',
            return_url: 'https://getstudiotime.com/payouts/return',
        }));
        expect((await User.findById(host._id)).stripeID).toBe('acct_new');
    });

    it('reuses an existing account', async () => {
        const host = await makeHost({ stripeID: 'acct_existing' });
        stripe.accounts.retrieve.mockResolvedValue({ id: 'acct_existing' });
        await request(app).post('/stripe/payouts/onboarding-link').set('Authorization', `Bearer ${tokenFor(host)}`).expect(200);
        expect(stripe.accounts.create).not.toHaveBeenCalled();
    });

    it('replaces an account ID that belongs to the other Stripe mode', async () => {
        const host = await makeHost({ stripeID: 'acct_from_live' });
        stripe.accounts.retrieve.mockRejectedValue(stripeError({ type: 'StripeInvalidRequestError', statusCode: 404, code: 'resource_missing', message: 'No such account' }));
        stripe.accounts.create.mockResolvedValue({ id: 'acct_test' });
        await request(app).post('/stripe/payouts/onboarding-link').set('Authorization', `Bearer ${tokenFor(host)}`).expect(200);
        expect((await User.findById(host._id)).stripeID).toBe('acct_test');
    });

    it('explains, rather than crashing, when the server has the wrong Stripe key', async () => {
        const host = await makeHost();
        stripe.accounts.create.mockRejectedValue(stripeError({ type: 'StripeAuthenticationError', message: 'Invalid API Key provided' }));
        const res = await request(app).post('/stripe/payouts/onboarding-link').set('Authorization', `Bearer ${tokenFor(host)}`).expect(503);
        expect(res.body.message).toMatch(/Payouts aren't available/);
    });

    it('is only for hosts', async () => {
        const guest = await makeHost({ userName: 'guest1', email: 'g@example.com', isTeacher: false, isStudent: true });
        await request(app).post('/stripe/payouts/onboarding-link').set('Authorization', `Bearer ${tokenFor(guest)}`).expect(403);
    });
});

describe('Payout status', () => {
    it('reports each stage in plain terms', async () => {
        const host = await makeHost({ stripeID: 'acct_1' });
        const auth = { Authorization: `Bearer ${tokenFor(host)}` };

        stripe.accounts.retrieve.mockResolvedValueOnce({ payouts_enabled: false, details_submitted: false, requirements: { currently_due: ['external_account'] } });
        expect((await request(app).get('/stripe/payouts/status').set(auth)).body.state).toBe('in_progress');

        stripe.accounts.retrieve.mockResolvedValueOnce({ payouts_enabled: false, details_submitted: true, requirements: { currently_due: [] } });
        expect((await request(app).get('/stripe/payouts/status').set(auth)).body.state).toBe('pending_review');

        stripe.accounts.retrieve.mockResolvedValueOnce({ payouts_enabled: true, details_submitted: true, requirements: { currently_due: [] } });
        expect((await request(app).get('/stripe/payouts/status').set(auth)).body.state).toBe('ready');
    });

    it('says not_started for hosts without an account', async () => {
        const host = await makeHost();
        const res = await request(app).get('/stripe/payouts/status').set('Authorization', `Bearer ${tokenFor(host)}`).expect(200);
        expect(res.body).toEqual(expect.objectContaining({ state: 'not_started', mode: 'test' }));
    });
});

describe('Switching from test to live mode', () => {
    const Course = require('../models/course');
    const CourseTimeslot = require('../models/courseTimeslot');
    const listingService = require('../services/listingService');
    const missing = () => stripeError({ type: 'StripeInvalidRequestError', statusCode: 404, code: 'resource_missing', message: 'No such account' });

    beforeEach(() => { stripe.stripeMode = 'live'; });
    afterEach(() => { stripe.stripeMode = 'test'; });

    it("doesn't trust a 'ready' flag checked in test mode: re-checks with Stripe", async () => {
        // Finished onboarding in test mode (flag saved before payoutsMode existed).
        const host = await makeHost({ stripeID: 'acct_test_only', payoutsEnabled: true });
        await Course.create({ teacherID: host._id, userName: host.userName, courseTitle: 'Resin Pour', pricePerStudent: 45, capacity: 4 });
        stripe.accounts.retrieve.mockRejectedValue(missing());

        const [listing] = await listingService.getAllListings();
        expect(listing.paymentsReady).toBe(false);
        const saved = await User.findById(host._id);
        expect(saved.payoutsEnabled).toBe(false);
        expect(saved.payoutsMode).toBe('live');
        await Course.deleteMany({});
    });

    it('asks the artist to set up payouts instead of failing checkout', async () => {
        const host = await makeHost({ stripeID: 'acct_test_only', payoutsEnabled: true });
        const course = await Course.create({ teacherID: host._id, userName: host.userName, courseTitle: 'Resin Pour', pricePerStudent: 45, capacity: 4 });
        const slot = await CourseTimeslot.create({ courseID: course._id, capacity: 4, enrollment: 0, startTime: '14:00', startDate: new Date('2030-01-05') });
        stripe.accounts.retrieve.mockRejectedValue(missing());

        const res = await request(app).post('/stripe/create-payment-intent')
            .send({ courseID: String(course._id), timeslotID: String(slot._id), guests: 1, guest: { firstName: 'Ana', lastName: 'Ruiz', email: 'ana@example.com' } })
            .expect(409);
        expect(res.body.error).toMatch(/still setting up payments/);
        expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
        await Promise.all([Course.deleteMany({}), CourseTimeslot.deleteMany({})]);
    });

    it("takes the payment without a guest's test-mode saved card", async () => {
        const host = await makeHost({ stripeID: 'acct_live', payoutsEnabled: true, payoutsMode: 'live' });
        const guest = await User.create({ firstName: 'Gia', lastName: 'Park', userName: 'giapark', email: 'gia@example.com', password: 'x', isStudent: true, customerStripeID: 'cus_test_only', paymentMethodID: 'pm_test_only' });
        const course = await Course.create({ teacherID: host._id, userName: host.userName, courseTitle: 'Resin Pour', pricePerStudent: 45, capacity: 4 });
        const slot = await CourseTimeslot.create({ courseID: course._id, capacity: 4, enrollment: 0, startTime: '14:00', startDate: new Date('2030-01-05') });
        stripe.accounts.retrieve.mockResolvedValue({ id: 'acct_live', payouts_enabled: true });
        stripe.paymentIntents.create
            .mockRejectedValueOnce(stripeError({ type: 'StripeInvalidRequestError', code: 'resource_missing', param: 'customer', message: 'No such customer' }))
            .mockResolvedValueOnce({ id: 'pi_live', client_secret: 'pi_live_secret' });

        const res = await request(app).post('/stripe/create-payment-intent').set('Authorization', `Bearer ${tokenFor(guest)}`)
            .send({ courseID: String(course._id), timeslotID: String(slot._id), guests: 1 })
            .expect(200);
        expect(res.body.clientSecret).toBe('pi_live_secret');
        const retry = stripe.paymentIntents.create.mock.calls[1][0];
        expect(retry.customer).toBeUndefined();
        expect(retry.payment_method).toBeUndefined();
        expect(retry.amount).toBe(4500);
        await Promise.all([Course.deleteMany({}), CourseTimeslot.deleteMany({})]);
    });
});
