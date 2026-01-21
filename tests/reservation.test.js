const reservationService = require('../services/reservationService');
const CourseTimeslot = require('../models/courseTimeslot');
const Booking = require('../models/booking');

jest.mock('../models/courseTimeslot');
jest.mock('../models/booking');

describe('Reservation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('reservationService.createReservation - happy path', async () => {
        CourseTimeslot.findById.mockResolvedValue({
            _id: 'ts-id',
            enrollment: 0,
            capacity: 10
        });

        CourseTimeslot.findOneAndUpdate.mockResolvedValue({
            _id: 'ts-id',
            enrollment: 1
        });

        Booking.create.mockResolvedValue({
            _id: 'booking-id',
            courseTimeslotID: 'ts-id',
            numberOfGuests: 1
        });

        const data = {
            courseTimeslotID: 'ts-id',
            courseID: 'c-id',
            teacherID: 't-id',
            numberOfGuests: 1
        };

        const booking = await reservationService.createReservation(data);

        expect(booking.courseTimeslotID).toBe('ts-id');
        expect(booking.numberOfGuests).toBe(1);
    });

    test('reservationService.createReservation - over capacity', async () => {
        CourseTimeslot.findById.mockResolvedValue({
            _id: 'ts-id',
            enrollment: 9,
            capacity: 10
        });

        const data = {
            courseTimeslotID: 'ts-id',
            courseID: 'c-id',
            teacherID: 't-id',
            numberOfGuests: 2 // 9 + 2 > 10
        };

        await expect(reservationService.createReservation(data))
            .rejects.toThrow('Not enough capacity');
    });

    test('reservationService.createReservation - atomic failure (race condition)', async () => {
        CourseTimeslot.findById.mockResolvedValue({
            _id: 'ts-id',
            enrollment: 0,
            capacity: 10
        });

        CourseTimeslot.findOneAndUpdate.mockResolvedValue(null);

        const data = {
            courseTimeslotID: 'ts-id',
            courseID: 'c-id',
            teacherID: 't-id',
            numberOfGuests: 1
        };

        await expect(reservationService.createReservation(data))
            .rejects.toThrow('Failed to reserve timeslot (possibly full)');
    });
});
