const router = require('express').Router()
const Course = require('../models/course')

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


module.exports = router;
