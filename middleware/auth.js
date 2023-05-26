const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');

const bcryptSalt = bcrypt.genSaltSync(7);
const jwtSecret = 'randomString';

router.post('/login/:email/:password', async (req, res) => {

    const {email, password} = req.params
    const userDoc = await User.findOne({email});
    
    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password)
        if(passOk) {
            jwt.sign({email: userDoc.email, id: userDoc._id, firstName: userDoc.firstName, lastName: userDoc.lastName, profileImage: userDoc.profileImage.url}, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);
            })
        } else {
            res.status(422).json('pass not ok')
        }
    } else {
        res.json('not found')
    }
});

//jacklerner7 is taken
router.get('/isUserNameUnique/:userName', async (req, res) => {
    const {userName} = req.params
    console.log('in router.get /isUserNameUnique, name:', userName);
    User.findOne({userName}, (err, data) => {
        if (data) {
            res.json({isAvailable: false})
        } else {
            res.json({isAvailable: true})
        }
    })
})

router.post('/registerUser', async (req, res) => {
    const exisitingUserName = await User.findOne({userName: req.body.userName})
    if (exisitingUserName) {
        return res.json({message: 'Unsuccessful. This username is already taken.'})
    }
    const exisitingUserEmail = await User.findOne({email: req.body.email})
    if (exisitingUserEmail) {
        return res.json({message: 'Unsuccessful. This email is already registered.'})
    }
    const userInfo = {
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, bcryptSalt),
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
    // console.log('in backend with this req', req.body);
    // const {teacherUserName} = req.params
    // const teacherObj = await User.findOne({userName: "rader-jake"})
    User.findOne({userName: req.body.userName}, (err, data) => {
        if (data) {
            res.json(data)
            // console.log(data)
        } else {
            res.json({message: "Could not get teacher's info.", err})
        }
    })
})

// GET USER WITH COOKIES
router.get('/profile', (req, res) => {
    const {token} = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if(err) throw err;
            const userDoc = await User.findById(userData.id);
            res.json(userData)
        })
    }
})

// GET USER PROFILE (FOR BOTH TEACHER AND STUDENT)
router.get('/getUserInfo/:userName', async (req, res) => {
    const {userName} = req.params
    // console.log('in router.get /getUserInfo, name:', userName);
    User.findOne({userName}, (err, data) => {
        // console.log(data)
        if (data) {
            res.json(data)
        } else {
            res.json({message: "Could not get user's info.", err})
        }
    })
})

// UPDATE USER PROFILE
router.put('/updateProfile/:id', async (req, res) => {
    // console.log('in updateProfile with this id', req.params.id)
    const {token} = req.cookies
    const data = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        description: req.body.description,
        userName: req.body.userName,
        email: req.body.email,
        // password: req.body.password
    }
    
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const currentUser = await User.findById(req.params.id)
        if(userData.id === currentUser.id) {
            console.log('herree..................in the jwt authentication')
            const userUpdate = await User.findOneAndUpdate({_id: req.params.id}, {$set: data}, {new: true})
                res.status(200).json({
                    success: true,
                    userUpdate,
                })
        }
    })
});

// UPDATE PROFILE IMAGE
router.put('/updateProfileImage/:id', async (req, res) => {
    // console.log('in updateProfileImage with this id', req.params.id)
    const {token} = req.cookies
    const data = { profileImage: req.body.image }

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const currentUser = await User.findById(req.params.id)
        try {
            if(userData.id === currentUser.id) {
                // console.log('herree..................in the jwt authentication')
                if (req.body.image !== '') {
                    const ImgId = currentUser.profileImage.public_id;
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
            } 
        }   catch(err) {
                console.log(err)
            }
    })
});



// DELETE USER
router.delete('/deleteProfile/:id', async (req, res) => {
    console.log('deleting profile with this id', req.params.id)

    const foundUser = await User.findById(req.params.id);
    // retrieve image(s)

    if(foundUser.profileImage.url !== ''){

        const profileImage = foundUser.profileImage.public_id;
        
        await cloudinary.uploader.destroy(profileImage)
        
        console.log('got through deleting on cloudinary')
    }

    // What if they have a course offering or a booked course  

    const removeUser = await User.findByIdAndDelete(req.params.id)

    res.json({
        success: true,
        removeUser,
    })
})

module.exports = router;

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


// ORIGINAL LOGIN ROUTE
// router.get('/login/:email/:password', async (req, res) => {
//     console.log('in router.get /login');
//     const {email, password} = req.params
//     User.findOne({email, password}, (err, data) => {
//         if (data) {
//             res.json({userID: data._id, userName: data.userName, isTeacher:data.isTeacher})
//         } else {
//             res.json({message: "Could not get user's id."})
//         }
//     })
// })
