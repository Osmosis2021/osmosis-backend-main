const router = require('express').Router()
const Course = require('../models/course')
const Image = require('../models/image')
const cloudinary = require('cloudinary');

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

router.get('/getCourses/:userName', async (req, res) => {
    const {userName} = req.params
    console.log('in /getCourses with this teachers username', {userName});
    Course.find ({userName}, (err, data) => {
            if (data) {
                res.json(...data)
                console.log(...data)
            } else {
                console.log("Could not get course.")
                res.json({message: "Could not get courses.", err})
            }
        }
    )
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

        const {owner} = req.body.owner
        const {price} = req.body.price
        const {courseTitle} = req.body.courseTitle
        const {tags} = req.body.tags
        const {longitude} = req.body.longitude
        const {latitude} = req.body.latitude
        const {userName} = req.body.userName
        const {zipCode} = req.body.zipCode
        const {address} = req.body.address
        const {city} = req.body.city
        const {capacity} = req.body.capacity

        
        
        const {schedule} = [...req.body.schedule]
        

        console.log(schedule)

        req.body.images = imagesBuffer

         const course = await Course.create(req.body)
         
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
        price: req.body.price,
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

    // What if somebody has booked this course already? 
    
    const removeCourse = await Course.findByIdAndDelete(req.params.id)
    res.json({
        success: true,
        removeCourse,
    })
})

module.exports = router;
