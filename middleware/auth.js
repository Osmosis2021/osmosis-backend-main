const router = require('express').Router()
const Student = require('../models/student')
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
