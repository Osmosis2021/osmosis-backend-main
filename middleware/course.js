const router = require('express').Router()
const Course = require('../models/course')
const CourseTimeslot = require('../models/courseTimeslot')
const Image = require('../models/image')
const cloudinary = require('cloudinary');
const ObjectID = require("bson-objectid")
const Booking = require('../models/booking');

CLOUDINARY_CLOUD_NAME="dx3om7soc"
CLOUDINARY_API_KEY="923359711288174"
CLOUDINARY_API_SECRET="GGR49H8I6KfS0k1fEglpTsYD7e8"

cloudinary.config({ 
    cloud_name: CLOUDINARY_CLOUD_NAME, 
    api_key: CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET 
  });

router.get('/getCourses/:latitude/:longitude', async (req, res) => {
    const {latitude, longitude} = req.params
    const lat = Number(latitude)
    const lng = Number(longitude)
    Course.find({$and: [{latitude: {$gt: (lat - 1)}}, {latitude: {$lte: (lat + 1)}},
        {longitude: {$gt: (lng - 1)}}, {longitude: {$lte: (lng + 1)}}]}, async (err, data) => {
            if (data) {
                res.json(data)
            } else {
                res.json({message: "Could not get courses.", err})
            }
        }
    )
})

// Get all courses from the teacher

router.get('/getCourses/:userName', async (req, res) => {
    const {userName} = req.params
    Course.find ({userName}, (err, data) => {
            if (data) {
                // THIS IS A BUG (data, {...data}, ...data ? which is it???)
                res.json(data)
            } else {
                res.json({message: "Could not get courses.", err})
            }
        }
    )
})

// Get specific course from the teacher

router.get('/getCourse/:courseID', async (req, res) => {
    const {courseID} = req.params
    Course.findById (courseID, async (err, data) => {
        if (data) {
            data.set('schedule', [])
            await CourseTimeslot.find({courseID: courseID})
            .then(_data => {
                if (_data) {
                    data.set('schedule', [..._data])
                }
            })
            res.json(data)
        } else {
            res.json({message: "Could not get course XXXXXXXXX.", err})
        }
    }).populate('feedback.studentID')
})

// Get Classes from DB

router.get('/getClasses', async (req,res) => {
    res.json( await Course.find().populate('teacherID'));
  });





//   REGISTER COURSE

router.post('/registerCourse', async (req, res, next) => {

    try {
        let images = [...req.body.images];
        let imagesBuffer = [];

        for (let i =0; i < images.length;  i++){
              const result = await cloudinary.uploader.upload(images[i], {
              folder: "banners",
              width: 1920,
              crop: "scale"
        });

          imagesBuffer.push({
            public_id: result.public_id,
            url: result.secure_url
          })

        }
        const teacherID = req.body.teacherID.toString()
        const {
        userName,
        address,
        longitude,
        latitude,
        industry,
        tags,
        pricePerStudent, 
        courseTitle,
        courseDescription,
        capacity,
        duration,
        schedule } = {...req.body}        

        const newCourseObj = {
            teacherID,
            userName,
            address,
            longitude,
            latitude,
            industry,
            tags,
            pricePerStudent, 
            courseTitle,
            courseDescription,
            capacity,
            duration,
            images: imagesBuffer
        }

        // create new course
        const course = await Course.create(newCourseObj)
        // create a new timeslot associated with the new course for each timeslot in the schedule
        schedule.map(_timeslot => {
            const timeslotObj = {..._timeslot, courseID: ObjectID(course._id), enrollment: 0, status: 'created'}
            CourseTimeslot.create(timeslotObj)
        })

        res.json({
            success: true,
            course
        })
        
    } catch (error) {
        console.log(error);
        next(error);
    }
})


// POST RATING/REVIEWS 

router.put('/sendReview/:bookingID', async (req, res) => {
    const { rating, writtenReview, userID } = req.body.feedback;
    const bookingID = req.params.bookingID;

    try {
        const updatedBooking = await Booking.findByIdAndUpdate (
            bookingID,
            {
                rating,
                review: writtenReview,
                ratedAndReviewed: true,
            },
            { new: true }
        );

        const updatedCourse = await Course.findByIdAndUpdate (
            updatedBooking.courseID,
            {
                $addToSet: {
                    feedback: {
                        rating,
                        reviews: writtenReview,
                        studentID: userID
                    }
                },
            },
            { new: true }
        )

        res.json({
            updatedBooking,
            updatedCourse
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the review.' }); 
    }
})

// UPDATE COURSE 

router.put('/updateCourse/:id', async (req, res) => {
    //build the data object
    const data = { 
        owner: req.body.owner,
        pricePerStudent: req.body.pricePerStudent,
        courseTitle: req.body.courseTitle,
        tags: req.body.tags,
        longitude: req.body.longitude,
        latitude: req.body.latitude,
        userName: req.body.userName,
        zipCode: req.body.zipCode,
        address: req.body.address,
        city: req.body.city,
        capacity: req.body.capacity,
        status: req.body.status,
    }
        // req.body.images = imagesBuffer
    
    const courseUpdate = await Course.findOneAndUpdate({_id: req.params.id}, {$set: data}, {new: true})
    const ts2add = req.body?.timeslotsToAdd || []
    const ts2remove = req.body?.timeslotsToRemove || []
    if(ts2add.length) {
        ts2add.map(async _timeslot => {
            const timeslotObj = {..._timeslot, courseID: courseUpdate._id, enrollment: 0, status: 'created'}
            await CourseTimeslot.create(timeslotObj)
        })
    } if(ts2remove.length) {
        await CourseTimeslot.deleteMany({_id: { $in: ts2remove}})
    }
    res.json({
        courseUpdate
    })

});

// DELETE ALREADY UPLOADED image FROM COURSE 

router.put('/deletePhoto/:id', async (req, res) => {
    
    Course.findByIdAndUpdate(req.params.id, { $pull: { images: {_id: req.body.image._id} } }, async (err, results) => {
        if (err) {                                                       
            return res.status(500).json({ error: 'error in deleting image' });
        }
        res.json(results);
    });
})


// UPLOAD PHOTOS 

router.put('/updatePhoto/:id', async (req, res) => {
        
        let images = [...req.body.images];
        let imagesBuffer = [];

        for (let i = 0; i < images.length;  i++) {
            const result = await cloudinary.uploader.upload(images[i], {
              folder: "banners",
              width: 1920,
              crop: "scale"
            });

            imagesBuffer.push({
                public_id: result.public_id,
                url: result.secure_url
            })
        }

  
        req.body.images = imagesBuffer
    
    const photoUpdate = await Course.findByIdAndUpdate(req.params.id, { $push: { images: imagesBuffer } }, {new: true})
                            //   Course.findByIdAndUpdate(req.params.id, { $pull: { images: {_id: req.body.image._id} } }, async (err, results) => {

    res.json({
        photoUpdate
    })

});


// DELETE COURSE
router.delete('/deleteCourse/:id', async (req, res) => {
    const {id} = req.params    
    const foundCourse = await Course.findById(id);
    // retrieve image(s)
    const imgIds = foundCourse.images;
    
    for (let i = 0; i < imgIds.length; i++) {
        const public_ids = imgIds[i].public_id
        await cloudinary.uploader.destroy(public_ids)
    }
    
    // DELETE TIMESLOTS ASSOCIATED WITH COURSE
    const result = await CourseTimeslot.updateMany({courseID: foundCourse._id}, {status: 'removed by teacher'})
    // const foundTimeslots = await CourseTimeslot.find({courseID: req.params.id});
    // CourseTimeslot.deleteMany(foundTimeslots);
    
    // What if somebody has booked this course already? 
    
    const removeCourse = await Course.findByIdAndDelete(id)
    res.json({
        success: true,
        removeCourse,
    })
})

module.exports = router;
