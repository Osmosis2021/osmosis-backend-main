const router = require('express').Router();
const Booking = require('../models/booking');
const CourseTimeslot = require('../models/courseTimeslot');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.ACCESS_TOKEN_SECRET


router.post('/createBooking', async (req, res) => {
    const accessToken = req.cookies?.jwt
    const { 
        timestamp,
        numberOfGuests,
        total, 
        courseTimeslotID,
        courseID, 
        teacherID,
        teacherUserName,
        studentUserName,
        time,
        date, 
    } = req.body 

    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if(err) throw err;
        } catch (error) {
            console.log('Error in /createBooking', error)
        }
        // return userData;
        Booking.create({
            timestamp: timestamp,
            // studentID: userData.id,  // Don't pass this on since it wasn't encoded in the jwt
            numberOfGuests: numberOfGuests, 
            courseTimeslotID: courseTimeslotID,
            courseID: courseID,
            total: total, 
            teacherID: teacherID,
            teacherUserName,
            studentUserName,
            time: time,
            date: date, 
            // status: 'pending payment'
            // address: courseAddress,
            // city: courseCity,
            // zipCode: courseZipcode,
        }).then(async(doc) => {
            const courseTimeslotUpdate = await CourseTimeslot.findOneAndUpdate({_id: doc.courseTimeslotID},
                {$push: {enrolledStudents: doc.studentID}, $inc: {enrollment: doc.numberOfGuests}}, {new: true})
            if(courseTimeslotUpdate) {
                res.json({'message': 'stored a courseTimeslotUpdate'});
            }
        }).catch((err) => {
            throw err;
        })
    })
});

// ROUTE TO POPULATE BOOKINGS FOR STUDENT PROFILE
router.get('/bookings/:userName', async (req, res) => {
    const accessToken = req?.headers?.authorization?.slice(7)  // slice(7) because it begins 'Bearer '   -> TODO: check to make sure this is correct
    const {userName} = req.params

    // Putting this try/catch inside jwt.verify means that only a signed-in user can request studentBooking info
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            // This console.log fails when a logged in student manually types in the url of another student
            // console.log({'user making request\'s data': userData.userName, 'student info being requested': userName})
            const studentBookings = await Booking.find({studentUserName: userName}).populate('courseID teacherID')
            res.json( studentBookings )
        } catch (error) {
            console.log('Error in /bookings', error)
            res.json({message: 'Failed to fetch bookings.'})
        }
    })
})

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE
router.get('/teacherBookings/:userName', async (req, res) => {
    const {userName} = req.params
    try {
        const teacher = await Booking.find({teacherUserName: userName}).populate('courseID studentID')
        res.json( teacher )
    } catch (err) {
        console.log('Error in /teacherBookings', err)
        res.status(500).json({ error: 'An error occurred while fetching teacher bookings.' });
    }        
})

// ROUTE FOR TEACHER SINGLE BOOKING
router.get('/teacherBookingInfo/:bookingID', async (req, res) => {
    const accessToken = req?.headers?.authorization?.slice(7)  // slice(7) because it begins 'Bearer '
    const {bookingID} = req.params
    // Putting this try/catch inside jwt.verify means that only a signed-in user can make this request
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if(err) throw err;
            // Verification check to see if userData.id = bookingID.teacherID ???
            const teacher = await Booking.find({_id: bookingID}).populate('courseID studentID')
            // console.log('teacher', teacher)
            res.json( teacher )
        } catch (error) {
            console.log('Ran into this error in /teacherBookingInfo/:bookingID', error)
        }
        
    })
})


// ROUTE FOR STUDENT SINGLE BOOKING
router.get('/studentBookingInfo/:bookingID', async (req, res) => {
    const accessToken = req?.headers?.authorization?.slice(7)  // slice(7) because it begins 'Bearer '
    const {bookingID} = req.params
    // Putting this try/catch inside jwt.verify means that only a signed-in user can make this request
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        try {
            if(err) throw err;
        } catch (error) {
            console.log('Error in /studentBookingInfo/:bookingID', error)
        }
        // Verification check to see if userData.id = bookingID.teacherID ???
        const studentBooking = await Booking.find({_id: bookingID}).populate('courseID teacherID')
        res.json( studentBooking )
    })
})


module.exports = router;