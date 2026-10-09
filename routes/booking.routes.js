const router = require('express').Router();
const mongoose = require('mongoose');
const stripe = require('../services/stripeClient');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const reservationService = require('../services/reservationService');
const bookingService = require('../services/bookingService');

// Creates the booking for a payment the guest just completed in checkout.
// (The Stripe webhook does the same if the guest closes the page before this call.)
router.post('/createBooking', requireAuth, async (req, res, next) => {
    try {
        const { courseID, courseTimeslotID, paymentIntentID } = req.body;
        if (!paymentIntentID || typeof paymentIntentID !== 'string') {
            return res.status(400).json({ success: false, message: 'Payment is required to book this session.' });
        }

        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID);
        } catch (stripeError) {
            return res.status(400).json({ success: false, message: "We couldn't find that payment." });
        }

        // The payment must belong to this guest and to the session they're booking.
        const metadata = paymentIntent?.metadata || {};
        if (metadata.studentUserName !== req.currentUser.userName
            || (courseID && metadata.courseID !== String(courseID))
            || (courseTimeslotID && metadata.timeslotID !== String(courseTimeslotID))) {
            console.error('[createBooking] Payment does not match booking', { paymentIntentID, courseID, courseTimeslotID, user: req.currentUser.userName });
            return res.status(400).json({ success: false, message: "That payment doesn't match this booking. Please contact support if you were charged." });
        }

        const { booking } = await bookingService.createBookingFromPayment(paymentIntent);
        res.json({
            success: true,
            message: 'Booking created successfully',
            booking
        });
    } catch (err) {
        console.log('Error in /createBooking', err.message);
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
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
