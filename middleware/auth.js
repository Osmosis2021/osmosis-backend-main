const router = require('express').Router()
const Student = require('../models/student')
const Teacher = require('../models/teacher')
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');



router.get('/login/:email/:password', async (req, res) => {
    console.log('in router.get /login');
    const {email, password} = req.params
    Student.findOne({email, password}, (err, data) => {
        if (data) {
            res.json({userID: data._id})
        } else {
            res.json({message: "Could not get user's id."})
        }
    })
});

router.post('/registerTeacher', async (req, res) => {
    const exisitingUser = await Teacher.findOne({email: req.body.email})
    if (exisitingUser) {
        return res.json({message: 'This email is already registered.'})
    }
    const teacherInfo = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        stars: req.body.stars,
        description: req.body.description,
        industries: req.body.industries,
        generalTags: req.body.generalTags,
        specificTags: req.body.specificTags
    };
    Teacher.create(teacherInfo)
    // .then(savedTeacher => {
    //     // Send the new user an email to confirm their info.
    //     sendEmail(savedTeacher.email, templates.confirm(savedTeacher._id))
    .then(savedTeacher => res.json({message: 'Successfully saved a new teacher.'})
    ).catch(err => console.log('Teacher.create error:\n', err))
})

router.post('/getTeacherData', async (req, res) => {
    console.log('in backend with this req', req.body);
    // const {teacherUserName} = req.params
    const teacherObj = await Teacher.findOne({userName: req.body.teacherUserName})
    console.log(teacherObj);
    Teacher.findOne({userName: req.body.teacherUserName}, (err, data) => {
        if (data) {
            console.log('in if block of /getTeacher in backend');
            res.json(data)
        } else {
            res.json({message: "Could not get teacher's info."})
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



module.exports = router;
