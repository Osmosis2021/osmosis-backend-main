const request = require('supertest');
const express = require('express');
const courseRoutes = require('../routes/course.routes');
const errorHandler = require('../middleware/errorHandler');
const listingService = require('../services/listingService');

jest.mock('../services/listingService');

const app = express();
app.use(express.json());
app.use('/api/courses', courseRoutes);
app.use(errorHandler);

describe('Listing Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/courses/getClasses', async () => {
        listingService.getAllListings.mockResolvedValue([{ title: 'Mock Course', _id: '123' }]);

        const res = await request(app)
            .get('/api/courses/getClasses')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Mock Course');
    });

    test('GET /api/courses/getCourse/:id', async () => {
        listingService.getListingById.mockResolvedValue({ title: 'Mock Course', _id: '123' });

        const res = await request(app)
            .get('/api/courses/getCourse/123')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.title).toBe('Mock Course');
    });
});
