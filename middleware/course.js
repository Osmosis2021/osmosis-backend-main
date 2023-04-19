const router = require('express').Router()
const Course = require('../models/course')
const CourseTimeslot = require('../models/courseTimeslot')
const Image = require('../models/image')
const cloudinary = require('cloudinary');
const ObjectID = require("bson-objectid")

cloudinary.config({ 
    cloud_name: 'dv5yztb2q', 
    api_key: '813545133896732', 
    api_secret: '-AvzbZfxBUk72VeLNs04K8LG22w' 
  });

router.get('/getCourses/:latitude/:longitude', async (req, res) => {
    const {latitude, longitude} = req.params
    const lat = Number(latitude)
    const lng = Number(longitude)
    console.log('in /getCourses with these coordinates', {latitude, longitude});
    Course.find({$and: [{latitude: {$gt: (lat - 1)}}, {latitude: {$lte: (lat + 1)}},
        {longitude: {$gt: (lng - 1)}}, {longitude: {$lte: (lng + 1)}}]}, async (err, data) => {
            if (data) {
                res.json(data)
            } else {
                console.log("Could not get courses.")
                res.json({message: "Could not get courses.", err})
            }
        }
    )
})

// Get all courses from the teacher

router.get('/getCourses/:userName', async (req, res) => {
    const {userName} = req.params
    console.log('in /getCourses with this teachers username', {userName});
    Course.find ({userName}, (err, data) => {
            if (data) {
                // THIS IS A BUG (data, {...data}, ...data ? which is it???)
                res.json(data)
                console.log(data)
            } else {
                console.log("Could not get course.")
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
            console.log("Could not get course.")
            res.json({message: "Could not get course XXXXXXXXX.", err})
        }
    })
})

// Get Classes from DB

router.get('/getClasses', async (req,res) => {
    res.json( await Course.find() );
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

        const {
        teacherID,
        userName,
        address,
        longitude,
        latitude,
        industry,
        tags,
        pricePerStudent, 
        courseTitle,
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
            capacity,
            duration,
            images: imagesBuffer
        }

        // create new course
        const course = await Course.create(newCourseObj)

        // create a new timeslot associated with the new course for each timeslot in the schedule
        schedule.map(_timeslot => {
            const timeslotObj = {..._timeslot, courseID: course._id, enrollment: 0}
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


// UPDATE COURSE 

router.put('/updateCourse/:id', async (req, res) => {
        
    console.log('in updateCourse with this id', req.params.id)

        // let images = [...req.body.images];
        // let imagesBuffer = [];

        // for (let i = 0; i < images.length;  i++) {
        //     const result = await cloudinary.uploader.upload(images[i], {
        //       folder: "banners",
        //       width: 1920,
        //       crop: "scale"
        //     });

        //     imagesBuffer.push({
        //         public_id: result.public_id,
        //         url: result.secure_url
        //     })
        // }

  
    

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
        capacity: req.body.capacity   
    }
        // req.body.images = imagesBuffer
    
    const courseUpdate = await Course.findOneAndUpdate({_id: req.params.id}, {$set: data}, {new: true})
    console.log(data)
    res.json({
        courseUpdate
    })

});

// DELETE ALREADY UPLOADED image FROM COURSE 

router.put('/deletePhoto/:id', async (req, res) => {
    
    console.log('In deletePhoto with this id:', req.params.id)
    Course.findByIdAndUpdate(req.params.id, { $pull: { images: {_id: req.body.image._id} } }, async (err, results) => {
        if (err) {                                                       
            return res.status(500).json({ error: 'error in deleting image' });
        }
        console.log(req.body.image.public_id)
        res.json(results);
    });
})


// UPLOAD PHOTOS 

router.put('/updatePhoto/:id', async (req, res) => {
        
    console.log('in updatePhoto with this id', req.params.id)

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
        console.log(imagesBuffer)
    
    const photoUpdate = await Course.findByIdAndUpdate(req.params.id, { $push: { images: imagesBuffer } }, {new: true})
                            //   Course.findByIdAndUpdate(req.params.id, { $pull: { images: {_id: req.body.image._id} } }, async (err, results) => {

    res.json({
        photoUpdate
    })

});


  // DELETE COURSE
  router.delete('/deleteCourse/:id', async (req, res) => {
      console.log('deleting course with this id', req.params.id)
      
      const foundCourse = await Course.findById(req.params.id);
      // retrieve image(s)
      const imgIds = foundCourse.images;
      
      for (let i = 0; i < imgIds.length; i++) {
          const public_ids = imgIds[i].public_id
          await cloudinary.uploader.destroy(public_ids)
        }
        console.log('got through deleting on cloudinary')
        
    //   DELETE TIMESLOTS ASSOCIATED WITH COURSE
    // const foundTimeslots = await CourseTimeslot.find({courseID: req.params.id});
    // CourseTimeslot.deleteMany(foundTimeslots);
    
    // What if somebody has booked this course already? 
    
    const removeCourse = await Course.findByIdAndDelete(req.params.id)
    res.json({
        success: true,
        removeCourse,
    })
})

module.exports = router;
