const router = require('express').Router();
const Booking = require('../models/booking');
const CourseTimeslot = require('../models/courseTimeslot');
const jwt = require('jsonwebtoken');
const jwtSecret = 'randomString';


router.post('/createBooking', async (req, res) => {

    const {token} = req.cookies;
    
    const { 
        timestamp,
        numberOfGuests,
        total, 
        courseTimeslotID,
        courseID, 
        teacherID,
        teacherUserName,
        time,
        date, 
    } = req.body 

    console.log(req.body)

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        // return userData;
        console.log('here.......................... inside jwt verify')
        console.log('userData......................', userData)
        Booking.create({
            timestamp: timestamp,
            studentID: userData.id,
            numberOfGuests: numberOfGuests, 
            courseTimeslotID: courseTimeslotID,
            courseID: courseID,
            total: total, 
            teacherID: teacherID,
            teacherUserName,
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

router.get('/bookings', async (req, res) => {
    const {token} = req.cookies;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        console.log('ID to get booking', userData.id)
        const student = await Booking.find({studentID: userData.id}).populate('courseID teacherID')
        console.log('student', student)
        res.json( student )
        
    })

})

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE

router.get('/teacherBookings', async (req, res) => {
    const {token} = req.cookies;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        console.log('ID to get booking', userData.id)
        const teacher = await Booking.find({teacherID: userData.id}).populate('courseID studentID')
        console.log('teacher', teacher)
        res.json( teacher )
        
    })
})

// ROUTE FOR TEACHER SINGLE BOOKING

router.get('/teacherBookingInfo/:bookingID', async (req, res) => {
    const {token} = req.cookies;
    const {bookingID} = req.params
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        // Verification check to see if userData.id = bookingID.teacherID ???
        console.log('Booking ID', bookingID)
        const teacher = await Booking.find({_id: bookingID}).populate('courseID studentID')
        console.log('teacher', teacher)
        res.json( teacher )
        
    })
})


// ROUTE FOR STUDENT SINGLE BOOKING

router.get('/studentBookingInfo/:bookingID', async (req, res) => {
    const {token} = req.cookies;
    const {bookingID} = req.params
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        // Verification check to see if userData.id = bookingID.teacherID ???
        console.log('Booking ID', bookingID)
        const student = await Booking.find({_id: bookingID}).populate('courseID teacherID')
        console.log('student', student)
        res.json( student )
        
    })
})








module.exports = router;