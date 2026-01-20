const nodemailer = require('nodemailer');
const env = require('../config/env');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.EMAIL_HOST,
            port: env.EMAIL_PORT,
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            }
        });
    }

    async sendEmail({ subject, message, sendTo, sentFrom, replyTo }) {
        const options = {
            from: sentFrom || env.EMAIL_USER,
            to: sendTo,
            replyTo: replyTo || sendTo,
            subject: subject,
            html: message,
        };

        return this.transporter.sendMail(options);
    }

    makePasswordResetCode() {
        let code = '';
        const chars = '0123456789';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}

module.exports = new EmailService();
