const router = require('express').Router()
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const env = require('../config/env');
const emailService = require('../services/emailService');
const bcryptSalt = bcrypt.genSaltSync(7);

router.get('/sendResetCode/:email', async (req, res, next) => {
    try {
        const { email } = req.params;
        const resetCode = emailService.makePasswordResetCode();
        const foundUser = await User.findOneAndUpdate({ email }, { $set: { resetCode } });

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
        const foundUser = await User.findOne({ email });
        if (foundUser) {
            if (foundUser.resetCode === resetCode) {
                res.status(200).json({ result: 'success' });
            } else {
                res.status(400).json({ result: 'Incorrect reset code' });
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

        const hashedPassword = await bcrypt.hash(password, bcryptSalt);
        const updatedUser = await User.findOneAndUpdate(
            { email: email, resetCode: resetCode },
            { $set: { password: hashedPassword, resetCode: '' } }
        );
        if (updatedUser) {
            res.status(200).json({ result: 'success' });
        } else {
            res.status(400).json({ result: 'Password not updated' });
        }
    } catch (error) {
        console.error("Error in updatePassword:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;