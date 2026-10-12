const router = require('express').Router();
const mongoose = require('mongoose');
const stripe = require('../services/stripeClient');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const { requireAuth, optionalAuth, authIfPresent } = require('../middleware/auth');

const reservationService = require('../services/reservationService');
const bookingService = require('../services/bookingService');
const reviewService = require('../services/reviewService');

// Creates the booking for a payment the guest just completed in checkout.
// (The Stripe webhook does the same if the guest closes the page before this call.)
// Signed-in guests must own the payment; guest checkouts (no account) are matched by the
// name and email stored on the payment, and only get back what the confirmation page needs.
router.post('/createBooking', authIfPresent, async (req, res, next) => {
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
        const isGuestCheckout = !metadata.studentUserName && Boolean(metadata.guestEmail);
        const ownerMatches = isGuestCheckout || (req.currentUser && metadata.studentUserName === req.currentUser.userName);
        if (!ownerMatches
            || (courseID && metadata.courseID !== String(courseID))
            || (courseTimeslotID && metadata.timeslotID !== String(courseTimeslotID))) {
            console.error('[createBooking] Payment does not match booking', { paymentIntentID, courseID, courseTimeslotID, user: req.currentUser?.userName });
            return res.status(400).json({ success: false, message: "That payment doesn't match this booking. Please contact support if you were charged." });
        }

        const { booking, guest } = await bookingService.createBookingFromPayment(paymentIntent);
        if (isGuestCheckout) {
            return res.json({
                success: true,
                message: 'Booking created successfully',
                booking: { _id: booking._id, status: booking.status, numberOfGuests: booking.numberOfGuests, total: booking.total },
                guestCheckout: { email: metadata.guestEmail, needsPassword: Boolean(guest?.passwordSetupRequired) },
            });
        }
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

// A guest reviews a session they went to: { rating: 1-5, text?: string }.
router.post('/:bookingID/review', requireAuth, async (req, res, next) => {
    try {
        const booking = await reviewService.submitReview(req.params.bookingID, req.currentUser, req.body || {});
        res.json({ success: true, booking });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        next(err);
    }
})

// A guest cancels their own booking (full refund until the day before the session).
router.post('/:bookingID/cancel', requireAuth, async (req, res, next) => {
    try {
        const booking = await bookingService.cancelBookingByGuest(req.params.bookingID, req.currentUser);
        res.json({ success: true, booking });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
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

        // Tell the guest whether they can still cancel for a refund, and until when.
        const [timeslot, course] = await Promise.all([
            CourseTimeslot.findById(booking.courseTimeslotID),
            Course.findById(booking.courseID?._id || booking.courseID),
        ]);
        const { canCancel, deadline } = bookingService.cancellationInfo(booking, timeslot, course);
        res.json({
            ...booking.toJSON(),
            canCancel: canCancel && booking.studentUserName === userName,
            freeCancellationUntil: deadline,
        })
    } catch (error) {
        console.error(`[API ERROR] ${label}:`, { id: bookingID, error: error.message });
        next(error);
    }
}

// ROUTE FOR TEACHER SINGLE BOOKING
router.get('/teacherBookingInfo/:bookingID', requireAuth, getBookingForParticipant('/teacherBookingInfo'))

router.get('/studentBookingInfo/:bookingID', requireAuth, getBookingForParticipant('/studentBookingInfo'))


module.exports = router;
