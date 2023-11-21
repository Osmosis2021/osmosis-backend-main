const router = require('express').Router()
const User = require('../models/user')
const Stripe = require('stripe');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');
const bcryptSalt = bcrypt.genSaltSync(7);
const stripeKey = process.env.NODE_ENV === 'production' ? process.env.STRIPE_LIVE_KEY : process.env.STRIPE_TEST_KEY
const stripe = Stripe(stripeKey);
const jwtSecret = process.env.ACCESS_TOKEN_SECRET
const refreshSecret = process.env.REFRESH_TOKEN_SECRET

router.get('/config', (req, res) => {
    res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_LIVE_KEY,
    });
});

router.post('/login', async (req, res) => {
    const {email, password, persist} = req.body
    if (!email || !password) return res.status(400).json({'message': 'Username and password are required.'})
    const userDoc = await User.findOne({$or: [{email} , {userName: email}]});
    if (!userDoc) return res.sendStatus(401)  // Unauthorized, could not find user
    const passOk = bcrypt.compareSync(password, userDoc.password)
    if(!passOk) return res.sendStatus(401)  // Unauthorized, email/password don't match

    const roles = Object.values(userDoc?.roles || [2119]).filter(Boolean);
    if ((userDoc?.isStudent) && (!roles.includes(1920))) roles.push(1920)
    if ((userDoc?.isTeacher) && (!roles.includes(205))) roles.push(205)
    // create JWTs
    const accessToken = jwt.sign(
        {userName: userDoc.userName, roles},
        jwtSecret,
        { expiresIn: '1d' }
    )
    let refreshToken = ''
    if (persist) {
        refreshToken = jwt.sign(
            {userName: userDoc.userName, roles},
            refreshSecret,
            { expiresIn: '30d' }
        )
    }
    const resp_obj = {...userDoc._doc, roles, accessToken}
    userDoc.refreshToken = refreshToken
    const result = await userDoc.save()
    
    // Creates Secure Cookie with refresh token if in production
    res.cookie('jwt', refreshToken, {httpOnly: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000,
                                     secure: true})
    // Send authorization roles and access token to user but don't send the refreshToken
    res.json(resp_obj)
});

router.get('/logout', async(req, res) => {
    const {userName} = req.body
    res.cookie('jwt', '', {httpOnly: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000,
                           secure: true})
    res.json({message: `Successfully logged out ${userName} on this device`})
})

router.get('/isUserNameUnique/:userName', async (req, res) => {
    const {userName} = req.params
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

    const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: req.body.email,
        business_type: 'individual',
        business_profile: {
            url: `https://getosmosis.io/teachers/${req.body.userName}`,
          },
        individual: {
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            email: req.body.email
        },

        capabilities: {
            transfers: {
                requested: true,
              },
            }
        
        });
      
      const accountID = account.id

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
        stripeID: accountID,
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
    // const {teacherUserName} = req.params
    // const teacherObj = await User.findOne({userName: "rader-jake"})
    User.findOne({userName: req.body.userName}, (err, data) => {
        if (data) {
            res.json(data)
        } else {
            res.json({message: "Could not get teacher's info.", err})
        }
    })
})

// GET USER WITH COOKIES
router.get('/profile', (req, res) => {
    const accessToken = req.cookies?.accessToken || req.cookies?.token
    if (accessToken) {
        jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
            if(err) throw err;
            const userDoc = await User.findById(userData.id);
            res.json(userData)
        })
    }
})

// Refresh the jwt
router.get('/refresh', async(req, res) => {
    const refreshToken = req.cookies?.jwt;
    if (!refreshToken) return res.sendStatus(401)
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) return res.sendStatus(403)
    jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
        if (err || foundUser.userName !== decoded.userName) return res.sendStatus(403);
        const roles = Object.values(foundUser?.roles || [2119]).filter(Boolean);
        if ((foundUser?.isStudent) && (!roles.includes(1920))) roles.push(1920)
        if ((foundUser?.isTeacher) && (!roles.includes(205))) roles.push(205)
    
        const accessToken = jwt.sign(
            {userName: decoded.username, roles: roles},
            jwtSecret,
            {expiresIn: '1d'}
        );
        const resp_obj = { ...foundUser._doc, refreshToken: '', roles, accessToken }
        res.json(resp_obj)
    });
})

// GET USER PROFILE (FOR BOTH TEACHER AND STUDENT)
// TODO: Make sure this function parses the userName properly
router.get('/getUserInfo/:userName', async (req, res) => {
    const {userName} = req.params
    User.findOne({userName}, (err, data) => {
        if (data) {
            res.json(data)
        } else {
            res.json({message: "Could not get user's info.", err})
        }
    })
})

// UPDATE USER PROFILE
router.put('/updateProfile/:id', async (req, res) => {
    const accessToken = req.body?.auth?.accessToken
    const data = req.body?.newInfo
    
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        await User.findOneAndUpdate({_id: req.params.id}, {$set: data}, {new: true})
        res.status(200).json({success: true})
    })
})

// UPDATE PROFILE IMAGE
router.put('/updateProfileImage/:id', async (req, res) => {
    const accessToken = req.cookies?.accessToken || req.cookies?.token
    const data = { profileImage: req.body.image }

    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const currentUser = await User.findById(req.params.id)
        try {
            if(userData.id === currentUser.id) {
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
        } catch(err) {
            console.log(err)
        }
    })
});



// DELETE USER
router.delete('/deleteProfile/:id', async (req, res) => {
    const foundUser = await User.findById(req.params.id);
    // retrieve image(s)

    if(foundUser.profileImage.url !== ''){
        const profileImage = foundUser.profileImage.public_id;
        await cloudinary.uploader.destroy(profileImage)
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
