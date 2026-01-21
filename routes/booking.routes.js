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

            // Original code returned this specific message
            res.json({ 'message': 'stored a courseTimeslotUpdate' });
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
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if (err) throw err;
            const teacher = await reservationService.getReservationById(bookingID);
            res.json(teacher)
        } catch (error) {
            console.log('Ran into this error in /teacherBookingInfo/:bookingID', error)
            next(error);
        }
    })
})


// ROUTE FOR STUDENT SINGLE BOOKING
router.get('/studentBookingInfo/:bookingID', async (req, res, next) => {
    const accessToken = req?.headers?.authorization?.slice(7)
    const { bookingID } = req.params
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if (err) throw err;
            const studentBooking = await reservationService.getReservationById(bookingID);
            res.json(studentBooking)
        } catch (error) {
            console.log('Error in /studentBookingInfo/:bookingID', error)
            next(error);
        }
    })
})


module.exports = router;