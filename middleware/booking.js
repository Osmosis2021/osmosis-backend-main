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
        studentUserName,
        time,
        date, 
    } = req.body 

    console.log(req.body)

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        try {
            if(err) throw err;
        } catch (error) {
            console.log('Error in /createBooking', error)
        }
        // return userData;
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
    const {token} = req.cookies;
    const {userName} = req.params

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        try {
            if(err) throw err;
        } catch (error) {
            console.log('Error in /bookings', error)
        }
        console.log('ID to get booking', userData.id)
        const student = await Booking.find({studentUserName: userName}).populate('courseID teacherID')
        console.log('student', student)
        res.json( student )
        
    })

})

// ROUTE TO POPULATE BOOKINGS FOR TEACHER PROFILE

router.get('/teacherBookings/:userName', async (req, res) => {
    const {token} = req.cookies;
    const {userName} = req.params
    
    try {
            // If you want to verify the JWT token, you can do it here
            // jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            //     if (err) {
            //         console.log('Error in /teacherBookings', err);
            //         throw err; // Throw the error to handle it in the catch block
            //     }
            //     console.log('ID to get booking', userData.id);
            //     // ... Your other code using userData ...
            // });

            const teacher = await Booking.find({teacherUserName: userName}).populate('courseID studentID')
            console.log('teacher', teacher)
            res.json( teacher )

        } catch (err) {
            console.log('Error in /teacherBookings', err)
            res.status(500).json({ error: 'An error occurred while fetching teacher bookings.' });
        }        
})

// ROUTE FOR TEACHER SINGLE BOOKING

router.get('/teacherBookingInfo/:bookingID', async (req, res) => {
    const {token} = req.cookies;
    const {bookingID} = req.params
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        try {
            if(err) throw err;
            // Verification check to see if userData.id = bookingID.teacherID ???
            console.log('Booking ID', bookingID)
            const teacher = await Booking.find({_id: bookingID}).populate('courseID studentID')
            console.log('teacher', teacher)
            res.json( teacher )
        } catch (error) {
            console.log('Ran into this error in /teacherBookingInfo/:bookingID', error)
        }
        
    })
})


// ROUTE FOR STUDENT SINGLE BOOKING

router.get('/studentBookingInfo/:bookingID', async (req, res) => {
    const {token} = req.cookies;
    const {bookingID} = req.params
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        try {
            if(err) throw err;
        } catch (error) {
            console.log('Error in /studentBookingInfo/:bookingID', error)
        }
        // Verification check to see if userData.id = bookingID.teacherID ???
        console.log('Booking ID', bookingID)
        const student = await Booking.find({_id: bookingID}).populate('courseID teacherID')
        console.log('student', student)
        res.json( student )
        
    })
})








module.exports = router;