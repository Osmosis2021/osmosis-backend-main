/* eslint-env jest */
// Phase 4: booking from a payment, race conditions, webhook safety net, browse data, host stats.
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/stripeClient');
jest.mock('cloudinary');
jest.mock('../services/emailService', () => ({
    makePasswordResetCode: jest.fn(() => '123456'),
    sendEmail: jest.fn().mockResolvedValue({ id: 'mock' }),
}));

const stripe = require('../services/stripeClient');
const emailService = require('../services/emailService');
const User = require('../models/user');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const Booking = require('../models/booking');

let mongoServer;
let app;
let host;
let guest;
let course;
let slot;

const tokenFor = (user) => jwt.sign({ userName: user.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
const inDays = (days) => new Date(Date.now() + days * 86400000);

const paymentFor = (overrides = {}) => ({
    id: `pi_${Math.random().toString(36).slice(2)}`,
    status: 'succeeded',
    amount: 9000,
    metadata: { courseID: String(course._id), timeslotID: String(slot._id), studentUserName: guest.userName, guests: '2' },
    ...overrides,
});

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use('/stripe', require('../routes/webhook.routes'));
    app.use(express.json());
    app.use('/booking', require('../routes/booking.routes'));
    app.use('/course', require('../routes/course.routes'));
    app.use(require('../middleware/errorHandler'));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Course.deleteMany({}), CourseTimeslot.deleteMany({}), Booking.deleteMany({})]);
    jest.clearAllMocks();
    host = await User.create({ firstName: 'Lena', lastName: 'Ortiz', userName: 'lenaortiz', email: 'lena@example.com', password: 'x', isTeacher: true });
    guest = await User.create({ firstName: 'Gia', lastName: 'Park', userName: 'giapark', email: 'gia@example.com', password: 'x', isStudent: true });
    course = await Course.create({ teacherID: host._id, userName: host.userName, courseTitle: 'Resin Pour', pricePerStudent: 45, capacity: 4, duration: 90, timezone: 'America/New_York' });
    slot = await CourseTimeslot.create({ courseID: course._id, startAt: inDays(5), timezone: 'America/New_York', startDate: inDays(5), startTime: '14:00', capacity: 4, enrollment: 0, status: 'created' });
});

const book = (payment) => {
    stripe.paymentIntents.retrieve.mockResolvedValue(payment);
    return request(app).post('/booking/createBooking').set({ Authorization: `Bearer ${tokenFor(guest)}` })
        .send({ courseID: String(course._id), courseTimeslotID: String(slot._id), paymentIntentID: payment.id });
};

describe('Booking after payment', () => {
    it('confirms the booking and emails the guest and the host', async () => {
        const res = await book(paymentFor());
        expect(res.status).toBe(200);
        expect(res.body.booking.status).toBe('confirmed');
        expect((await CourseTimeslot.findById(slot._id)).enrollment).toBe(2);
        const recipients = emailService.sendEmail.mock.calls.map(([args]) => args.sendTo).sort();
        expect(recipients).toEqual(['gia@example.com', 'lena@example.com']);
        expect(emailService.sendEmail.mock.calls[0][0].subject).toMatch(/Resin Pour/);
    });

    it('returns the same booking when checkout retries with the same payment', async () => {
        const payment = paymentFor();
        const first = await book(payment);
        const second = await book(payment);
        expect(second.status).toBe(200);
        expect(second.body.booking._id).toBe(first.body.booking._id);
        expect(await Booking.countDocuments()).toBe(1);
        expect((await CourseTimeslot.findById(slot._id)).enrollment).toBe(2);
    });

    it("refunds the guest if the session filled up while they were paying", async () => {
        await CourseTimeslot.updateOne({ _id: slot._id }, { enrollment: 3 });
        stripe.refunds.create.mockResolvedValue({ id: 're_1' });
        const payment = paymentFor();
        const res = await book(payment);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/refunded/);
        expect(stripe.refunds.create).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: payment.id }), expect.anything());
        expect(await Booking.countDocuments()).toBe(0);
    });

    it("refuses a payment made by a different guest", async () => {
        const res = await book(paymentFor({ metadata: { courseID: String(course._id), timeslotID: String(slot._id), studentUserName: 'someoneelse', guests: '2' } }));
        expect(res.status).toBe(400);
        expect(await Booking.countDocuments()).toBe(0);
    });

    it("refuses a payment for less than the listing price", async () => {
        const res = await book(paymentFor({ amount: 100 }));
        expect(res.status).toBe(400);
        expect(await Booking.countDocuments()).toBe(0);
    });
});

describe('Stripe webhook safety net', () => {
    it('creates the booking if the guest closed the page after paying', async () => {
        const payment = paymentFor();
        stripe.webhooks.constructEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: payment } });
        await request(app).post('/stripe/webhook').set('stripe-signature', 'sig').set('Content-Type', 'application/json').send('{}').expect(200);
        const booking = await Booking.findOne({ paymentIntentID: payment.id });
        expect(booking).not.toBeNull();
        expect(booking.studentUserName).toBe('giapark');
    });

    it('rejects events without a valid Stripe signature', async () => {
        stripe.webhooks.constructEvent.mockImplementation(() => { throw new Error('bad signature'); });
        await request(app).post('/stripe/webhook').set('stripe-signature', 'forged').set('Content-Type', 'application/json').send('{}').expect(400);
        expect(await Booking.countDocuments()).toBe(0);
    });
});

describe('Browse data', () => {
    it('includes the next open session and skips full, cancelled and past ones', async () => {
        await CourseTimeslot.updateOne({ _id: slot._id }, { enrollment: 4 }); // full
        await CourseTimeslot.create({ courseID: course._id, startAt: inDays(2), startDate: inDays(2), startTime: '10:00', capacity: 4, enrollment: 0, status: 'cancelled' });
        await CourseTimeslot.create({ courseID: course._id, startAt: inDays(-2), startDate: inDays(-2), startTime: '10:00', capacity: 4, enrollment: 0, status: 'created' });
        const open = await CourseTimeslot.create({ courseID: course._id, startAt: inDays(9), startDate: inDays(9), startTime: '11:00', capacity: 4, enrollment: 1, status: 'created' });
        const res = await request(app).get('/course/getClasses').expect(200);
        expect(res.body[0].upcomingSessionCount).toBe(2);
        expect(res.body[0].nextSession._id).toBe(String(open._id));
        expect(res.body[0].nextSession.spotsLeft).toBe(3);
        expect(res.body[0].teacherID).not.toHaveProperty('email');
    });

    it('reports null when a listing has no bookable dates', async () => {
        await CourseTimeslot.deleteMany({});
        const res = await request(app).get('/course/getClasses').expect(200);
        expect(res.body[0].nextSession).toBeNull();
    });
});

describe('Payout readiness', () => {
    it('marks listings bookable only when the artist can receive payouts', async () => {
        let res = await request(app).get('/course/getClasses').expect(200);
        expect(res.body[0].paymentsReady).toBe(false);

        await User.updateOne({ _id: host._id }, { payoutsEnabled: true });
        res = await request(app).get('/course/getClasses').expect(200);
        expect(res.body[0].paymentsReady).toBe(true);
    });

    it('updates the flag when Stripe reports a host account change', async () => {
        await User.updateOne({ _id: host._id }, { stripeID: 'acct_host' });
        stripe.webhooks.constructEvent.mockReturnValue({ type: 'account.updated', data: { object: { id: 'acct_host', payouts_enabled: true } } });
        await request(app).post('/stripe/webhook').set('stripe-signature', 'sig').set('Content-Type', 'application/json').send('{}').expect(200);
        expect((await User.findById(host._id)).payoutsEnabled).toBe(true);
    });
});

describe('Host stats', () => {
    it('reports only real numbers', async () => {
        const fresh = await request(app).get(`/course/hostStats/${host.userName}`).expect(200);
        expect(fresh.body).toEqual(expect.objectContaining({ sessionsHosted: 0, guestsHosted: 0, reviewCount: 0, averageRating: null }));

        const past = await CourseTimeslot.create({ courseID: course._id, startAt: inDays(-3), startDate: inDays(-3), startTime: '10:00', capacity: 4, enrollment: 3, status: 'created' });
        await Booking.create({ courseTimeslotID: past._id, courseID: course._id, teacherUserName: host.userName, numberOfGuests: 3, status: 'confirmed' });
        await Course.updateOne({ _id: course._id }, { feedback: [{ rating: 5 }, { rating: 4 }] });

        const res = await request(app).get(`/course/hostStats/${host.userName}`).expect(200);
        expect(res.body).toEqual(expect.objectContaining({ sessionsHosted: 1, guestsHosted: 3, reviewCount: 2, averageRating: 4.5 }));
    });
});
