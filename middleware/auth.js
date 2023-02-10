const router = require('express').Router()
const User = require('../models/user')
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const fs = require('fs')

router.get('/login/:email/:password', async (req, res) => {
    console.log('in router.get /login');
    const {email, password} = req.params
    User.findOne({email, password}, (err, data) => {
        if (data) {
            res.json({userID: data._id, userName: data.userName})
        } else {
            res.json({message: "Could not get user's id."})
        }
    })
});

//jacklerner7 is taken
router.get('/isUserNameUnique/:userName', async (req, res) => {
    const {userName} = req.params
    console.log('in router.get /isUserNameUnique, name:', userName);
    User.findOne({userName}, (err, data) => {
        console.log(data)
        if (data) {
            res.json({isAvailable: false})
        } else {
            res.json({isAvailable: true})
        }
    })
})

router.post('/registerUser', async (req, res) => {
    const exisitingUser = await User.findOne({email: req.body.email})
    if (exisitingUser) {
        return res.json({message: 'This email is already registered.'})
    }
    const userInfo = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        stars: req.body.stars,
        description: req.body.description,
        industries: req.body.industries,
        generalTags: req.body.generalTags,
        specificTags: req.body.specificTags,
        isStudent: req.body.isStudent,
        isTeacher: req.body.isTeacher
    };
    // delete undefined properties in userInfo
    Object.keys(userInfo).forEach(key => {
        if(userInfo[key] === undefined) {
            delete userInfo[key]
        }
    })
    User.create(userInfo)
    // .then(savedUser => {
    //     // Send the new user an email to confirm their info.
    //     sendEmail(savedUser.email, templates.confirm(savedUser._id))
    .then(savedUser => res.json({message: 'Successfully saved a new user.'})
    ).catch(err => console.log('User.create error:\n', err))
})

router.post('/getTeacherData', async (req, res) => {
    console.log('in backend with this req', req.body);
    // const {teacherUserName} = req.params
    // const teacherObj = await User.findOne({teacherUserName: "rader-jake"})
    User.findOne({userName: req.body.userName}, (err, data) => {
        if (data) {
            res.json(data)
            console.log(data)
        } else {
            res.json({message: "Could not get teacher's info.", err})
        }
    })
})


// router.post('/register', async (req, res) => {
//     // TODO: do schema validation here
//     // Validate fields before registering a new user
//     // Check if the email is already in the database.
//     const existingUser = await User.findOne({email: req.body.email});
//     if (existingUser) {
//         if (Boolean(existingUser.isConfirmed)) {  // already registered and confirmed
//             return res.json({message: 'This email has already been registered.'})
//         } else {  // already registered but not confirmed
//             return res.json({message: "This email was already registered but never confirmed."})
//         }
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(req.body.password, salt);

//     //Create a new user
//     const userInfo = {
//         email: req.body.email,
//         password: hashedPassword,
//         isConfirmed: false,
//         meta: req.body.meta,
//     };
//     User.create(userInfo)
//     .then(savedUser => {
//         // Send the new user an email to confirm their info.
//         sendEmail(savedUser.email, templates.confirm(savedUser._id))
//     }).then(() => res.json({ msg: msgs.confirm })
//     ).catch(err => console.log('User.create error:\n', err))
//     });


// Get user profile (student)

router.get('/getUserInfo/:userName', async (req, res) => {
    const {userName} = req.params
    console.log('in router.get /getUserInfo, name:', userName);
    User.findOne({userName}, (err, data) => {
        console.log(data)
        if (data) {
            res.json(data)
            console.log(data)
        } else {
            res.json({message: "Could not get user's info.", err})
        }
    })
})

// const photosMiddleware = multer({dest:'uploads/'})
// router.post('/upload', photosMiddleware.array('photos', 10), (req, res) => {
//     const uploadedFiles = [];
//     for (let i = 0; i < req.files.length; i++) {
//         const {path, originalname} = req.files[i];
//         const parts = originalname.split('.');
//         const ext = parts[parts.length - 1];
//         const newPath = path + '.' + ext;
//         fs.renameSync(path, newPath)
//         uploadedFiles.push(newPath.replace('uploads/',''));
//     }
//     res.json(uploadedFiles)
// });


module.exports = router;
