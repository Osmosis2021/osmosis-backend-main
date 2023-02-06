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

router.post('/registerCourse', async (req, res) => {
    // const exisitingUser = await User.findOne({email: req.body.email})
    // if (exisitingUser) {
    //     return res.json({message: 'This email is already registered.'})
    // }

    const courseInfo = req.body
    //  {
    //     owner: courseObj.owner,
    //     industry,
    //     tags,
    //     price
    // };

    // delete undefined properties in userInfo
    Object.keys(courseInfo).forEach(key => {
        if(courseInfo[key] === undefined) {
            delete courseInfo[key]
        }
    })
    Course.create(req.body)
    // .then(savedUser => {
    //     // Send the new user an email to confirm their info.
    //     sendEmail(savedUser.email, templates.confirm(savedUser._id))
    .then(savedCourse => res.json({message: 'Successfully uploaded a new course.'})
    ).catch(err => console.log('Course.create error:\n', err))
})


// Upload Photos to DB
router.post('/upload', async (req, res, next) => {

    try {
    // const {image} = req.body;
    let images = [...req.body.images]
    let imagesBuffer = [];
    for (i=0; i<images.length; i++) {
        const result = await cloudinary.uploader.upload(images[i], {
        folder: "classRooms",
            // width: 300,
            // crop: "scale"
        });
        imagesBuffer.push({
            public_id: result.public_id,
            url: result.secure_url
        })
    }

    req.body.images = imagesBuffer
        const product = await Image.create(req.body);

        res.status(201).json({
            success: true,
            product
        })

    } catch (error) {
        console.log(error);
        next(error);
    }
})

module.exports = router;
