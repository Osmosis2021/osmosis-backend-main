/* eslint-env jest */
// Booking without an account (name + email), claiming the account later, and guests cancelling.
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
const { freeCancellationDeadline } = require('../services/sessionTime');

let mongoServer;
let app;
let host;
let course;
let slot;

const tokenFor = (user) => jwt.sign({ userName: user.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
const inDays = (days) => new Date(Date.now() + days * 86400000);

const guestPayment = (overrides = {}) => ({
    id: `pi_${Math.random().toString(36).slice(2)}`,
    status: 'succeeded',
    amount: 4500,
    metadata: {
        courseID: String(course._id), timeslotID: String(slot._id), guests: '1', studentUserName: '',
        guestEmail: 'ana@example.com', guestFirstName: 'Ana', guestLastName: 'Ruiz',
    },
    ...overrides,
});

const bookAsGuest = (payment) => {
    stripe.paymentIntents.retrieve.mockResolvedValue(payment);
    return request(app).post('/booking/createBooking')
        .send({ courseID: String(course._id), courseTimeslotID: String(slot._id), paymentIntentID: payment.id });
};

const claimLinkFromEmail = () => {
    const guestEmail = emailService.sendEmail.mock.calls.map(([args]) => args).find((args) => args.sendTo === 'ana@example.com');
    const match = guestEmail?.message.match(/claim-account\?token=([^&"]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
    app.use('/booking', require('../routes/booking.routes'));
    app.use('/user', require('../routes/auth.routes'));
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
    course = await Course.create({ teacherID: host._id, userName: host.userName, courseTitle: 'Resin Pour', pricePerStudent: 45, capacity: 4, duration: 90, timezone: 'America/New_York' });
    slot = await CourseTimeslot.create({ courseID: course._id, startAt: inDays(5), timezone: 'America/New_York', startDate: inDays(5), startTime: '14:00', capacity: 4, enrollment: 0, status: 'created' });
});

describe('Booking without an account', () => {
    it('creates a placeholder account, books it and emails a set-password link', async () => {
        const res = await bookAsGuest(guestPayment()).expect(200);
        expect(res.body.guestCheckout).toEqual({ email: 'ana@example.com', needsPassword: true });
        expect(res.body.booking.teacherID).toBeUndefined(); // only what the confirmation page needs

        const ana = await User.findOne({ email: 'ana@example.com' });
        expect(ana.passwordSetupRequired).toBe(true);
        expect(ana.isStudent).toBe(true);
        const booking = await Booking.findOne();
        expect(String(booking.studentID)).toBe(String(ana._id));
        expect(booking.studentUserName).toBe(ana.userName);
        expect((await CourseTimeslot.findById(slot._id)).enrollment).toBe(1);
        expect(claimLinkFromEmail()).toBeTruthy();
    });

    it('books under an existing account with that email, without signing in or a set-password link', async () => {
        const existing = await User.create({ firstName: 'Ana', lastName: 'Ruiz', userName: 'anaruiz', email: 'Ana@Example.com', password: 'x', isStudent: true });
        const res = await bookAsGuest(guestPayment()).expect(200);
        expect(res.body.guestCheckout.needsPassword).toBe(false);
        expect(res.body.accessToken).toBeUndefined();
        expect(await User.countDocuments({ email: /ana@example.com/i })).toBe(1);
        expect((await Booking.findOne()).studentUserName).toBe(existing.userName);
        expect(claimLinkFromEmail()).toBeNull();
    });

    it("doesn't let a signed-in user book someone else's guest payment as their own", async () => {
        const other = await User.create({ firstName: 'Max', lastName: 'Lee', userName: 'maxlee', email: 'max@example.com', password: 'x' });
        const payment = guestPayment({ metadata: { ...guestPayment().metadata, studentUserName: 'giapark', guestEmail: '' } });
        stripe.paymentIntents.retrieve.mockResolvedValue(payment);
        await request(app).post('/booking/createBooking').set('Authorization', `Bearer ${tokenFor(other)}`)
            .send({ paymentIntentID: payment.id }).expect(400);
        expect(await Booking.countDocuments()).toBe(0);
    });
});

describe('Claiming a guest account', () => {
    it('sets a password with the emailed link, verifies the email and signs the guest in', async () => {
        await bookAsGuest(guestPayment()).expect(200);
        const token = claimLinkFromEmail();

        const preview = await request(app).get('/user/claim-account').query({ token }).expect(200);
        expect(preview.body).toEqual({ firstName: 'Ana', email: 'ana@example.com' });

        await request(app).post('/user/claim-account').send({ token, password: '123' }).expect(400);
        const res = await request(app).post('/user/claim-account').send({ token, password: 'secret123' }).expect(200);
        expect(res.body.accessToken).toBeTruthy();
        expect(res.body.password).toBeUndefined();

        const ana = await User.findOne({ email: 'ana@example.com' });
        expect(ana.passwordSetupRequired).toBe(false);
        expect(ana.isEmailVerified).toBe(true);
        expect(bcrypt.compareSync('secret123', ana.password)).toBe(true);

        // The link only works once.
        await request(app).post('/user/claim-account').send({ token, password: 'another1' }).expect(409);
    });

    it('rejects forged or wrong-purpose tokens', async () => {
        await bookAsGuest(guestPayment()).expect(200);
        const ana = await User.findOne({ email: 'ana@example.com' });
        await request(app).post('/user/claim-account').send({ token: 'nonsense', password: 'secret123' }).expect(400);
        await request(app).post('/user/claim-account').send({ token: tokenFor(ana), password: 'secret123' }).expect(400);
        expect((await User.findById(ana._id)).passwordSetupRequired).toBe(true);
    });

    it('points guests who try to sign up again to their set-password link', async () => {
        await bookAsGuest(guestPayment()).expect(200);
        const res = await request(app).post('/user/registerUser')
            .send({ firstName: 'Ana', lastName: 'Ruiz', userName: 'ana2', email: 'ana@example.com', password: 'secret123', isStudent: true });
        expect(JSON.stringify(res.body)).toMatch(/booked with this email before/);
    });
});

describe('Guests cancelling', () => {
    const makeBooking = async (guest, overrides = {}) => {
        await CourseTimeslot.updateOne({ _id: slot._id }, { $inc: { enrollment: 2 } });
        return Booking.create({
            numberOfGuests: 2, total: 90, courseTimeslotID: slot._id, courseID: course._id, teacherID: host._id,
            teacherUserName: host.userName, studentUserName: guest.userName, studentID: guest._id,
            paymentIntentID: `pi_${Math.random().toString(36).slice(2)}`, status: 'confirmed', ...overrides,
        });
    };
    let guest;
    beforeEach(async () => {
        guest = await User.create({ firstName: 'Gia', lastName: 'Park', userName: 'giapark', email: 'gia@example.com', password: 'x', isStudent: true });
    });

    it('refunds in full, frees the spots and emails both sides before the day of the session', async () => {
        const booking = await makeBooking(guest);
        stripe.refunds.create.mockResolvedValue({ id: 're_1' });

        const info = await request(app).get(`/booking/studentBookingInfo/${booking._id}`).set('Authorization', `Bearer ${tokenFor(guest)}`).expect(200);
        expect(info.body.canCancel).toBe(true);

        const res = await request(app).post(`/booking/${booking._id}/cancel`).set('Authorization', `Bearer ${tokenFor(guest)}`).expect(200);
        expect(res.body.booking.status).toBe('cancelled by guest');
        expect(res.body.booking.refundStatus).toBe('refunded');
        expect(stripe.refunds.create).toHaveBeenCalledWith(
            expect.objectContaining({ payment_intent: booking.paymentIntentID, reverse_transfer: true, refund_application_fee: true }),
            expect.objectContaining({ idempotencyKey: `guest-cancel-${booking._id}` })
        );
        expect((await CourseTimeslot.findById(slot._id)).enrollment).toBe(0);
        const recipients = emailService.sendEmail.mock.calls.map(([args]) => args.sendTo).sort();
        expect(recipients).toEqual(['gia@example.com', 'lena@example.com']);

        // A second tap doesn't refund twice.
        await request(app).post(`/booking/${booking._id}/cancel`).set('Authorization', `Bearer ${tokenFor(guest)}`).expect(409);
        expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
    });

    it("can't cancel on the day of the session", async () => {
        // Starts later today in New York: past the free-cancellation deadline.
        const later = new Date(Date.now() + 60 * 60 * 1000);
        await CourseTimeslot.updateOne({ _id: slot._id }, { startAt: later });
        const deadline = freeCancellationDeadline({ startAt: later, timezone: 'America/New_York' });
        if (deadline.getTime() > Date.now()) return; // an hour from now is tomorrow in New York; nothing to check
        const booking = await makeBooking(guest);
        const res = await request(app).post(`/booking/${booking._id}/cancel`).set('Authorization', `Bearer ${tokenFor(guest)}`).expect(409);
        expect(res.body.message).toMatch(/day before/);
        expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it("can't cancel someone else's booking", async () => {
        const booking = await makeBooking(guest);
        await request(app).post(`/booking/${booking._id}/cancel`).set('Authorization', `Bearer ${tokenFor(host)}`).expect(403);
        expect((await Booking.findById(booking._id)).status).toBe('confirmed');
    });
});

describe('Free cancellation deadline', () => {
    it('is midnight at the start of the session day in the studio timezone', () => {
        // 2:00 PM Nov 14 in New York (EST, UTC-5) → deadline is 00:00 Nov 14 New York = 05:00 UTC.
        const deadline = freeCancellationDeadline({ startAt: new Date('2030-11-14T19:00:00Z'), timezone: 'America/New_York' });
        expect(deadline.toISOString()).toBe('2030-11-14T05:00:00.000Z');
        // 11:30 PM Nov 14 in Los Angeles is Nov 15 in UTC, but the deadline follows LA's calendar day.
        const la = freeCancellationDeadline({ startAt: new Date('2030-11-15T07:30:00Z'), timezone: 'America/Los_Angeles' });
        expect(la.toISOString()).toBe('2030-11-14T08:00:00.000Z');
    });
});
