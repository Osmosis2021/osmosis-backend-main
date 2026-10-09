const router = require('express').Router();
const mongoose = require('mongoose');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const Booking = require('../models/booking');
const stripe = require('../services/stripeClient');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const reservationService = require('../services/reservationService');

router.post('/createBooking', requireAuth, async (req, res, next) => {
    try {
        const { courseID, courseTimeslotID, numberOfGuests, paymentIntentID } = req.body;
        if (!mongoose.isValidObjectId(courseID) || !mongoose.isValidObjectId(courseTimeslotID)) {
            return res.status(400).json({ success: false, message: 'Please choose a session to book.' });
        }

        const course = await Course.findById(courseID);
        if (!course) {
            return res.status(404).json({ success: false, message: 'This studio time no longer exists.' });
        }
        const timeslot = await CourseTimeslot.findOne({ _id: courseTimeslotID, courseID: course._id });
        if (!timeslot) {
            return res.status(404).json({ success: false, message: 'This session is no longer available.' });
        }

        // Who is booking, who is hosting and what it costs all come from the database,
        // never from the request body.
        const guests = Number(numberOfGuests);
        const totalCents = Math.round(Number(course.pricePerStudent || 0) * 100) * guests;

        // A booking is only created for a payment that really succeeded, for this session,
        // this guest and this amount. Retrying with the same payment returns the same booking.
        if (!paymentIntentID || typeof paymentIntentID !== 'string') {
            return res.status(400).json({ success: false, message: 'Payment is required to book this session.' });
        }
        const existing = await Booking.findOne({ paymentIntentID });
        if (existing) {
            if (existing.studentUserName !== req.currentUser.userName) {
                return res.status(409).json({ success: false, message: 'This payment is already linked to another booking.' });
            }
            return res.json({ success: true, message: 'Booking created successfully', booking: existing });
        }
        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID);
        } catch (stripeError) {
            return res.status(400).json({ success: false, message: "We couldn't find that payment." });
        }
        const metadata = paymentIntent?.metadata || {};
        const paymentMatches = paymentIntent?.status === 'succeeded'
            && metadata.courseID === String(course._id)
            && metadata.timeslotID === String(timeslot._id)
            && metadata.studentUserName === req.currentUser.userName
            && Number(metadata.guests) === guests
            && paymentIntent.amount === totalCents;
        if (!paymentMatches) {
            console.error('[createBooking] Payment does not match booking', { paymentIntentID, courseID, courseTimeslotID, user: req.currentUser.userName });
            return res.status(400).json({ success: false, message: "That payment doesn't match this booking. Please contact support if you were charged." });
        }

        const booking = await reservationService.createReservation({
            timestamp: Date.now(),
            numberOfGuests: guests,
            total: (course.pricePerStudent || 0) * guests,
            courseTimeslotID: String(timeslot._id),
            courseID: String(course._id),
            teacherID: String(course.teacherID),
            teacherUserName: course.userName,
            studentUserName: req.currentUser.userName,
            studentID: String(req.currentUser._id),
            time: timeslot.startTime,
            date: timeslot.startDate ? timeslot.startDate.toISOString() : undefined,
            paymentIntentID,
            status: 'confirmed',
        });

        res.json({
            success: true,
            message: 'Booking created successfully',
            booking
        });
    } catch (err) {
        console.log('Error in /createBooking', err);
        if (err.status === 409) {
            return res.status(409).json({ success: false, message: err.message });
        }
        if (/capacity|full/i.test(err.message || '')) {
            return res.status(409).json({ success: false, message: 'Sorry, there are not enough spots left in this session.' });
        }
        next(err);
    }
})


// ROUTE TO POPULATE BOOKINGS FOR STUDENT PROFILE
// Only the guest themselves can see their bookings; anyone else gets an empty list.
router.get('/bookings/:userName', optionalAuth, async (req, res, next) => {
    const { userName } = req.params
    try {
        if (req.currentUser?.userName !== userName) return res.json([]);
        const studentBookings = await reservationService.getStudentReservations(userName);
        res.json(studentBookings)
    } catch (error) {
        console.log('Error in /bookings', error)
        next(error);
    }
})

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE
// Only the host themselves can see their bookings; anyone else gets an empty list.
router.get('/teacherBookings/:userName', optionalAuth, async (req, res, next) => {
    const { userName } = req.params
    try {
        if (req.currentUser?.userName !== userName) return res.json([]);
        const teacher = await reservationService.getArtistReservations(userName);
        res.json(teacher)
    } catch (err) {
        console.log('Error in /teacherBookings', err)
        next(err);
    }
})

// Shared handler for viewing a single booking. The user must be its guest or its host.
const getBookingForParticipant = (label) => async (req, res, next) => {
    const { bookingID } = req.params
    try {
        if (!mongoose.isValidObjectId(bookingID)) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        const booking = await reservationService.getReservationById(bookingID);
        if (!booking) {
            console.warn(`[API] Booking not found: ${bookingID}`);
            return res.status(404).json({ message: 'Booking not found' });
        }

        const userName = req.currentUser.userName;
        if (booking.studentUserName !== userName && booking.teacherUserName !== userName) {
            console.warn(`[API] Unauthorized access attempt to booking ${bookingID} by ${userName}`);
            return res.status(403).json({ message: 'You do not have permission to view this booking' });
        }

        res.json(booking)
    } catch (error) {
        console.error(`[API ERROR] ${label}:`, { id: bookingID, error: error.message });
        next(error);
    }
}

// ROUTE FOR TEACHER SINGLE BOOKING
router.get('/teacherBookingInfo/:bookingID', requireAuth, getBookingForParticipant('/teacherBookingInfo'))

router.get('/studentBookingInfo/:bookingID', requireAuth, getBookingForParticipant('/studentBookingInfo'))


module.exports = router;
