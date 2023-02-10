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
    Course.findOne ({userName}, (err, data) => {
            if (data) {
                res.json(data)
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
        const {title} = req.body.title
        const {tags} = req.body.tags
        imagesBuffer = req.body.images

         const course = await Course.create(req.body)
         
        res.status(201).json({
            success: true,
            course
        })
        
    } catch (error) {
        console.log(error);
        next(error);
        
    }
   
})


// Upload Photos to DB
// router.post('/upload', async (req, res, next) => {

//     try {
//     // const {image} = req.body;
//     let images = [...req.body.images]
//     let imagesBuffer = [];
//     for (i=0; i<images.length; i++) {
//         const result = await cloudinary.uploader.upload(images[i], {
//         folder: "classRooms",
//             // width: 300,
//             // crop: "scale"
//         });
//         imagesBuffer.push({
//             public_id: result.public_id,
//             url: result.secure_url
//         })
//     }

//     req.body.images = imagesBuffer
//         const product = await Image.create(req.body);

//         res.status(201).json({
//             success: true,
//             product
//         })

//     } catch (error) {
//         console.log(error);
//         next(error);
//     }
// })

module.exports = router;
