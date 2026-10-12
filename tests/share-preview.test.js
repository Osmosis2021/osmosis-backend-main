/* eslint-env jest */
// Link previews (Open Graph data) for listings and artist pages.
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/stripeClient');
jest.mock('cloudinary');

const User = require('../models/user');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const { shareImage } = require('../services/sharePreviewService');

let mongoServer;
let app;
let host;
let course;

const inDays = (days) => new Date(Date.now() + days * 86400000);
const PHOTO = 'https://res.cloudinary.com/demo/image/upload/v1/studio/resin.jpg';

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
    await Promise.all([User.deleteMany({}), Course.deleteMany({}), CourseTimeslot.deleteMany({})]);
    host = await User.create({
        firstName: 'Lena', lastName: 'Ortiz', userName: 'lenaortiz', email: 'lena@example.com', password: 'x',
        isTeacher: true, description: 'Resin artist and teacher.', phoneNumber: '555-0100',
    });
    course = await Course.create({
        teacherID: host._id, userName: host.userName, courseTitle: 'Resin Pour 101', pricePerStudent: 45, capacity: 4, duration: 90,
        timezone: 'America/New_York', courseDescription: 'Pour, swirl and finish a resin coaster set.',
        address: '12 Secret St', addressDetails: { line1: '12 Secret St', city: 'Brooklyn', state: 'NY' },
        images: [{ public_id: 'studio/resin', url: PHOTO }],
    });
});

describe('Listing preview', () => {
    it('has the title, artist, price, city, next date and a cropped photo, but not the street address', async () => {
        await CourseTimeslot.create({ courseID: course._id, startAt: inDays(5), timezone: 'America/New_York', startDate: inDays(5), startTime: '14:00', capacity: 4, enrollment: 0, status: 'created' });
        const res = await request(app).get(`/course/preview/listing/${course._id}`).expect(200);
        expect(res.headers['cache-control']).toMatch(/max-age=300/);
        expect(res.body.title).toBe('Resin Pour 101 with Lena Ortiz | Studio Time');
        expect(res.body.description).toMatch(/^\$45 per guest · 1\.5 hr · Brooklyn, NY · Next: \w{3}, \w{3} \d+ — Pour, swirl/);
        expect(res.body.image).toBe('https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/v1/studio/resin.jpg');
        expect(JSON.stringify(res.body)).not.toMatch(/Secret|555-0100|lena@example/);
    });

    it('leaves out the next date when nothing is scheduled', async () => {
        const res = await request(app).get(`/course/preview/listing/${course._id}`).expect(200);
        expect(res.body.description).not.toMatch(/Next:/);
    });

    it('404s for unknown or malformed ids', async () => {
        await request(app).get(`/course/preview/listing/${new mongoose.Types.ObjectId()}`).expect(404);
        await request(app).get('/course/preview/listing/not-an-id').expect(404);
    });
});

describe('Artist preview', () => {
    it('uses their name, city, bio and a listing photo', async () => {
        const res = await request(app).get('/course/preview/host/lenaortiz').expect(200);
        expect(res.body.title).toBe('Lena Ortiz | Studio Time');
        expect(res.body.description).toBe('Book studio time with Lena in Brooklyn, NY. Resin artist and teacher.');
        expect(res.body.image).toMatch(/w_1200,h_630/);
        expect(res.body.type).toBe('profile');
    });

    it('404s for guests and unknown names', async () => {
        await User.create({ firstName: 'Gia', lastName: 'Park', userName: 'giapark', email: 'gia@example.com', password: 'x', isStudent: true });
        await request(app).get('/course/preview/host/giapark').expect(404);
        await request(app).get('/course/preview/host/nobody').expect(404);
    });
});

describe('shareImage', () => {
    it('leaves non-Cloudinary images alone', () => {
        expect(shareImage('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
        expect(shareImage(undefined)).toBeNull();
    });
});
