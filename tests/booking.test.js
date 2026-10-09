/* eslint-env jest */
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bookingRoutes = require('../routes/booking.routes');
const errorHandler = require('../middleware/errorHandler');
const reservationService = require('../services/reservationService');
const User = require('../models/user');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');

jest.mock('../services/reservationService');
jest.mock('../services/stripeClient');
const stripe = require('../services/stripeClient');

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);
app.use(errorHandler);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Booking Routes', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await Promise.all([User.deleteMany({}), Course.deleteMany({}), CourseTimeslot.deleteMany({})]);
    });

    test('POST /api/bookings/createBooking - happy path', async () => {
        const student = await User.create({ firstName: 'S', lastName: 'T', userName: 'testuser', email: 's@example.com', password: 'x', isStudent: true });
        const course = await Course.create({ teacherID: new mongoose.Types.ObjectId(), userName: 'host', pricePerStudent: 25 });
        const slot = await CourseTimeslot.create({ courseID: course._id, capacity: 3, startTime: '10:00', startDate: new Date('2030-02-01') });
        reservationService.createReservation.mockResolvedValue({ _id: 'booking-id' });
        stripe.paymentIntents.retrieve.mockResolvedValue({
            status: 'succeeded',
            amount: 2500,
            metadata: { courseID: String(course._id), timeslotID: String(slot._id), studentUserName: 'testuser', guests: '1' },
        });

        const res = await request(app)
            .post('/api/bookings/createBooking')
            .set('Authorization', `Bearer ${jwt.sign({ userName: student.userName }, process.env.ACCESS_TOKEN_SECRET)}`)
            .send({ courseTimeslotID: String(slot._id), courseID: String(course._id), numberOfGuests: 1, paymentIntentID: 'pi_123' })
            .expect(200);

        expect(res.body.message).toBe('Booking created successfully');
        expect(reservationService.createReservation).toHaveBeenCalledWith(expect.objectContaining({ studentUserName: 'testuser', total: 25, paymentIntentID: 'pi_123', status: 'confirmed' }));
    });

    test('POST /api/bookings/createBooking - invalid token is rejected', async () => {
        const res = await request(app)
            .post('/api/bookings/createBooking')
            .set('Authorization', 'Bearer invalid-token')
            .send({})
            .expect(403);

        expect(res.body.success).toBe(false);
        expect(reservationService.createReservation).not.toHaveBeenCalled();
    });
});
