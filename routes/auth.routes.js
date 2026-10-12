const router = require('express').Router()
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user')
const Course = require('../models/course');
const Booking = require('../models/booking');
const { pickPublicFields } = require('../models/user');
const env = require('../config/env');
const authService = require('../services/authService');
const { REFRESH_COOKIE_OPTIONS, issueTokens } = require('../services/authService');
const emailService = require('../services/emailService');
const { verifyGoogleCredential } = require('../services/googleAuth');
const payoutService = require('../services/payoutService');
const attemptLimiter = require('../services/attemptLimiter');
const { requireAuth, optionalAuth, getBearerToken, verifyAccessToken } = require('../middleware/auth');

router.get('/config', (req, res) => {
    res.send({
        publishableKey: require('../services/stripeClient').publishableKey,
    });
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password, persist } = req.body;
        const { user, refreshToken } = await authService.login(email, password, persist);

        if (refreshToken) {
            res.cookie('jwt', refreshToken, REFRESH_COOKIE_OPTIONS);
        } else {
            res.clearCookie('jwt', { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

router.get('/logout', async (req, res) => {
    const { userName } = req.body
    res.clearCookie('jwt', { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined })
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
            res.json(pickPublicFields(data))
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
// The owner (signed in) gets their full profile; everyone else gets public fields only.
router.get('/getUserInfo/:userName', optionalAuth, async (req, res, next) => {
    try {
        const { userName } = req.params
        const data = await User.findOne({ userName });
        if (data?.isTeacher) await payoutService.refreshUnknownPayoutFlags([data]);
        if (data) {
            const isOwner = req.currentUser && String(req.currentUser._id) === String(data._id);
            res.json(isOwner ? data : pickPublicFields(data))
        } else {
            res.status(404).json({ message: "Could not get user's info." })
        }
    } catch (error) {
        next(error);
    }
})

// Fields a user may change on their own profile. Everything else (roles, Stripe IDs,
// verification state, password, tokens) is managed by the server.
const EDITABLE_PROFILE_FIELDS = ['firstName', 'lastName', 'userName', 'description', 'email', 'phoneNumber', 'smsEnabled', 'industries', 'generalTags', 'specificTags'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// UPDATE USER PROFILE
router.put('/updateProfile/:id', async (req, res, next) => {
    try {
        // Accepts the token from the Authorization header, or from the body (legacy Settings form).
        const accessToken = getBearerToken(req) || req.body?.auth?.accessToken;
        if (!accessToken) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });

        let tokenData;
        try {
            tokenData = await verifyAccessToken(accessToken);
        } catch (err) {
            return res.status(403).json({ success: false, message: 'Your session has expired. Please sign in again.' });
        }

        const currentUser = await User.findOne({ userName: tokenData.userName });
        if (!currentUser) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
        if (String(currentUser._id) !== req.params.id) {
            return res.status(403).json({ success: false, message: 'You can only update your own profile.' });
        }

        const newInfo = req.body?.newInfo || {};
        const data = {};
        EDITABLE_PROFILE_FIELDS.forEach((field) => {
            if (newInfo[field] !== undefined) data[field] = newInfo[field];
        });

        if (data.firstName !== undefined && !String(data.firstName).trim()) {
            return res.status(400).json({ success: false, message: 'First name cannot be empty.' });
        }
        if (data.lastName !== undefined && !String(data.lastName).trim()) {
            return res.status(400).json({ success: false, message: 'Last name cannot be empty.' });
        }

        if (data.userName !== undefined && data.userName !== currentUser.userName) {
            if (!String(data.userName).trim()) {
                return res.status(400).json({ success: false, message: 'Username cannot be empty.' });
            }
            const userNameTaken = await User.findOne({ userName: data.userName });
            if (userNameTaken) {
                return res.status(400).json({ success: false, message: 'That username is already taken.' });
            }
        }

        if (data.email !== undefined && data.email !== currentUser.email) {
            if (!EMAIL_PATTERN.test(String(data.email))) {
                return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
            }
            const emailExists = await User.findOne({ email: data.email });
            if (emailExists && String(emailExists._id) !== req.params.id) {
                return res.status(400).json({ success: false, message: 'Email already registered by another account.' });
            }

            const verificationCode = emailService.makePasswordResetCode();
            data.isEmailVerified = false;
            data.emailVerificationCode = verificationCode;

            try {
                await emailService.sendUpdatedEmailVerification(data.email, verificationCode);
            } catch (emailError) {
                console.error("Failed to send verification email:", emailError);
            }
        }

        const updatedUser = await User.findOneAndUpdate({ _id: req.params.id }, { $set: data }, { new: true });

        // Tokens, listings and bookings carry a copy of the username. After a rename, point the
        // user's listings and bookings at the new name (otherwise their links and host stats break)
        // and hand back fresh tokens (the old ones would sign the user out).
        let newAccessToken;
        if (updatedUser.userName !== currentUser.userName) {
            const previousUserName = currentUser.userName;
            await Promise.all([
                Course.updateMany({ userName: previousUserName }, { $set: { userName: updatedUser.userName } }),
                Booking.updateMany({ teacherUserName: previousUserName }, { $set: { teacherUserName: updatedUser.userName } }),
                Booking.updateMany({ studentUserName: previousUserName }, { $set: { studentUserName: updatedUser.userName } }),
            ]);
            const tokens = await issueTokens(updatedUser, { persist: Boolean(currentUser.refreshToken) });
            newAccessToken = tokens.accessToken;
            if (tokens.refreshToken) res.cookie('jwt', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
        }

        res.status(200).json({ success: true, user: updatedUser.toJSON(), accessToken: newAccessToken });
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
// The password is sent in the request body (never in the URL, where it would end up in logs).
router.delete('/deleteProfile/:id', requireAuth, async (req, res, next) => {
    try {
        const foundUser = req.currentUser;
        if (String(foundUser._id) !== req.params.id) {
            return res.status(403).json({ success: false, message: 'You can only delete your own account.' });
        }

        const passOk = bcrypt.compareSync(String(req.body?.password || ''), foundUser.password)
        if (!passOk) return res.status(401).json({ success: false, message: 'Incorrect password.' })

        const cloudinary = require('../config/cloudinary');
        const profileImage = foundUser.profileImage?.public_id;
        if (profileImage) {
            await cloudinary.uploader.destroy(profileImage)
        }

        await User.findByIdAndDelete(foundUser._id)
        res.json({ success: true })
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

        jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET, {}, async (err, userData) => {
            try {
                if (err) return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });

                const { currentPassword, newPassword } = req.body;
                if (!currentPassword || !newPassword) {
                    return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
                }

                const user = await User.findOne({ userName: userData.userName });
                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found.' });
                }

                const passOk = bcrypt.compareSync(currentPassword, user.password);
                if (!passOk) {
                    return res.status(400).json({ success: false, message: 'Incorrect current password.' });
                }

                const bcryptSalt = bcrypt.genSaltSync(7);
                user.password = bcrypt.hashSync(newPassword, bcryptSalt);
                await user.save();

                res.status(200).json({ success: true, message: 'Password changed successfully.' });
            } catch (innerError) {
                next(innerError);
            }
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

        const limiterKey = `verify-email:${email}`;
        if (attemptLimiter.isLocked(limiterKey)) {
            return res.status(429).json({ success: false, message: attemptLimiter.LOCKED_MESSAGE });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.isEmailVerified) {
            return res.status(200).json({ success: true, message: 'Email is already verified.' });
        }

        if (!user.emailVerificationCode || user.emailVerificationCode !== String(code)) {
            attemptLimiter.recordFailure(limiterKey);
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }

        attemptLimiter.reset(limiterKey);
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
        // A fresh code resets the failed-attempt counter.
        attemptLimiter.reset(`verify-email:${email}`);

        try {
            await emailService.sendResendVerificationEmail(email, verificationCode);
            console.log(`Verification code resent to ${email}`);
        } catch (emailError) {
            console.error("Failed to resend verification email:", emailError);
            if (env.NODE_ENV !== 'production') {
                console.log(`[DEV FALLBACK] Verification code for ${email} is: ${verificationCode}`);
            }
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.',
                error: emailError.message
            });
        }

        res.status(200).json({ success: true, message: 'Verification code resent successfully.' });
    } catch (error) {
        next(error);
    }
});

// GOOGLE SIGN-IN / ONBOARDING
// New users must say whether they are an artist or a guest (`role`). If they haven't yet,
// we answer { needsRole: true } and the app asks, then sends the same credential again.
router.post('/google-login', async (req, res, next) => {
    try {
        const { credential, role } = req.body;
        // Throws (with an HTTP status) unless Google confirms the token is genuine,
        // was issued for our client ID, and belongs to a verified email address.
        const claims = await verifyGoogleCredential(credential);
        const result = await authService.googleSignIn(claims, role);

        if (result.needsRole) {
            return res.json({ needsRole: true, firstName: result.firstName });
        }

        res.cookie('jwt', result.refreshToken, REFRESH_COOKIE_OPTIONS);
        res.json(result.user);
    } catch (error) {
        next(error);
    }
});

// LINK GOOGLE ACCOUNT
router.post('/link-google', requireAuth, async (req, res, next) => {
    try {
        const { sub } = await verifyGoogleCredential(req.body?.credential);

        const existingUser = await User.findOne({ googleId: sub });
        if (existingUser && String(existingUser._id) !== String(req.currentUser._id)) {
            return res.status(400).json({ success: false, message: 'This Google account is already linked to another user.' });
        }

        const user = req.currentUser;
        user.googleId = sub;
        user.isEmailVerified = true;
        await user.save();

        res.status(200).json({ success: true, message: 'Google account linked successfully.', googleId: sub });
    } catch (error) {
        next(error);
    }
});

// UNLINK GOOGLE ACCOUNT
router.post('/unlink-google', requireAuth, async (req, res, next) => {
    try {
        const user = req.currentUser;
        user.googleId = '';
        await user.save();

        res.status(200).json({ success: true, message: 'Google account unlinked successfully.' });
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
