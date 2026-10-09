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
