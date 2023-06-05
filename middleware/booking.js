const router = require('express').Router();
const Booking = require('../models/booking');
const jwt = require('jsonwebtoken');
const Course = require('../models/course');
const User = require('../models/user');
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
        await Booking.create({
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
            // address: courseAddress,
            // city: courseCity,
            // zipCode: courseZipcode,

        }).then((doc) => {
            res.json(doc);
        }).catch((err) => {
            throw err;
        });
    
    
    
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