const router = require('express').Router();
const mongoose = require('mongoose');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const reservationService = require('../services/reservationService');

router.post('/createBooking', requireAuth, async (req, res, next) => {
    try {
        const { courseID, courseTimeslotID, numberOfGuests } = req.body;
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
        });

        res.json({
            success: true,
            message: 'Booking created successfully',
            booking
        });
    } catch (err) {
        console.log('Error in /createBooking', err);
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
