const router = require('express').Router();
const Booking = require('../models/booking');
const jwt = require('jsonwebtoken');
const Course = require('../models/course');
const User = require('../models/user');
const jwtSecret = 'randomString';


router.post('/bookings', async (req, res) => {

    const {token} = req.cookies;
    
    const { 
        date, 
        profileImage,
        checkIn, 
        checkOut,
        numberOfGuests,
        pricePerGuest,
        course, 
        teacherID
    } = req.body 

    console.log(req.body)

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        // return userData;
        console.log('here.......................... inside jwt verify')

        await Booking.create({
            date: date, 
            // checkIn,
            // CheckOut,
            studentFirstName: userData.firstName,
            studentLastName: userData.lastName,
            numberOfGuests: numberOfGuests, 
            cost: pricePerGuest * numberOfGuests,
            profileImage: profileImage,
            course: course, 
            student: userData.id,
            teacher: teacherID,
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
        
        res.json( await Booking.find({student:userData.id}).populate('course') )
        
    })

})

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE

router.get('/teacherBookings', async (req, res) => {
    const {token} = req.cookies;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        console.log('ID to get booking', userData.id)
        const teacher = await Booking.find({teacher: userData.id}).populate('course')
        console.log('teacher', teacher)
        res.json( teacher )
        
    })


})








module.exports = router;