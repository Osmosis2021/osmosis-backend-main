/* eslint-env jest */
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const courseRoutes = require('../routes/course.routes');
const errorHandler = require('../middleware/errorHandler');
const experienceService = require('../services/experienceService');
const User = require('../models/user');
const Course = require('../models/course');

jest.mock('../services/experienceService');

const app = express();
app.use(express.json());
app.use('/api/courses', courseRoutes);
app.use(errorHandler);

let mongoServer;
let host;
let auth;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Experience Routes', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await Promise.all([User.deleteMany({}), Course.deleteMany({})]);
        host = await User.create({ firstName: 'H', lastName: 'Ost', userName: 'hostuser', email: 'host@example.com', password: 'x', isTeacher: true });
        auth = { Authorization: `Bearer ${jwt.sign({ userName: host.userName, roles: [205] }, process.env.ACCESS_TOKEN_SECRET)}` };
    });

    test('POST /api/courses/registerCourse - happy path', async () => {
        experienceService.createExperience.mockResolvedValue({ _id: 'mock-id', courseTitle: 'New Experience' });

        const res = await request(app)
            .post('/api/courses/registerCourse')
            .set(auth)
            .send({ courseTitle: 'New Experience' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.course.courseTitle).toBe('New Experience');
        expect(experienceService.createExperience).toHaveBeenCalledWith(expect.objectContaining({ teacherID: String(host._id), userName: 'hostuser' }));
    });

    test('PUT /api/courses/updateCourse/:id - happy path', async () => {
        const course = await Course.create({ teacherID: host._id, userName: host.userName, courseTitle: 'Old' });
        experienceService.updateExperience.mockResolvedValue({ _id: course._id, courseTitle: 'Updated Title' });

        const res = await request(app)
            .put(`/api/courses/updateCourse/${course._id}`)
            .set(auth)
            .send({ courseTitle: 'Updated Title' })
            .expect(200);

        expect(res.body.courseUpdate.courseTitle).toBe('Updated Title');
    });

    test('POST /api/courses/registerCourse - validation error', async () => {
        // For this test, we want to use the real service to test Zod validation
        const realExperienceService = jest.requireActual('../services/experienceService');
        experienceService.createExperience.mockImplementation(realExperienceService.createExperience);

        const res = await request(app)
            .post('/api/courses/registerCourse')
            .set(auth)
            .send({ longitude: 'invalid' })
            .expect(500);

        expect(res.body.success).toBe(false);
    });

    test('DELETE /api/courses/deleteCourse/:id - happy path', async () => {
        const course = await Course.create({ teacherID: host._id, userName: host.userName, courseTitle: 'Old' });
        experienceService.deleteExperience.mockResolvedValue({ _id: course._id });

        const res = await request(app)
            .delete(`/api/courses/deleteCourse/${course._id}`)
            .set(auth)
            .expect(200);

        expect(res.body.success).toBe(true);
    });
});
