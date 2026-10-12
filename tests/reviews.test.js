/* eslint-env jest */
// Guests reviewing past sessions, and the "how was it?" email the morning after.
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

const emailService = require('../services/emailService');
const User = require('../models/user');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const Booking = require('../models/booking');
const { sendDueReviewRequests, reviewRequestTime } = require('../services/reviewService');

let mongoServer;
let app;
let host;
let guest;
let course;

const tokenFor = (user) => jwt.sign({ userName: user.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
const hoursFromNow = (hours) => new Date(Date.now() + hours * 3600000);

const makeBooking = async (startAt, extra = {}) => {
    const slot = await CourseTimeslot.create({
        courseID: course._id, startAt, timezone: 'America/New_York', startDate: startAt, startTime: '14:00',
        durationMinutes: 90, capacity: 4, enrollment: 1, status: 'created',
    });
    return Booking.create({
        numberOfGuests: 1, total: 45, courseTimeslotID: slot._id, courseID: course._id, teacherID: host._id,
        teacherUserName: host.userName, studentUserName: guest.userName, studentID: guest._id,
        date: startAt.toISOString(), time: '14:00', status: 'confirmed', ...extra,
    });
};

const review = (booking, body, user = guest) => request(app)
    .post(`/booking/${booking._id}/review`).set('Authorization', `Bearer ${tokenFor(user)}`).send(body);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
    app.use('/booking', require('../routes/booking.routes'));
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
});

describe('Leaving a review', () => {
    it('saves stars and text on the booking and shows it on the listing', async () => {
        const booking = await makeBooking(hoursFromNow(-48));
        const res = await review(booking, { rating: 5, text: '  Loved it!  ' }).expect(200);
        expect(res.body.booking).toEqual(expect.objectContaining({ rating: 5, review: 'Loved it!', ratedAndReviewed: true }));
        const saved = await Course.findById(course._id);
        expect(saved.feedback).toHaveLength(1);
        expect(saved.feedback[0]).toEqual(expect.objectContaining({ rating: 5, reviews: 'Loved it!' }));
        expect(String(saved.feedback[0].bookingID)).toBe(String(booking._id));
    });

    it('accepts stars without text', async () => {
        const booking = await makeBooking(hoursFromNow(-48));
        await review(booking, { rating: 4 }).expect(200);
    });

    it('needs 1 to 5 whole stars', async () => {
        const booking = await makeBooking(hoursFromNow(-48));
        await review(booking, {}).expect(400);
        await review(booking, { rating: 0 }).expect(400);
        await review(booking, { rating: 6 }).expect(400);
        await review(booking, { rating: 3.5 }).expect(400);
        await review(booking, { rating: 5, text: 'x'.repeat(1001) }).expect(400);
    });

    it('only after the session has ended', async () => {
        const booking = await makeBooking(hoursFromNow(-1)); // 90 minutes long, still going
        const res = await review(booking, { rating: 5 }).expect(409);
        expect(res.body.message).toMatch(/once the session is over/);
    });

    it('once per booking', async () => {
        const booking = await makeBooking(hoursFromNow(-48));
        await review(booking, { rating: 5 }).expect(200);
        await review(booking, { rating: 1 }).expect(409);
        expect((await Course.findById(course._id)).feedback).toHaveLength(1);
    });

    it("not for cancelled bookings or someone else's booking", async () => {
        const cancelled = await makeBooking(hoursFromNow(-48), { status: 'cancelled by host' });
        await review(cancelled, { rating: 5 }).expect(409);
        const theirs = await makeBooking(hoursFromNow(-48));
        await review(theirs, { rating: 1 }, host).expect(403);
    });
});

describe('Review request emails', () => {
    it('goes out once, the morning after, with a link to the booking', async () => {
        // A session at 2pm New York time three days ago.
        const start = new Date(Date.UTC(2030, 5, 10, 18, 0)); // June 10 2030, 2pm EDT
        const booking = await makeBooking(start);
        const due = reviewRequestTime(await CourseTimeslot.findById(booking.courseTimeslotID), course);
        expect(due.toISOString()).toBe('2030-06-11T13:00:00.000Z'); // 9am EDT next day

        expect(await sendDueReviewRequests(new Date('2030-06-11T12:00:00Z'))).toBe(0); // 8am: too early
        expect(await sendDueReviewRequests(new Date('2030-06-11T13:05:00Z'))).toBe(1);
        expect(await sendDueReviewRequests(new Date('2030-06-11T14:05:00Z'))).toBe(0); // never twice

        const [email] = emailService.sendEmail.mock.calls[0];
        expect(email.sendTo).toBe('gia@example.com');
        expect(email.subject).toBe('How was Resin Pour?');
        expect(email.message).toContain(`/student/bookings/${booking._id}`);
    });

    it('skips cancelled, already-reviewed and old sessions', async () => {
        const start = new Date(Date.UTC(2030, 5, 10, 18, 0));
        await makeBooking(start, { status: 'cancelled by guest' });
        await makeBooking(start, { ratedAndReviewed: true, rating: 5 });
        expect(await sendDueReviewRequests(new Date('2030-06-11T13:05:00Z'))).toBe(0);
        await makeBooking(start);
        expect(await sendDueReviewRequests(new Date('2030-06-30T13:05:00Z'))).toBe(0); // weeks later
        expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
});
