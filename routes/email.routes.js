const router = require('express').Router()
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const env = require('../config/env');
const emailService = require('../services/emailService');
const attemptLimiter = require('../services/attemptLimiter');
const bcryptSalt = bcrypt.genSaltSync(7);

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 6;

// A reset code is valid only if it matches, has not expired, and the email is not locked out.
// Codes issued before expiries existed (no resetCodeExpires) are treated as expired.
const checkResetCode = (user, resetCode) => {
    if (!user.resetCode || user.resetCode !== String(resetCode)) return 'Incorrect reset code';
    if (!user.resetCodeExpires || user.resetCodeExpires.getTime() < Date.now()) {
        return 'This reset code has expired. Please request a new one.';
    }
    return null;
};

router.get('/sendResetCode/:email', async (req, res, next) => {
    try {
        const { email } = req.params;
        const resetCode = emailService.makePasswordResetCode();
        const foundUser = await User.findOneAndUpdate({ email }, { $set: { resetCode, resetCodeExpires: new Date(Date.now() + RESET_CODE_TTL_MS) } });
        // A fresh code resets the failed-attempt counter.
        attemptLimiter.reset(`reset:${email}`);

        if (foundUser) {
            try {
                await emailService.sendPasswordResetEmail(email, resetCode);
                res.status(200).json({
                    success: true, message: "Email Sent"
                });
            } catch (emailError) {
                console.error("Failed to send reset email:", emailError);
                res.status(500).json({ success: false, result: 'Failed to send email', error: emailError.message });
            }
        } else {
            res.status(404).json({ success: false, result: 'Email not found' });
        }
    } catch (error) {
        console.error("Error in sendResetCode:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/verifyResetCode/:email/:resetCode', async (req, res, next) => {
    try {
        const { email, resetCode } = req.params;
        const limiterKey = `reset:${email}`;
        if (attemptLimiter.isLocked(limiterKey)) {
            return res.status(429).json({ result: attemptLimiter.LOCKED_MESSAGE });
        }
        const foundUser = await User.findOne({ email });
        if (foundUser) {
            const problem = checkResetCode(foundUser, resetCode);
            if (!problem) {
                res.status(200).json({ result: 'success' });
            } else {
                attemptLimiter.recordFailure(limiterKey);
                res.status(400).json({ result: problem });
            }
        } else {
            res.status(404).json({ result: 'Email not found' });
        }
    } catch (error) {
        console.error("Error in verifyResetCode:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/updatePassword/:email/:resetCode', async (req, res, next) => {
    try {
        const email = req.body.email || req.params.email;
        const resetCode = req.body.resetCode || req.params.resetCode;
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ result: 'Password is required' });
        }
        if (String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ result: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
        }

        const limiterKey = `reset:${email}`;
        if (attemptLimiter.isLocked(limiterKey)) {
            return res.status(429).json({ result: attemptLimiter.LOCKED_MESSAGE });
        }

        const foundUser = await User.findOne({ email });
        const problem = foundUser ? checkResetCode(foundUser, resetCode) : 'Password not updated';
        if (problem) {
            attemptLimiter.recordFailure(limiterKey);
            return res.status(400).json({ result: problem });
        }

        const hashedPassword = await bcrypt.hash(password, bcryptSalt);
        await User.updateOne(
            { _id: foundUser._id },
            // The reset code came by email, so this also finishes a guest-checkout account.
            { $set: { password: hashedPassword, resetCode: '', passwordSetupRequired: false, isEmailVerified: true }, $unset: { resetCodeExpires: 1 } }
        );
        attemptLimiter.reset(limiterKey);
        res.status(200).json({ result: 'success' });
    } catch (error) {
        console.error("Error in updatePassword:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;