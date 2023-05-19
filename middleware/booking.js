const router = require('express').Router();
const Booking = require('../models/booking');
const jwt = require('jsonwebtoken');
const Course = require('../models/course');
const User = require('../models/user');
const jwtSecret = 'randomString';

router.post('/bookings', async (req, res) => {
	// jwt.verify(token, jwtSecret, {}, async (err, userData) => {
	// 	if (err) throw err;
	// });
	const { item } = req.body;
	try {
		const book = await Booking.create({
			timestamp: Date.now(),
			studentID: item.studentID,
			numberOfGuests: item.guests,
			courseTimeslotID: item.selectedTimeslotID,
			courseID: item.courseID,
			total: item.total,
			teacherID: item.teacherID,
			time: item.time,
			date: item.date,
		});
		res.json(book);
	} catch (error) {
		res.status(400).send(error);
	}
});

// ROUTE TO POPULATE BOOKINGS FOR STUDENT PROFILE

// router.get('/bookings', async (req, res) => {
// 	const { token } = req.cookies;

// 	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
// 		if (err) throw err;
// 		const student = await Booking.find({ studentID: userData.id }).populate(
// 			'courseID teacherID'
// 		);
// 		res.json(student);
// 	});
// });

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE

router.get('/teacherBookings', async (req, res) => {
	const { token } = req.cookies;

	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
		if (err) throw err;
		const teacher = await Booking.find({ teacherID: userData.id }).populate(
			'courseID studentID'
		);
		res.json(teacher);
	});
});

// ROUTE FOR TEACHER SINGLE BOOKING

router.get('/teacherBookingInfo/:bookingID', async (req, res) => {
	const { token } = req.cookies;
	const { bookingID } = req.params;
	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
		if (err) throw err;
		// Verification check to see if userData.id = bookingID.teacherID ???
		const teacher = await Booking.find({ _id: bookingID }).populate(
			'courseID studentID'
		);
		res.json(teacher);
	});
});

// ROUTE FOR STUDENT SINGLE BOOKING

router.get('/studentBookingInfo/:bookingID', async (req, res) => {
	const { token } = req.cookies;
	const { bookingID } = req.params;
	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
		if (err) throw err;
		// Verification check to see if userData.id = bookingID.teacherID ???
		const student = await Booking.find({ _id: bookingID }).populate(
			'courseID teacherID'
		);
		res.json(student);
	});
});

module.exports = router;
