const router = require('express').Router()
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const jwtSecret = 'randomString';
const bcryptSalt = bcrypt.genSaltSync(7);

makePasswordResetCode = () => {
    let code = '';
    const chars = '0123456789';
    for (let i = 1; code.length < 6; i++) {
        code += chars.charAt(Math.random() * chars.length)
    }
    return code;
}


const sendEmail = async (subject, message, sendTo, sentFrom, replyTo) => {

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // not necessary something with https, actually might be necessary 
        tls: {
            rejectUnauthorized: false,
        }
    })

    const options = {
        from: sentFrom,
        to: sendTo,
        replyTo: replyTo,
        subject: subject,
        html: message,
    }
    // SEND EMAIL
    transporter.sendMail(options, function(err, info) {
        if(err) {
            console.log(err)
        } else {
            console.log(info)
        }
    })
};

router.get('/sendResetCode/:email', async (req, res) => {
    // give user a temporary code via email to reset their password
    const {email} = req.params
    console.log('email to reset', email);
    const resetCode = makePasswordResetCode()
    const foundUser = await User.findOneAndUpdate({email}, {$set: {resetCode}})
    if (foundUser) {
        // sendEmail(email, templates.resetCode(resetCode))
            const sendTo = email;
            const sentFrom = process.env.EMAIL_USER;
            const replyTo = email;
            const subject = "Password Reset"
            const message = 
            `
                <h3>Forgot your password?</h3>
                <p>It's okay we all forget things sometimes</p>
                <br/>
                <p>Here's your reset code:</p>
                <p>${resetCode}</p>
                <p>Cheers,</p>
                <p>The Osmosis Team</p>
            `
            await sendEmail (subject, message, sendTo, sentFrom, replyTo)
            res.status(200).json({
                success: true, message: "Email Sent"
            })
 
    } else {
        res.json({result: 'Email not found'})
    }
})


// reply verify that email corresponds to user's passwordResetCode
router.get('/verifyResetCode/:email/:resetCode', async (req, res) => {
    const {email, resetCode} = req.params
    const foundUser = await User.findOne({email})
    if (foundUser) {
        if (foundUser.resetCode === resetCode) {
            res.json({result: 'success'})
        } else {
            res.json({result: 'Incorrect reset code'})
        }
    } else {
        res.json({result: 'Email not found'})
    }
})

router.patch('/updatePassword/:email/:resetCode', async (req, res) => {
    // change a user's password if they have the right reset code
    const {email, password, resetCode} = req.body
    const hashedPassword = await bcrypt.hash(password, bcryptSalt);
    const updatedUser = await User.findOneAndUpdate(
        {email: email, resetCode: resetCode},
        {$set: {password: hashedPassword, resetCode: ''}})
    if (updatedUser) {
        res.json({result: 'success'})
    } else {
        res.json({result: 'Password not updated'})
    }
})




module.exports = router;
