const request = require('supertest');
const express = require('express');
const courseRoutes = require('../routes/course.routes');
const errorHandler = require('../middleware/errorHandler');
const experienceService = require('../services/experienceService');

jest.mock('../services/experienceService');

const app = express();
app.use(express.json());
app.use('/api/courses', courseRoutes);
app.use(errorHandler);

describe('Experience Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/courses/registerCourse - happy path', async () => {
        experienceService.createExperience.mockResolvedValue({ _id: 'mock-id', courseTitle: 'New Experience' });

        const res = await request(app)
            .post('/api/courses/registerCourse')
            .send({ courseTitle: 'New Experience' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.course.courseTitle).toBe('New Experience');
    });

    test('PUT /api/courses/updateCourse/:id - happy path', async () => {
        experienceService.updateExperience.mockResolvedValue({ _id: 'mock-id', courseTitle: 'Updated Title' });

        const res = await request(app)
            .put('/api/courses/updateCourse/mock-id')
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
            .send({ longitude: 'invalid' })
            .expect(500);

        expect(res.body.success).toBe(false);
    });

    test('DELETE /api/courses/deleteCourse/:id - happy path', async () => {
        experienceService.deleteExperience.mockResolvedValue({ _id: 'mock-id' });

        const res = await request(app)
            .delete('/api/courses/deleteCourse/mock-id')
            .expect(200);

        expect(res.body.success).toBe(true);
    });
});
