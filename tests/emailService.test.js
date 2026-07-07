const emailService = require('../services/emailService');

describe('EmailService', () => {
    let originalResend;
    let mockSend;

    beforeEach(() => {
        originalResend = emailService.resend;
        mockSend = jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null });
        emailService.resend = {
            emails: {
                send: mockSend
            }
        };
    });

    afterEach(() => {
        emailService.resend = originalResend;
    });

    test('sendEmail uses Resend SDK when available', async () => {
        const result = await emailService.sendEmail({
            subject: 'Test Subject',
            message: '<p>Test Message</p>',
            sendTo: 'user@example.com'
        });

        expect(mockSend).toHaveBeenCalledWith({
            from: expect.stringContaining('onboarding@resend.dev'),
            to: 'user@example.com',
            replyTo: 'user@example.com',
            subject: 'Test Subject',
            html: '<p>Test Message</p>'
        });
        expect(result).toEqual({ id: 'test-id' });
    });

    test('sendVerificationEmail formatted correctly', async () => {
        await emailService.sendVerificationEmail('user@example.com', '123456');

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: 'user@example.com',
            subject: 'Verify your email address - Studio Time',
            html: expect.stringContaining('123456')
        }));
    });

    test('sendUpdatedEmailVerification formatted correctly', async () => {
        await emailService.sendUpdatedEmailVerification('user@example.com', '123456');

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: 'user@example.com',
            subject: 'Verify your updated email address - Studio Time',
            html: expect.stringContaining('123456')
        }));
    });

    test('sendPasswordResetEmail formatted correctly', async () => {
        await emailService.sendPasswordResetEmail('user@example.com', '654321');

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: 'user@example.com',
            subject: 'Password Reset',
            html: expect.stringContaining('654321')
        }));
    });

    test('makePasswordResetCode generates a 6 digit code', () => {
        const code = emailService.makePasswordResetCode();
        expect(code).toHaveLength(6);
        expect(Number(code)).not.toBeNaN();
    });
});
