const router = require('express').Router()
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const env = require('../config/env');
const emailService = require('../services/emailService');
const bcryptSalt = bcrypt.genSaltSync(7);

router.get('/sendResetCode/:email', async (req, res, next) => {
    try {
        const { email } = req.params
        const resetCode = emailService.makePasswordResetCode()
        const foundUser = await User.findOneAndUpdate({ email }, { $set: { resetCode } })

        if (foundUser) {
            const subject = "Password Reset"
            const message = `
                <h3>Forgot your password?</h3>
                <p>It's okay we all forget things sometimes</p>
                <br/>
                <p>Here's your reset code:</p>
                <p>${resetCode}</p>
                <p>Cheers,</p>
                <p>The Osmosis Team</p>
            `
            await emailService.sendEmail({
                subject,
                message,
                sendTo: email,
                sentFrom: env.EMAIL_USER,
                replyTo: email
            })
            res.status(200).json({
                success: true, message: "Email Sent"
            })
        } else {
            res.json({ result: 'Email not found' })
        }
    } catch (error) {
        next(error);
    }
})

router.get('/verifyResetCode/:email/:resetCode', async (req, res, next) => {
    try {
        const { email, resetCode } = req.params
        const foundUser = await User.findOne({ email })
        if (foundUser) {
            if (foundUser.resetCode === resetCode) {
                res.json({ result: 'success' })
            } else {
                res.json({ result: 'Incorrect reset code' })
            }
        } else {
            res.json({ result: 'Email not found' })
        }
    } catch (error) {
        next(error);
    }
})

router.patch('/updatePassword/:email/:resetCode', async (req, res, next) => {
    try {
        const { email, password, resetCode } = req.body
        const hashedPassword = await bcrypt.hash(password, bcryptSalt);
        const updatedUser = await User.findOneAndUpdate(
            { email: email, resetCode: resetCode },
            { $set: { password: hashedPassword, resetCode: '' } })
        if (updatedUser) {
            res.json({ result: 'success' })
        } else {
            res.json({ result: 'Password not updated' })
        }
    } catch (error) {
        next(error);
    }
})

module.exports = router;