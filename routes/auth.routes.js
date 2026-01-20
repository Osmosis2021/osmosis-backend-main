const router = require('express').Router()
const User = require('../models/user')
const env = require('../config/env');
const authService = require('../services/authService');

router.get('/config', (req, res) => {
    res.send({
        publishableKey: env.STRIPE_PUBLISHABLE_LIVE_KEY,
    });
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password, persist } = req.body;
        const { user, refreshToken } = await authService.login(email, password, persist);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            sameSite: 'None',
            maxAge: 24 * 60 * 60 * 1000,
            secure: true
        });

        res.json(user);
    } catch (error) {
        next(error);
    }
});

router.get('/logout', async (req, res) => {
    const { userName } = req.body
    res.cookie('jwt', '', {
        httpOnly: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000,
        secure: true
    })
    res.json({ message: `Successfully logged out ${userName} on this device` })
})

router.get('/isUserNameUnique/:userName', async (req, res, next) => {
    try {
        const { userName } = req.params
        const data = await User.findOne({ userName });
        res.json({ isAvailable: !data });
    } catch (error) {
        next(error);
    }
})

router.post('/registerUser', async (req, res, next) => {
    try {
        const result = await authService.registerUser(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
})

router.post('/getTeacherData', async (req, res, next) => {
    try {
        const data = await User.findOne({ userName: req.body.userName });
        if (data) {
            res.json(data)
        } else {
            res.status(404).json({ message: "Could not get teacher's info." })
        }
    } catch (error) {
        next(error);
    }
})

// Refresh the jwt
router.get('/refresh', async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.jwt;
        const result = await authService.refresh(refreshToken);
        res.json(result);
    } catch (error) {
        next(error);
    }
})

// GET USER PROFILE (FOR BOTH TEACHER AND STUDENT)
router.get('/getUserInfo/:userName', async (req, res, next) => {
    try {
        const { userName } = req.params
        const data = await User.findOne({ userName });
        if (data) {
            res.json(data)
        } else {
            res.status(404).json({ message: "Could not get user's info." })
        }
    } catch (error) {
        next(error);
    }
})

// UPDATE USER PROFILE
router.put('/updateProfile/:id', async (req, res, next) => {
    try {
        const accessToken = req.body?.auth?.accessToken
        const data = req.body?.newInfo
        const jwtSecret = env.ACCESS_TOKEN_SECRET

        const jwt = require('jsonwebtoken');
        jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
            if (err) return res.sendStatus(401);
            await User.findOneAndUpdate({ _id: req.params.id }, { $set: data }, { new: true })
            res.status(200).json({ success: true })
        })
    } catch (error) {
        next(error);
    }
})

// UPDATE PROFILE IMAGE
router.put('/updateProfileImage/:id', async (req, res, next) => {
    try {
        const userUpdate = await authService.updateProfileImage(
            req.params.id,
            req.body.image,
            req.headers.authorization
        );
        res.status(200).json({
            success: true,
            userUpdate,
        });
    } catch (error) {
        next(error);
    }
});

// DELETE USER
router.delete('/deleteProfile/:id/:password', async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.params.id);
        if (!foundUser) return res.sendStatus(404);

        const bcrypt = require('bcryptjs');
        const passOk = bcrypt.compareSync(req.params.password, foundUser.password)
        if (!passOk) return res.sendStatus(401)

        const cloudinary = require('cloudinary');
        if (foundUser.profileImage?.url !== '') {
            const profileImage = foundUser.profileImage.public_id;
            if (profileImage) {
                await cloudinary.uploader.destroy(profileImage)
            }
        }

        const removeUser = await User.findByIdAndDelete(req.params.id)
        res.json({
            success: true,
            removeUser,
        })
    } catch (error) {
        next(error);
    }
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
