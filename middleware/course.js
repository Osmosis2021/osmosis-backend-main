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
    console.log('in updateProfile with this id', req.params.id)
    
        const currentCourse = await Course.findById(req.params.id)
        
         //build the data object
         const data = {
            name: req.body.name,
            description: req.body.description,
            userName: req.body.userName
        }
   

        if (req.body.image !== '') {
            const ImgId = currentCourse.images.public_id;
            if (ImgId) {
                await cloudinary.uploader.destroy(ImgId);
            }

            const newImage = await cloudinary.uploader.upload(req.body.image, {
                // folder: "products",
                // width: 1000,
                // crop: "scale"
            });

            
            data.profileImage = {
                public_id: newImage.public_id,
                url: newImage.secure_url
            }
        }

    
        
        const userUpdate = await User.findOneAndUpdate({_id: req.params.id}, {$set: data}, {new: true})

        res.status(200).json({
            success: true,
            userUpdate,
        })
});


// DELETE COURSE

// router.delete('/deleteCourse/:id', async (req, res) => {
//     console.log('deleting course with this id', '63ffde506c33467b94f60033')

//     const deleteCourse = await Course.findById('63ffde506c33467b94f60033');
//     // retrieve image(s)
//     const imgId = deleteCourse.images.public_id;
//     await cloudinary.uploader.destroy(imgId)
//     const removeCourse = await Course.findByIdAndDelete('63ffde506c33467b94f60033');

//     res.status(200).json({
//         success: true,
//         removeCourse,
//     })

// })

module.exports = router;
