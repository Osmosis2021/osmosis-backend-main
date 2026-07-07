const request = require('supertest');
const express = require('express');
const bookingRoutes = require('../routes/booking.routes');
const errorHandler = require('../middleware/errorHandler');
const reservationService = require('../services/reservationService');
const jwt = require('jsonwebtoken');

jest.mock('../services/reservationService');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);
app.use(errorHandler);

describe('Booking Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/bookings/createBooking - happy path', async () => {
        jwt.verify.mockImplementation((token, secret, options, callback) => {
            callback(null, { userName: 'testuser', id: 'student-id' });
        });

        reservationService.createReservation.mockResolvedValue({ _id: 'booking-id' });

        const res = await request(app)
            .post('/api/bookings/createBooking')
            .set('Authorization', 'Bearer valid-token')
            .send({ courseTimeslotID: 'ts-id', courseID: 'c-id', teacherID: 't-id', numberOfGuests: 1 })
            .expect(200);

        expect(res.body.message).toBe('Booking created successfully');
    });

    test('POST /api/bookings/createBooking - unauthorized', async () => {
        jwt.verify.mockImplementation((token, secret, options, callback) => {
            callback(new Error('Invalid token'));
        });

        const res = await request(app)
            .post('/api/bookings/createBooking')
            .set('Authorization', 'Bearer invalid-token')
            .send({})
            .expect(500);

        expect(res.body.success).toBe(false);
    });
});
