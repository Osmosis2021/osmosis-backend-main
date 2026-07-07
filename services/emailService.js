const { Resend } = require('resend');
const env = require('../config/env');

class EmailService {
    constructor() {
        const apiKey = env.RESEND_API_KEY;
        if (apiKey && apiKey !== 're_test_key') {
            this.resend = new Resend(apiKey);
        } else {
            console.warn("WARNING: RESEND_API_KEY is not defined or is placeholder. Email service will run in console log fallback mode.");
            this.resend = null;
        }
    }

    async sendEmail({ subject, message, sendTo, sentFrom, replyTo }) {
        const fromAddress = sentFrom || env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const formattedFrom = fromAddress.includes('<') ? fromAddress : `Studio Time <${fromAddress}>`;

        if (!this.resend) {
            console.log(`[Email Fallback Mode]
From: ${formattedFrom}
To: ${sendTo}
Reply-To: ${replyTo || sendTo}
Subject: ${subject}
Message: ${message}
`);
            return { id: 'mock-id-' + Date.now() };
        }

        const { data, error } = await this.resend.emails.send({
            from: formattedFrom,
            to: sendTo,
            replyTo: replyTo || sendTo,
            subject: subject,
            html: message,
        });

        if (error) {
            console.error("Resend API error:", error);
            throw new Error(error.message || 'Failed to send email via Resend');
        }

        return data;
    }

    async sendVerificationEmail(email, verificationCode) {
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
        return this.sendEmail({
            subject,
            message,
            sendTo: email,
            replyTo: email
        });
    }

    async sendResendVerificationEmail(email, verificationCode) {
        return this.sendVerificationEmail(email, verificationCode);
    }

    async sendUpdatedEmailVerification(email, verificationCode) {
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
        return this.sendEmail({
            subject,
            message,
            sendTo: email,
            replyTo: email
        });
    }

    async sendPasswordResetEmail(email, resetCode) {
        const subject = "Password Reset";
        const message = `
            <h3>Forgot your password?</h3>
            <p>It's okay we all forget things sometimes</p>
            <br/>
            <p>Here's your reset code:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${resetCode}</p>
            <br/>
            <p>Cheers,</p>
            <p>The Studio Time Team</p>
        `;
        return this.sendEmail({
            subject,
            message,
            sendTo: email,
            replyTo: email
        });
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
