const router = require('express').Router();
const Booking = require('../models/booking');
const CourseTimeslot = require('../models/courseTimeslot');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const jwtSecret = env.ACCESS_TOKEN_SECRET


const reservationService = require('../services/reservationService');

router.post('/createBooking', async (req, res, next) => {
    const accessToken = req?.headers?.authorization?.slice(7)
    console.log('accessToken', accessToken)
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        console.log('userData', userData)
        try {
            if (err) throw err;
            const booking = await reservationService.createReservation(req.body);

            res.json({
                success: true,
                message: 'Booking created successfully',
                booking
            });
        } catch (err) {
            console.log('Error in /createBooking', err);
            next(err);
        }
    })
})


// ROUTE TO POPULATE BOOKINGS FOR STUDENT PROFILE
router.get('/bookings/:userName', async (req, res, next) => {
    const accessToken = req?.headers?.authorization?.slice(7)
    const { userName } = req.params

    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if (err) throw err;
            const studentBookings = await reservationService.getStudentReservations(userName);
            res.json(studentBookings)
        } catch (error) {
            console.log('Error in /bookings', error)
            next(error);
        }
    })
})

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE
router.get('/teacherBookings/:userName', async (req, res, next) => {
    const { userName } = req.params
    try {
        const teacher = await reservationService.getArtistReservations(userName);
        res.json(teacher)
    } catch (err) {
        console.log('Error in /teacherBookings', err)
        next(err);
    }
})

// ROUTE FOR TEACHER SINGLE BOOKING
router.get('/teacherBookingInfo/:bookingID', async (req, res, next) => {
    const accessToken = req?.headers?.authorization?.slice(7)
    const { bookingID } = req.params
    console.log('[API] Fetching Teacher Booking Info for ID:', bookingID);
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if (err) throw err;
            const booking = await reservationService.getReservationById(bookingID);

            if (!booking) {
                console.warn(`[API] Booking not found: ${bookingID}`);
                return res.status(404).json({ message: 'Booking not found' });
            }

            // Authorization: User must be the student or the teacher for this booking
            if (booking.studentUserName !== userData.userName && booking.teacherUserName !== userData.userName) {
                console.warn(`[API] Unauthorized access attempt to booking ${bookingID} by ${userData.userName}`);
                return res.status(403).json({ message: 'You do not have permission to view this booking' });
            }

            res.json(booking)
        } catch (error) {
            console.error('[API ERROR] /teacherBookingInfo:', {
                id: bookingID,
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    })
})


router.get('/studentBookingInfo/:bookingID', async (req, res, next) => {
    const accessToken = req?.headers?.authorization?.slice(7)
    const { bookingID } = req.params
    console.log('[API] Fetching Student Booking Info for ID:', bookingID);
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if (err) throw err;
            const studentBooking = await reservationService.getReservationById(bookingID);
            if (!studentBooking) {
                console.warn(`[API] Booking not found: ${bookingID}`);
                return res.status(404).json({ message: 'Booking not found' });
            }

            // Authorization check
            if (studentBooking.studentUserName !== userData.userName && studentBooking.teacherUserName !== userData.userName) {
                console.warn(`[API] Unauthorized access attempt to booking ${bookingID} by ${userData.userName}`);
                return res.status(403).json({ message: 'You do not have permission to view this booking' });
            }

            res.json(studentBooking)
        } catch (error) {
            console.error('[API ERROR] /studentBookingInfo:', {
                id: bookingID,
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    })
})


module.exports = router;