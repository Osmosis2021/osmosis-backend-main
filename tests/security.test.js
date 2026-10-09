/* eslint-env jest */
// Integration tests for the Phase 0 security fixes, run against an in-memory MongoDB.
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/stripeClient');
jest.mock('cloudinary');
jest.mock('../services/emailService', () => ({
    makePasswordResetCode: jest.fn(() => '123456'),
    sendVerificationEmail: jest.fn().mockResolvedValue(),
    sendResendVerificationEmail: jest.fn().mockResolvedValue(),
    sendUpdatedEmailVerification: jest.fn().mockResolvedValue(),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(),
    sendEmail: jest.fn().mockResolvedValue({ id: 'mock' }),
}));

const stripe = require('../services/stripeClient');
const User = require('../models/user');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const Chat = require('../models/chat');
const Message = require('../models/message');

let mongoServer;
let app;

// "YYYY-MM-DD" a number of days from today.
const daysFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const tokenFor = (user) => jwt.sign({ userName: user.userName, roles: [2119] }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

const makeUser = (overrides = {}) => User.create({
    firstName: 'Test',
    lastName: 'User',
    userName: `user${Math.random().toString(36).slice(2, 8)}`,
    email: `${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: bcrypt.hashSync('password123', 4),
    refreshToken: 'secret-refresh-token',
    resetCode: '999999',
    emailVerificationCode: '888888',
    phoneNumber: '555-0100',
    customerStripeID: 'cus_secret',
    ...overrides,
});

const makeCourse = (host, overrides = {}) => Course.create({
    teacherID: host._id,
    userName: host.userName,
    courseTitle: 'Resin Pour 101',
    pricePerStudent: 40,
    capacity: 4,
    ...overrides,
});

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/user', require('../routes/auth.routes'));
    app.use('/course', require('../routes/course.routes'));
    app.use('/booking', require('../routes/booking.routes'));
    app.use('/chat', require('../routes/chat.routes'));
    app.use('/message', require('../routes/message.routes'));
    app.use('/stripe', require('../routes/stripe.routes'));
    app.use('/email', require('../routes/email.routes'));
    app.use(require('../middleware/errorHandler'));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Course.deleteMany({}), CourseTimeslot.deleteMany({}), Chat.deleteMany({}), Message.deleteMany({})]);
    jest.clearAllMocks();
});

const SECRET_FIELDS = ['password', 'refreshToken', 'resetCode', 'emailVerificationCode'];
const expectNoSecrets = (obj) => SECRET_FIELDS.forEach((field) => expect(obj).not.toHaveProperty(field));

describe('No secrets or private data in responses', () => {
    it('getUserInfo returns only public fields to other people', async () => {
        const host = await makeUser({ isTeacher: true });
        const res = await request(app).get(`/user/getUserInfo/${host.userName}`).expect(200);
        expectNoSecrets(res.body);
        expect(res.body).not.toHaveProperty('email');
        expect(res.body).not.toHaveProperty('phoneNumber');
        expect(res.body).not.toHaveProperty('customerStripeID');
        expect(res.body.firstName).toBe('Test');
    });

    it('getUserInfo returns the full (secret-free) profile to the owner', async () => {
        const me = await makeUser();
        const res = await request(app).get(`/user/getUserInfo/${me.userName}`).set('Authorization', `Bearer ${tokenFor(me)}`).expect(200);
        expectNoSecrets(res.body);
        expect(res.body.email).toBe(me.email);
        expect(res.body.phoneNumber).toBe('555-0100');
    });

    it('login does not return the password hash or tokens stored on the user', async () => {
        const me = await makeUser();
        const res = await request(app).post('/user/login').send({ email: me.email, password: 'password123', persist: true }).expect(200);
        expectNoSecrets(res.body);
        expect(res.body.accessToken).toBeTruthy();
    });

    it('listings do not leak host secrets or contact details', async () => {
        const host = await makeUser({ isTeacher: true });
        await makeCourse(host);
        const res = await request(app).get('/course/getClasses').expect(200);
        expectNoSecrets(res.body[0].teacherID);
        expect(res.body[0].teacherID).not.toHaveProperty('email');
        expect(res.body[0].teacherID.userName).toBe(host.userName);
    });
});

describe('Google sign-in verifies the credential', () => {
    const realFetch = global.fetch;
    afterEach(() => { global.fetch = realFetch; });

    const mockTokenInfo = (claims, ok = true) => {
        global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => claims });
    };

    it('rejects a forged token that Google does not recognise', async () => {
        const victim = await makeUser({ email: 'victim@example.com' });
        mockTokenInfo({ error: 'invalid_token' }, false);
        const forged = jwt.sign({ email: victim.email, sub: '1' }, 'attacker-key');
        const res = await request(app).post('/user/google-login').send({ credential: forged });
        expect(res.status).toBe(401);
        expect(res.body.accessToken).toBeUndefined();
    });

    it('rejects a token issued for a different app', async () => {
        mockTokenInfo({ aud: 'someone-else', iss: 'accounts.google.com', email: 'a@example.com', email_verified: 'true', sub: '1' });
        const res = await request(app).post('/user/google-login').send({ credential: 'x' });
        expect(res.status).toBe(401);
    });

    const genuine = (overrides = {}) => ({ aud: process.env.GOOGLE_CLIENT_ID, iss: 'https://accounts.google.com', email: 'new@example.com', email_verified: 'true', sub: 'g-123', given_name: 'Ana', family_name: 'Lee', ...overrides });

    it('signs up a new guest with a genuine token and returns no secrets', async () => {
        mockTokenInfo(genuine());
        stripe.customers.create.mockResolvedValue({ id: 'cus_new' });
        const res = await request(app).post('/user/google-login').send({ credential: 'genuine', role: 'guest' }).expect(200);
        expect(res.body.email).toBe('new@example.com');
        expect(res.body.isNewUser).toBe(true);
        expectNoSecrets(res.body);
        expect(global.fetch.mock.calls[0][0]).toContain('oauth2.googleapis.com/tokeninfo');
    });

    it('asks a brand-new user to choose a role instead of guessing', async () => {
        mockTokenInfo(genuine());
        const res = await request(app).post('/user/google-login').send({ credential: 'genuine' }).expect(200);
        expect(res.body).toEqual({ needsRole: true, firstName: 'Ana' });
        expect(await User.countDocuments()).toBe(0);
    });

    it('creates a host account when the user picks artist', async () => {
        mockTokenInfo(genuine());
        stripe.accounts.create.mockResolvedValue({ id: 'acct_new' });
        const res = await request(app).post('/user/google-login').send({ credential: 'genuine', role: 'artist' }).expect(200);
        expect(res.body.isTeacher).toBe(true);
        expect(res.body.roles).toEqual(expect.arrayContaining([2119, 205]));
    });

    it('gives Google users the base role so they can reach chat, settings and checkout', async () => {
        const existing = await makeUser({ email: 'ana@example.com', isStudent: true });
        mockTokenInfo(genuine({ email: 'Ana@Example.com' }));
        const res = await request(app).post('/user/google-login').send({ credential: 'genuine' }).expect(200);
        expect(res.body._id).toBe(String(existing._id)); // matched despite different capitalisation
        expect(res.body.roles).toEqual(expect.arrayContaining([2119, 1920]));
        expect(res.body.isNewUser).toBe(false);
    });

    it('keeps the session cookie for 30 days', async () => {
        await makeUser({ email: 'ana@example.com' });
        mockTokenInfo(genuine({ email: 'ana@example.com' }));
        const res = await request(app).post('/user/google-login').send({ credential: 'genuine' }).expect(200);
        const cookie = res.headers['set-cookie'].find(c => c.startsWith('jwt='));
        expect(cookie).toMatch(/Max-Age=2592000/);
        expect(cookie).toMatch(/HttpOnly/);
    });

    it('explains when Google sign-in is not configured on the server', async () => {
        const env = require('../config/env');
        const original = env.GOOGLE_CLIENT_ID;
        env.GOOGLE_CLIENT_ID = '';
        try {
            const res = await request(app).post('/user/google-login').send({ credential: 'x' }).expect(503);
            expect(res.body.message).toMatch(/email and password/);
        } finally {
            env.GOOGLE_CLIENT_ID = original;
        }
    });
});

describe('Email and password sign-in', () => {
    it('matches the email regardless of capitalisation and includes the base role', async () => {
        await makeUser({ email: 'mia@example.com', isTeacher: true });
        const res = await request(app).post('/user/login').send({ email: 'Mia@Example.com', password: 'password123', persist: true }).expect(200);
        expect(res.body.roles).toEqual(expect.arrayContaining([2119, 205]));
    });

    it('refresh returns the same roles and no secrets', async () => {
        await makeUser({ email: 'mia@example.com', isStudent: true });
        const login = await request(app).post('/user/login').send({ email: 'mia@example.com', password: 'password123', persist: true }).expect(200);
        const cookie = login.headers['set-cookie'].find(c => c.startsWith('jwt=')).split(';')[0];
        const res = await request(app).get('/user/refresh').set('Cookie', cookie).expect(200);
        expect(res.body.roles).toEqual(expect.arrayContaining([2119, 1920]));
        expectNoSecrets(res.body);
    });

    it('treats an email that differs only by case as already registered', async () => {
        await makeUser({ email: 'mia@example.com' });
        const res = await request(app).post('/user/registerUser').send({ email: 'MIA@example.com', userName: 'brandnew1', password: 'x123456', firstName: 'M', lastName: 'K', isStudent: true }).expect(200);
        expect(res.body.success).toBe(false);
    });
});

describe('Studio time routes require the owning host', () => {
    it('rejects creating a studio time without signing in', async () => {
        await request(app).post('/course/registerCourse').send({ courseTitle: 'x' }).expect(401);
    });

    it('rejects creating a studio time as a guest', async () => {
        const guest = await makeUser({ isStudent: true });
        await request(app).post('/course/registerCourse').set('Authorization', `Bearer ${tokenFor(guest)}`).send({ courseTitle: 'x' }).expect(403);
    });

    it('always records the signed-in host as the owner', async () => {
        const host = await makeUser({ isTeacher: true });
        const other = await makeUser({ isTeacher: true });
        const res = await request(app).post('/course/registerCourse')
            .set('Authorization', `Bearer ${tokenFor(host)}`)
            .send({
                courseTitle: 'Mine', pricePerStudent: 40, capacity: 4, duration: 60,
                sessions: [{ date: daysFromNow(30), startTime: '14:00' }],
                teacherID: String(other._id), userName: other.userName,
            })
            .expect(200);
        expect(res.body.course.teacherID).toBe(String(host._id));
        expect(res.body.course.userName).toBe(host.userName);
    });

    it("rejects editing or deleting another host's studio time", async () => {
        const host = await makeUser({ isTeacher: true });
        const intruder = await makeUser({ isTeacher: true });
        const course = await makeCourse(host);
        const auth = { Authorization: `Bearer ${tokenFor(intruder)}` };
        await request(app).put(`/course/updateCourse/${course._id}`).set(auth).send({ courseTitle: 'pwned' }).expect(403);
        await request(app).delete(`/course/deleteCourse/${course._id}`).set(auth).expect(403);
        await request(app).delete(`/course/${course._id}`).set(auth).expect(403);
        expect((await Course.findById(course._id)).courseTitle).toBe('Resin Pour 101');
    });

    it('lets the owner update their studio time', async () => {
        const host = await makeUser({ isTeacher: true });
        const course = await makeCourse(host);
        await request(app).put(`/course/updateCourse/${course._id}`).set('Authorization', `Bearer ${tokenFor(host)}`).send({ courseTitle: 'Renamed' }).expect(200);
        expect((await Course.findById(course._id)).courseTitle).toBe('Renamed');
    });

    it('returns 403 for an expired token so the app can refresh it', async () => {
        const host = await makeUser({ isTeacher: true });
        const expired = jwt.sign({ userName: host.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -10 });
        await request(app).post('/course/registerCourse').set('Authorization', `Bearer ${expired}`).send({}).expect(403);
    });
});

describe('Profile updates', () => {
    it("rejects updating someone else's profile", async () => {
        const me = await makeUser();
        const victim = await makeUser();
        await request(app).put(`/user/updateProfile/${victim._id}`).set('Authorization', `Bearer ${tokenFor(me)}`).send({ newInfo: { firstName: 'Hacked' } }).expect(403);
        expect((await User.findById(victim._id)).firstName).toBe('Test');
    });

    it('ignores fields users are not allowed to change', async () => {
        const me = await makeUser({ isStudent: true });
        await request(app).put(`/user/updateProfile/${me._id}`).set('Authorization', `Bearer ${tokenFor(me)}`)
            .send({ newInfo: { firstName: 'Ana', isTeacher: true, stripeID: 'acct_evil', isEmailVerified: true, password: 'x' } })
            .expect(200);
        const saved = await User.findById(me._id);
        expect(saved.firstName).toBe('Ana');
        expect(saved.isTeacher).toBe(false);
        expect(saved.stripeID).toBeUndefined();
        expect(bcrypt.compareSync('password123', saved.password)).toBe(true);
    });

    it('still accepts the token in the body (Settings form)', async () => {
        const me = await makeUser();
        await request(app).put(`/user/updateProfile/${me._id}`).send({ auth: { accessToken: tokenFor(me) }, newInfo: { lastName: 'Kim' } }).expect(200);
    });

    it('rejects taking a username that already exists', async () => {
        const me = await makeUser();
        const other = await makeUser();
        await request(app).put(`/user/updateProfile/${me._id}`).set('Authorization', `Bearer ${tokenFor(me)}`).send({ newInfo: { userName: other.userName } }).expect(400);
    });

    it('deletes an account only with the right password, sent in the body', async () => {
        const me = await makeUser();
        const auth = { Authorization: `Bearer ${tokenFor(me)}` };
        await request(app).delete(`/user/deleteProfile/${me._id}`).set(auth).send({ password: 'wrong' }).expect(401);
        await request(app).delete(`/user/deleteProfile/${me._id}`).set(auth).send({ password: 'password123' }).expect(200);
        expect(await User.findById(me._id)).toBeNull();
    });
});

describe('Messaging', () => {
    it('sends as the signed-in user even if the body claims otherwise', async () => {
        const a = await makeUser();
        const b = await makeUser();
        const chat = await Chat.create({ users: [a._id, b._id] });
        const res = await request(app).post('/message/sendMessage').set('Authorization', `Bearer ${tokenFor(a)}`)
            .send({ chatId: String(chat._id), content: 'hi', _id: String(b._id) }).expect(200);
        expect(res.body.sender._id).toBe(String(a._id));
    });

    it("blocks reading or posting in a chat you're not part of", async () => {
        const a = await makeUser();
        const b = await makeUser();
        const outsider = await makeUser();
        const chat = await Chat.create({ users: [a._id, b._id] });
        const auth = { Authorization: `Bearer ${tokenFor(outsider)}` };
        await request(app).get(`/message/allMessages/${chat._id}`).set(auth).expect(403);
        await request(app).post('/message/sendMessage').set(auth).send({ chatId: String(chat._id), content: 'x' }).expect(403);
    });

    it('user search does not expose emails or secrets', async () => {
        const me = await makeUser();
        await makeUser({ userName: 'resinqueen' });
        const res = await request(app).get('/chat/allUsers?search=resin').set('Authorization', `Bearer ${tokenFor(me)}`).expect(200);
        expect(res.body).toHaveLength(1);
        expectNoSecrets(res.body[0]);
        expect(res.body[0]).not.toHaveProperty('email');
    });
});

describe('Bookings', () => {
    it("returns an empty list when viewing someone else's bookings", async () => {
        const host = await makeUser({ isTeacher: true });
        const res = await request(app).get(`/booking/teacherBookings/${host.userName}`).expect(200);
        expect(res.body).toEqual([]);
    });

    it('books as the signed-in guest and prices the booking from the database', async () => {
        const host = await makeUser({ isTeacher: true });
        const guest = await makeUser({ isStudent: true });
        const course = await makeCourse(host);
        const slot = await CourseTimeslot.create({ courseID: course._id, capacity: 4, enrollment: 0, startTime: '14:00', startDate: new Date('2030-01-05') });
        stripe.paymentIntents.retrieve.mockResolvedValue({
            id: 'pi_ok', status: 'succeeded', amount: 8000,
            metadata: { courseID: String(course._id), timeslotID: String(slot._id), studentUserName: guest.userName, guests: '2' },
        });
        const res = await request(app).post('/booking/createBooking').set('Authorization', `Bearer ${tokenFor(guest)}`)
            .send({ courseID: String(course._id), courseTimeslotID: String(slot._id), numberOfGuests: 2, total: 1, studentUserName: 'someoneelse', paymentIntentID: 'pi_ok' })
            .expect(200);
        expect(res.body.booking.studentUserName).toBe(guest.userName);
        expect(res.body.booking.total).toBe(80);
    });
});

describe('Payments', () => {
    it('charges the database price once (not 100x) and pays the real host', async () => {
        const host = await makeUser({ isTeacher: true, stripeID: 'acct_host' });
        const guest = await makeUser({ isStudent: true, customerStripeID: 'cus_guest' });
        const course = await makeCourse(host, { pricePerStudent: 40 });
        const slot = await CourseTimeslot.create({ courseID: course._id, capacity: 4, enrollment: 0, startTime: '14:00', startDate: new Date('2030-01-05') });
        stripe.accounts.retrieve.mockResolvedValue({ payouts_enabled: true });
        stripe.paymentIntents.create.mockResolvedValue({ client_secret: 'pi_secret' });

        await request(app).post('/stripe/create-payment-intent').set('Authorization', `Bearer ${tokenFor(guest)}`)
            .send({ courseID: String(course._id), timeslotID: String(slot._id), guests: 2, amount: 1, stripeID: 'acct_attacker', customerStripeID: 'cus_victim' })
            .expect(200);

        const options = stripe.paymentIntents.create.mock.calls[0][0];
        expect(options.amount).toBe(8000); // $40 x 2 guests, in cents
        expect(options.application_fee_amount).toBe(Math.round(8000 * 0.099) + 30);
        expect(options.transfer_data.destination).toBe('acct_host');
        expect(options.customer).toBe('cus_guest');
    });

    it('requires sign-in to start a payment', async () => {
        await request(app).post('/stripe/create-payment-intent').send({ courseID: new mongoose.Types.ObjectId().toString(), guests: 1 }).expect(401);
    });

    it("refuses Stripe onboarding links for someone else's account", async () => {
        const host = await makeUser({ isTeacher: true, stripeID: 'acct_host' });
        const intruder = await makeUser({ isTeacher: true, stripeID: 'acct_intruder' });
        await request(app).get('/stripe/accountLink/acct_host').set('Authorization', `Bearer ${tokenFor(intruder)}`).expect(403);
        expect(stripe.accountLinks.create).not.toHaveBeenCalled();
        expect(host).toBeTruthy();
    });
});

describe('Password reset codes', () => {
    it('rejects expired codes', async () => {
        const me = await makeUser({ resetCode: '123456', resetCodeExpires: new Date(Date.now() - 1000) });
        const res = await request(app).get(`/email/verifyResetCode/${me.email}/123456`).expect(400);
        expect(res.body.result).toMatch(/expired/);
    });

    it('locks out after repeated wrong guesses', async () => {
        const me = await makeUser();
        await request(app).get(`/email/sendResetCode/${me.email}`).expect(200);
        for (let i = 0; i < 5; i++) {
            await request(app).get(`/email/verifyResetCode/${me.email}/000000`).expect(400);
        }
        await request(app).get(`/email/verifyResetCode/${me.email}/123456`).expect(429);
    });

    it('resets the password with a valid, fresh code', async () => {
        const me = await makeUser();
        await request(app).get(`/email/sendResetCode/${me.email}`).expect(200);
        await request(app).patch(`/email/updatePassword/${me.email}/123456`).send({ password: 'newpass123' }).expect(200);
        expect(bcrypt.compareSync('newpass123', (await User.findById(me._id)).password)).toBe(true);
    });
});
