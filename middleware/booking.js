const router = require('express').Router();
const Booking = require('../models/booking');
const jwt = require('jsonwebtoken');
const Course = require('../models/course');
const jwtSecret = 'randomString';


router.post('/bookings', async (req, res) => {

    const {token} = req.cookies;
    
    const {
        // date, 
        // checkIn, 
        // checkOut,
        numberOfGuests,
        cost,
        course, 
        teacher
    } = req.body 

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        // return userData;
        console.log('here.......................... inside jwt verify')

        await Booking.create({
            // date, 
            // checkIn,
            // CheckOut,
            studentFirstName: userData.firstName,
            studentLastName: userData.lastName,
            numberOfGuests, 
            cost,
            profileImage: userData.profileImage,
            course, 
            student: userData.id,
            teacher,
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
        
        res.json( await Booking.find({user:userData.id}).populate('course') )
        
    })

})

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE

router.get('/teacherBookings', async (req, res) => {
    const {token} = req.cookies;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        console.log('ID', userData.id)
        const owner = await Booking.find({owner: userData.id}).populate('course')
        console.log('owner', owner)
        res.json( owner )
        
    })


})








module.exports = router;