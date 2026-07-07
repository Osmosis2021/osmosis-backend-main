const router = require('express').Router()
const User = require('../models/user')
const env = require('../config/env');
const authService = require('../services/authService');
const emailService = require('../services/emailService');

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
        const accessToken = req.body?.auth?.accessToken || req.headers.authorization?.slice(7);
        const data = req.body?.newInfo;
        const jwtSecret = env.ACCESS_TOKEN_SECRET;

        const jwt = require('jsonwebtoken');
        jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
            if (err) return res.sendStatus(401);

            const currentUser = await User.findById(req.params.id);
            if (!currentUser) return res.sendStatus(404);

            if (data.email && data.email !== currentUser.email) {
                const emailExists = await User.findOne({ email: data.email });
                if (emailExists && String(emailExists._id) !== req.params.id) {
                    return res.status(400).json({ success: false, message: 'Email already registered by another account.' });
                }

                const verificationCode = emailService.makePasswordResetCode();
                data.isEmailVerified = false;
                data.emailVerificationCode = verificationCode;

                try {
                    const subject = "Verify your updated email address - Studio Time";
                    const message = `
                        <h3>Verify your updated email address</h3>
                        <p>You have updated your email address on Studio Time. Please verify it to reactivate your account.</p>
                        <br/>
                        <p>Your verification code is:</p>
                        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${verificationCode}</p>
                        <br/>
                        <p>The Studio Time Team</p>
                    `;
                    await emailService.sendEmail({
                        subject,
                        message,
                        sendTo: data.email,
                        sentFrom: env.EMAIL_USER,
                        replyTo: data.email
                    });
                } catch (emailError) {
                    console.error("Failed to send verification email:", emailError);
                }
            }

            const updatedUser = await User.findOneAndUpdate({ _id: req.params.id }, { $set: data }, { new: true });
            res.status(200).json({ success: true, user: updatedUser });
        });
    } catch (error) {
        next(error);
    }
});

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

// CHANGE PASSWORD (LOGGED IN)
router.put('/changePassword', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.accessToken;
        if (!accessToken) return res.status(401).json({ success: false, message: 'Unauthorized. Access token is required.' });

        const jwt = require('jsonwebtoken');
        jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET, {}, async (err, userData) => {
            if (err) return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });

            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
            }

            const user = await User.findOne({ userName: userData.userName });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const bcrypt = require('bcryptjs');
            const passOk = bcrypt.compareSync(currentPassword, user.password);
            if (!passOk) {
                return res.status(400).json({ success: false, message: 'Incorrect current password.' });
            }

            const bcryptSalt = bcrypt.genSaltSync(7);
            user.password = bcrypt.hashSync(newPassword, bcryptSalt);
            await user.save();

            res.status(200).json({ success: true, message: 'Password changed successfully.' });
        });
    } catch (error) {
        next(error);
    }
});

// VERIFY EMAIL
router.post('/verify-email', async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.isEmailVerified) {
            return res.status(200).json({ success: true, message: 'Email is already verified.' });
        }

        if (user.emailVerificationCode !== code) {
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }

        user.isEmailVerified = true;
        user.emailVerificationCode = '';
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } catch (error) {
        next(error);
    }
});

// RESEND VERIFICATION CODE
router.post('/resend-verification', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.isEmailVerified) {
            return res.status(200).json({ success: true, message: 'Email is already verified.' });
        }

        const verificationCode = emailService.makePasswordResetCode();
        user.emailVerificationCode = verificationCode;
        await user.save();

        try {
            const subject = "Verify your email address - Studio Time";
            const message = `
                <h3>Welcome to Studio Time!</h3>
                <p>Please verify your email address to complete your registration.</p>
                <br/>
                <p>Here is your 6-digit verification code:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${verificationCode}</p>
                <br/>
                <p>Cheers,</p>
                <p>The Studio Time Team</p>
            `;
            await emailService.sendEmail({
                subject,
                message,
                sendTo: email,
                sentFrom: env.EMAIL_USER,
                replyTo: email
            });
            console.log(`Verification code resent to ${email}: ${verificationCode}`);
        } catch (emailError) {
            console.error("Failed to resend verification email:", emailError);
            console.log(`[DEV FALLBACK] Verification code for ${email} is: ${verificationCode}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please check your SMTP settings and try again.',
                error: emailError.message
            });
        }

        res.status(200).json({ success: true, message: 'Verification code resent successfully.' });
    } catch (error) {
        next(error);
    }
});

// GOOGLE SIGN-IN / ONBOARDING
router.post('/google-login', async (req, res, next) => {
    try {
        const { credential, role } = req.body;
        if (!credential) {
            return res.status(400).json({ success: false, message: 'Google credential token is required.' });
        }

        const jwt = require('jsonwebtoken');
        const payload = jwt.decode(credential);
        if (!payload || !payload.email) {
            return res.status(400).json({ success: false, message: 'Invalid Google credential token.' });
        }

        const { email, sub, given_name, family_name } = payload;

        let userDoc = await User.findOne({ $or: [{ googleId: sub }, { email }] });

        if (userDoc) {
            if (!userDoc.googleId) {
                userDoc.googleId = sub;
                userDoc.isEmailVerified = true;
                await userDoc.save();
            }
        } else {
            const firstName = given_name || 'Google';
            const lastName = family_name || 'User';
            let baseUsername = (given_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            let userName = baseUsername;
            let count = 1;
            while (await User.findOne({ userName })) {
                userName = `${baseUsername}${count}`;
                count++;
            }

            const isTeacher = role === 'artist';
            const isStudent = !isTeacher;

            let accountID;
            let customerID;
            const stripe = require('../services/stripeClient');

            try {
                if (isTeacher) {
                    const account = await stripe.accounts.create({
                        type: 'express',
                        country: 'US',
                        email: email,
                        business_type: 'individual',
                        business_profile: {
                            url: `https://getstudiotime.com/teachers/${userName}`,
                        },
                        individual: {
                            first_name: firstName,
                            last_name: lastName,
                            email: email
                        },
                        capabilities: {
                            transfers: { requested: true },
                        }
                    });
                    accountID = account.id;
                } else {
                    const customer = await stripe.customers.create({
                        name: firstName + ' ' + lastName,
                        email: email,
                    });
                    customerID = customer.id;
                }
            } catch (stripeErr) {
                console.error("Stripe initialization failed for Google signup:", stripeErr);
            }

            const bcrypt = require('bcryptjs');
            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            const bcryptSalt = bcrypt.genSaltSync(7);

            userDoc = await User.create({
                firstName,
                lastName,
                userName,
                email,
                password: bcrypt.hashSync(randomPassword, bcryptSalt),
                isStudent,
                isTeacher,
                isEmailVerified: true,
                googleId: sub,
                stripeID: accountID,
                customerStripeID: customerID
            });
        }

        const roles = [];
        if (userDoc.isStudent) roles.push(1920);
        if (userDoc.isTeacher) roles.push(205);
        if (roles.length === 0) roles.push(2119);

        const accessToken = jwt.sign(
            { userName: userDoc.userName, roles },
            env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            { userName: userDoc.userName, roles },
            env.REFRESH_TOKEN_SECRET,
            { expiresIn: '30d' }
        );

        userDoc.refreshToken = refreshToken;
        await userDoc.save();

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            sameSite: 'None',
            maxAge: 24 * 60 * 60 * 1000,
            secure: true
        });

        res.json({
            _id: userDoc._id,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            userName: userDoc.userName,
            email: userDoc.email,
            isTeacher: userDoc.isTeacher,
            isStudent: userDoc.isStudent,
            isEmailVerified: userDoc.isEmailVerified,
            customerStripeID: userDoc.customerStripeID,
            paymentMethodID: userDoc.paymentMethodID,
            googleId: userDoc.googleId,
            accessToken,
            roles
        });
    } catch (error) {
        next(error);
    }
});

// LINK GOOGLE ACCOUNT
router.post('/link-google', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.accessToken;
        if (!accessToken) return res.status(401).json({ success: false, message: 'Unauthorized. Access token is required.' });

        const jwt = require('jsonwebtoken');
        jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET, {}, async (err, userData) => {
            if (err) return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });

            const { credential } = req.body;
            if (!credential) {
                return res.status(400).json({ success: false, message: 'Google credential is required.' });
            }

            const payload = jwt.decode(credential);
            if (!payload || !payload.email) {
                return res.status(400).json({ success: false, message: 'Invalid Google credential.' });
            }

            const { sub } = payload;

            const existingUser = await User.findOne({ googleId: sub });
            if (existingUser && existingUser.userName !== userData.userName) {
                return res.status(400).json({ success: false, message: 'This Google account is already linked to another user.' });
            }

            const user = await User.findOne({ userName: userData.userName });
            if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

            user.googleId = sub;
            user.isEmailVerified = true;
            await user.save();

            res.status(200).json({ success: true, message: 'Google account linked successfully.', googleId: sub });
        });
    } catch (error) {
        next(error);
    }
});

// UNLINK GOOGLE ACCOUNT
router.post('/unlink-google', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.accessToken;
        if (!accessToken) return res.status(401).json({ success: false, message: 'Unauthorized. Access token is required.' });

        const jwt = require('jsonwebtoken');
        jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET, {}, async (err, userData) => {
            if (err) return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });

            const user = await User.findOne({ userName: userData.userName });
            if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

            user.googleId = '';
            await user.save();

            res.status(200).json({ success: true, message: 'Google account unlinked successfully.' });
        });
    } catch (error) {
        next(error);
    }
});

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
