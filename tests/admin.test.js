/* eslint-env jest */
// Team tools for outreach: set up an artist, work on their profile, hand it over with a claim link.
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
jest.mock('cloudinary');
jest.mock('../services/emailService', () => ({
    makePasswordResetCode: jest.fn(() => '123456'),
    sendEmail: jest.fn().mockResolvedValue({ id: 'mock' }),
}));

const emailService = require('../services/emailService');
const User = require('../models/user');
const Course = require('../models/course');

let mongoServer;
let app;
let admin;

const tokenFor = (user) => jwt.sign({ userName: user.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
const asAdmin = () => ({ Authorization: `Bearer ${tokenFor(admin)}` });
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const ARTIST = { firstName: 'Mara', lastName: 'Lind', email: 'Mara@Example.com', userName: 'maralind', description: 'Ceramicist in Bushwick.' };

const createArtist = (body = ARTIST) => request(app).post('/admin/artists').set(asAdmin()).send(body);
const actAs = (id) => request(app).post(`/admin/artists/${id}/act`).set(asAdmin());
const claimLinkToken = (link) => decodeURIComponent(link.match(/token=([^&]+)/)[1]);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
    app.use('/admin', require('../routes/admin.routes'));
    app.use('/user', require('../routes/auth.routes'));
    app.use('/stripe', require('../routes/stripe.routes'));
    app.use('/message', require('../routes/message.routes'));
    app.use(require('../middleware/errorHandler'));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Course.deleteMany({})]);
    jest.clearAllMocks();
    admin = await User.create({ firstName: 'Jake', lastName: 'Rader', userName: 'rader_jake', email: 'jake@example.com', password: 'x', isTeacher: true, isAdmin: true });
});

describe('Admin access', () => {
    it('is for team members only', async () => {
        const artist = await User.create({ firstName: 'Ana', lastName: 'R', userName: 'anar', email: 'ana@example.com', password: 'x', isTeacher: true });
        await request(app).get('/admin/artists').set(bearer(tokenFor(artist))).expect(403);
        await request(app).get('/admin/artists').expect(401);
        await request(app).get('/admin/artists').set(asAdmin()).expect(200);
    });

    it("can't be granted through the profile editor", async () => {
        const artist = await User.create({ firstName: 'Ana', lastName: 'R', userName: 'anar', email: 'ana@example.com', password: 'x', isTeacher: true });
        await request(app).put(`/user/updateProfile/${artist._id}`).set(bearer(tokenFor(artist))).send({ newInfo: { isAdmin: true } }).expect(200);
        expect((await User.findById(artist._id)).isAdmin).toBeUndefined();
    });
});

describe('Setting up an artist', () => {
    it('creates an unclaimed artist account under their own name and username', async () => {
        const res = await createArtist().expect(200);
        expect(res.body).toEqual(expect.objectContaining({ userName: 'maralind', email: 'mara@example.com', claimed: false, listings: 0, payoutsReady: false }));
        const artist = await User.findOne({ userName: 'maralind' });
        expect(artist.isTeacher).toBe(true);
        expect(artist.passwordSetupRequired).toBe(true);
        expect(String(artist.createdByAdmin)).toBe(String(admin._id));
        expect(artist.isAdmin).toBeUndefined();

        const list = await request(app).get('/admin/artists').set(asAdmin()).expect(200);
        expect(list.body.map((a) => a.userName)).toEqual(['maralind']);
    });

    it('checks the details and refuses duplicates', async () => {
        await createArtist({ ...ARTIST, email: 'nope' }).expect(400);
        await createArtist({ ...ARTIST, userName: 'has space' }).expect(400);
        await createArtist().expect(200);
        const dupeEmail = await createArtist({ ...ARTIST, userName: 'other' }).expect(409);
        expect(dupeEmail.body.message).toMatch(/email already exists/);
        await createArtist({ ...ARTIST, email: 'new@example.com' }).expect(409);
    });
});

describe('Working on an unclaimed artist profile', () => {
    it("gives short-lived access that can edit the artist's profile", async () => {
        const { body: artist } = await createArtist().expect(200);
        const { body } = await actAs(artist._id).expect(200);
        expect(body.user.userName).toBe('maralind');
        expect(body.actingAs.adminName).toBe('Jake');
        expect(jwt.decode(body.user.accessToken).actingBy).toBe(String(admin._id));

        await request(app).put(`/user/updateProfile/${artist._id}`).set(bearer(body.user.accessToken))
            .send({ newInfo: { description: 'Wheel-thrown ceramics.' } }).expect(200);
        expect((await User.findById(artist._id)).description).toBe('Wheel-thrown ceramics.');
    });

    it("can't set up payouts, message people or use the admin tools as the artist", async () => {
        const { body: artist } = await createArtist().expect(200);
        const { body } = await actAs(artist._id).expect(200);
        const acting = bearer(body.user.accessToken);
        const payouts = await request(app).post('/stripe/payouts/onboarding-link').set(acting).expect(403);
        expect(payouts.body.message).toMatch(/after claiming/);
        await request(app).post('/message/sendMessage').set(acting).send({ chatId: new mongoose.Types.ObjectId(), content: 'hi' }).expect(403);
        await request(app).get('/admin/artists').set(acting).expect(403);
    });

    it('stops working the moment the artist claims the account', async () => {
        const { body: artist } = await createArtist().expect(200);
        const { body } = await actAs(artist._id).expect(200);
        const { body: invite } = await request(app).post(`/admin/artists/${artist._id}/invite`).set(asAdmin()).send({}).expect(200);

        await request(app).post('/user/claim-account').send({ token: claimLinkToken(invite.link), password: 'secret123' }).expect(200);

        const res = await request(app).put(`/user/updateProfile/${artist._id}`).set(bearer(body.user.accessToken))
            .send({ newInfo: { description: 'changed by the team' } }).expect(403);
        expect(res.body.message).toMatch(/claimed/);
        await request(app).get('/stripe/payouts/status').set(bearer(body.user.accessToken)).expect(403);
        await actAs(artist._id).expect(409);
        await request(app).post(`/admin/artists/${artist._id}/invite`).set(asAdmin()).send({}).expect(409);
    });

    it("isn't possible for real users' accounts", async () => {
        const real = await User.create({ firstName: 'Ana', lastName: 'R', userName: 'anar', email: 'ana@example.com', password: 'x', isTeacher: true });
        await actAs(real._id).expect(409);
        const guest = await User.create({ firstName: 'Gia', lastName: 'P', userName: 'giap', email: 'gia@example.com', password: 'x', isStudent: true, passwordSetupRequired: true });
        await actAs(guest._id).expect(409); // guest-checkout accounts aren't artist accounts
    });
});

describe('Handing over', () => {
    it('makes a claim link that lands on their profile, and emails it on request', async () => {
        const { body: artist } = await createArtist().expect(200);
        await Course.create({ teacherID: artist._id, userName: 'maralind', courseTitle: 'Throw your first bowl', pricePerStudent: 60, capacity: 4 });

        const { body: copyOnly } = await request(app).post(`/admin/artists/${artist._id}/invite`).set(asAdmin()).send({}).expect(200);
        expect(copyOnly.link).toMatch(/\/claim-account\?token=.+&next=%2Fteachers%2Fmaralind$/);
        expect(copyOnly.emailed).toBe(false);
        expect(emailService.sendEmail).not.toHaveBeenCalled();

        const { body: emailed } = await request(app).post(`/admin/artists/${artist._id}/invite`).set(asAdmin()).send({ sendEmail: true }).expect(200);
        expect(emailed.emailed).toBe(true);
        const [email] = emailService.sendEmail.mock.calls[0];
        expect(email.sendTo).toBe('mara@example.com');
        expect(email.subject).toBe('Jake set up your studio on Studio Time');
        expect(email.message).toContain('Throw your first bowl');
        expect(email.message).toContain('claim-account?token=');

        const preview = await request(app).get('/user/claim-account').query({ token: claimLinkToken(emailed.link) }).expect(200);
        expect(preview.body).toEqual(expect.objectContaining({ firstName: 'Mara', isArtist: true, userName: 'maralind' }));
    });

    it('points artists who try to sign up to their claim link', async () => {
        await createArtist().expect(200);
        const res = await request(app).post('/user/registerUser')
            .send({ firstName: 'Mara', lastName: 'Lind', userName: 'mara2', email: 'mara@example.com', password: 'secret123', isTeacher: true });
        expect(JSON.stringify(res.body)).toMatch(/Your studio is already set up/);
    });
});
