/* eslint-env jest */
// Phase 3: creating, editing and cancelling sessions of a studio time.
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
let auth;

const daysFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const tokenFor = (user) => jwt.sign({ userName: user.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

const validCourse = (overrides = {}) => ({
    courseTitle: 'Resin Pour Basics',
    pricePerStudent: 45,
    capacity: 4,
    duration: 90,
    timezone: 'America/New_York',
    sessions: [{ date: daysFromNow(10), startTime: '14:00' }],
    ...overrides,
});

const createCourse = async (overrides) => {
    const res = await request(app).post('/course/registerCourse').set(auth).send(validCourse(overrides));
    return res;
};

const bookInto = async (session, { guests = 2, paymentIntentID = `pi_${Math.random()}`, email = 'guest@example.com' } = {}) => {
    const guest = await User.create({ firstName: 'Gia', lastName: 'Park', userName: `guest${Math.random().toString(36).slice(2, 7)}`, email: `${Math.random().toString(36).slice(2, 7)}${email}`, password: 'x' });
    await CourseTimeslot.findByIdAndUpdate(session._id, { $inc: { enrollment: guests } });
    return Booking.create({
        courseTimeslotID: session._id, courseID: session.courseID, studentID: guest._id, studentUserName: guest.userName,
        numberOfGuests: guests, total: 45 * guests, status: 'confirmed', paymentIntentID,
    });
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
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
    auth = { Authorization: `Bearer ${tokenFor(host)}` };
});

describe('Creating a studio time', () => {
    it('stores each session with its exact UTC start, timezone and calendar date', async () => {
        const date = daysFromNow(10);
        const res = await createCourse({ sessions: [{ date, startTime: '14:00' }], timezone: 'America/Los_Angeles' });
        expect(res.status).toBe(200);
        const [slot] = await CourseTimeslot.find({ courseID: res.body.course._id });
        expect(slot.timezone).toBe('America/Los_Angeles');
        expect(slot.startTime).toBe('14:00');
        expect(slot.durationMinutes).toBe(90);
        expect(slot.capacity).toBe(4);
        // 14:00 in Los Angeles is 21:00 or 22:00 UTC depending on daylight saving.
        expect([21, 22]).toContain(slot.startAt.getUTCHours());
        // The calendar day is stored at noon UTC so it displays as the same day everywhere.
        expect(slot.startDate.toISOString()).toBe(`${date}T12:00:00.000Z`);
    });

    it('expands "repeat weekly" into one bookable session per week', async () => {
        const res = await createCourse({ sessions: [{ date: daysFromNow(3), startTime: '10:00', repeatWeeks: 4 }] });
        expect(res.status).toBe(200);
        const slots = await CourseTimeslot.find({ courseID: res.body.course._id }).sort({ startAt: 1 });
        expect(slots).toHaveLength(4);
        expect(slots[1].startAt - slots[0].startAt).toBeGreaterThanOrEqual(7 * 86400000 - 3600000); // a week, ±1h for DST
        expect(new Set(slots.map((s) => s.dayOfWeek)).size).toBe(1);
    });

    it('rejects sessions in the past without creating anything', async () => {
        const res = await createCourse({ sessions: [{ date: daysFromNow(-1), startTime: '10:00' }] });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/past/);
        expect(await Course.countDocuments()).toBe(0);
    });

    it('rejects overlapping sessions', async () => {
        const date = daysFromNow(5);
        const res = await createCourse({ duration: 90, sessions: [{ date, startTime: '14:00' }, { date, startTime: '15:00' }] });
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/overlaps/);
        expect(await Course.countDocuments()).toBe(0);
    });

    it('explains which field is wrong', async () => {
        const res = await createCourse({ courseTitle: '', duration: 50, sessions: [] });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors).toEqual(expect.objectContaining({
            courseTitle: 'Add a title.',
            duration: 'Use 15-minute steps.',
            sessions: 'Add at least one session.',
        }));
    });

    it('accepts lengths from 30 minutes to 4 hours', async () => {
        expect((await createCourse({ duration: 240 })).status).toBe(200);
        expect((await createCourse({ duration: 255, sessions: [{ date: daysFromNow(20), startTime: '09:00' }] })).status).toBe(400);
    });
});

describe('Editing a studio time', () => {
    it('saves edits sent back with existing photos and schedule (previously failed every time)', async () => {
        const { body } = await createCourse();
        const course = await Course.findById(body.course._id);
        const payload = { ...course.toJSON(), courseTitle: 'Resin Pour 2.0', images: [{ public_id: 'x', url: 'https://x', _id: 'y' }], schedule: [{ any: 'thing' }] };
        const res = await request(app).put(`/course/updateCourse/${course._id}`).set(auth).send(payload);
        expect(res.status).toBe(200);
        expect((await Course.findById(course._id)).courseTitle).toBe('Resin Pour 2.0');
    });

    it('applies a new capacity to upcoming sessions, but never below what is booked', async () => {
        const { body } = await createCourse({ capacity: 6 });
        const [slot] = await CourseTimeslot.find({ courseID: body.course._id });
        await bookInto(slot, { guests: 3 });

        const tooLow = await request(app).put(`/course/updateCourse/${body.course._id}`).set(auth).send({ capacity: 2 });
        expect(tooLow.status).toBe(409);
        expect((await CourseTimeslot.findById(slot._id)).capacity).toBe(6);

        await request(app).put(`/course/updateCourse/${body.course._id}`).set(auth).send({ capacity: 8 }).expect(200);
        expect((await CourseTimeslot.findById(slot._id)).capacity).toBe(8);
    });

    it('adds, moves and removes unbooked sessions', async () => {
        const { body } = await createCourse();
        const courseId = body.course._id;
        const added = await request(app).post(`/course/${courseId}/sessions`).set(auth)
            .send({ sessions: [{ date: daysFromNow(12), startTime: '18:00' }] }).expect(201);
        const sessionId = added.body.sessions[0]._id;

        const moved = await request(app).patch(`/course/${courseId}/sessions/${sessionId}`).set(auth)
            .send({ date: daysFromNow(13), startTime: '19:30' }).expect(200);
        expect(moved.body.session.startTime).toBe('19:30');

        const cancelled = await request(app).post(`/course/${courseId}/sessions/${sessionId}/cancel`).set(auth).send({}).expect(200);
        expect(cancelled.body.summary.guests).toBe(0);
        expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it("won't move a session that guests have booked", async () => {
        const { body } = await createCourse();
        const [slot] = await CourseTimeslot.find({ courseID: body.course._id });
        await bookInto(slot);
        const res = await request(app).patch(`/course/${body.course._id}/sessions/${slot._id}`).set(auth)
            .send({ date: daysFromNow(15), startTime: '10:00' });
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/can't change/);
    });

    it("blocks other hosts from managing someone else's sessions", async () => {
        const { body } = await createCourse();
        const [slot] = await CourseTimeslot.find({ courseID: body.course._id });
        const intruder = await User.create({ firstName: 'I', lastName: 'N', userName: 'intruder', email: 'i@example.com', password: 'x', isTeacher: true });
        await request(app).post(`/course/${body.course._id}/sessions/${slot._id}/cancel`)
            .set({ Authorization: `Bearer ${tokenFor(intruder)}` }).send({}).expect(403);
    });
});

describe('Cancelling a booked session', () => {
    it('refunds and emails every booked guest, then hides the session', async () => {
        const { body } = await createCourse();
        const [slot] = await CourseTimeslot.find({ courseID: body.course._id });
        const b1 = await bookInto(slot, { guests: 1, paymentIntentID: 'pi_one' });
        await bookInto(slot, { guests: 2, paymentIntentID: 'pi_two' });
        stripe.refunds.create.mockResolvedValue({ id: 're_1' });

        const res = await request(app).post(`/course/${body.course._id}/sessions/${slot._id}/cancel`).set(auth)
            .send({ note: 'Kiln broke <sorry>' }).expect(200);

        expect(res.body.summary).toEqual({ guests: 3, refunded: 2, refundsNeedingAttention: 0, emailed: 2, emailFailed: 0 });
        expect(stripe.refunds.create).toHaveBeenCalledWith(
            expect.objectContaining({ payment_intent: 'pi_one', reverse_transfer: true, refund_application_fee: true }),
            expect.objectContaining({ idempotencyKey: `cancel-booking-${b1._id}` })
        );
        expect(emailService.sendEmail.mock.calls[0][0].message).toContain('Kiln broke &lt;sorry&gt;');
        expect((await Booking.findById(b1._id)).status).toBe('cancelled by host');

        const listing = await request(app).get(`/course/getCourse/${body.course._id}`).expect(200);
        expect(listing.body.schedule).toHaveLength(0);
    });

    it('keeps going when one refund fails and reports it', async () => {
        const { body } = await createCourse();
        const [slot] = await CourseTimeslot.find({ courseID: body.course._id });
        await bookInto(slot, { paymentIntentID: 'pi_bad' });
        await bookInto(slot, { paymentIntentID: 'pi_good' });
        stripe.refunds.create.mockImplementation(({ payment_intent }) => (payment_intent === 'pi_bad' ? Promise.reject(new Error('card_declined')) : Promise.resolve({})));

        const res = await request(app).post(`/course/${body.course._id}/sessions/${slot._id}/cancel`).set(auth).send({}).expect(200);
        expect(res.body.summary.refunded).toBe(1);
        expect(res.body.summary.refundsNeedingAttention).toBe(1);
        expect(res.body.summary.emailed).toBe(2);
    });

    it('flags older bookings without a linked payment for a manual refund', async () => {
        const { body } = await createCourse();
        const [slot] = await CourseTimeslot.find({ courseID: body.course._id });
        const legacy = await bookInto(slot, { paymentIntentID: undefined });
        await Booking.updateOne({ _id: legacy._id }, { $unset: { paymentIntentID: 1 } });

        const res = await request(app).post(`/course/${body.course._id}/sessions/${slot._id}/cancel`).set(auth).send({}).expect(200);
        expect(res.body.summary.refundsNeedingAttention).toBe(1);
        expect((await Booking.findById(legacy._id)).refundStatus).toBe('manual');
    });

    it("won't delete a studio time with upcoming booked sessions", async () => {
        const { body } = await createCourse();
        const [slot] = await CourseTimeslot.find({ courseID: body.course._id });
        await bookInto(slot);
        const res = await request(app).delete(`/course/deleteCourse/${body.course._id}`).set(auth);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/Cancel/);
        expect(await Course.findById(body.course._id)).not.toBeNull();
    });
});
