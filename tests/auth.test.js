/* eslint-env jest */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const authRoutes = require('../routes/auth.routes');
const User = require('../models/user');
const stripe = require('../services/stripeClient');
const cloudinary = require('cloudinary');

jest.mock('../services/stripeClient');
jest.mock('cloudinary');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    app.use(require('../middleware/errorHandler'));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Auth Routes', () => {
    describe('POST /auth/registerUser', () => {
        it('should register a new student and create a Stripe customer', async () => {
            stripe.customers.create.mockResolvedValue({ id: 'cus_test123' });

            const userData = {
                email: 'student@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                userName: 'johndoe',
                isStudent: true,
                isTeacher: false
            };

            const response = await request(app)
                .post('/auth/registerUser')
                .send(userData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Successfully saved a new user.');

            const user = await User.findOne({ email: 'student@example.com' });
            expect(user).toBeDefined();
            expect(user.customerStripeID).toBe('cus_test123');
            expect(user.stripeID).toBeUndefined();

            expect(stripe.customers.create).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'student@example.com'
            });
        });

        it('should register a new teacher and create a Stripe account', async () => {
            stripe.accounts.create.mockResolvedValue({ id: 'acct_test123' });

            const userData = {
                email: 'teacher@example.com',
                password: 'password123',
                firstName: 'Jane',
                lastName: 'Smith',
                userName: 'janesmith',
                isStudent: false,
                isTeacher: true
            };

            const response = await request(app)
                .post('/auth/registerUser')
                .send(userData);

            expect(response.status).toBe(200);
            const user = await User.findOne({ email: 'teacher@example.com' });
            expect(user.stripeID).toBe('acct_test123');
            expect(user.customerStripeID).toBeUndefined();

            expect(stripe.accounts.create).toHaveBeenCalled();
        });

        it('should register a user as both student and teacher', async () => {
            stripe.customers.create.mockResolvedValue({ id: 'cus_both' });
            stripe.accounts.create.mockResolvedValue({ id: 'acct_both' });

            const userData = {
                email: 'both@example.com',
                password: 'password123',
                firstName: 'Both',
                lastName: 'User',
                userName: 'bothuser',
                isStudent: true,
                isTeacher: true
            };

            await request(app).post('/auth/registerUser').send(userData);

            const user = await User.findOne({ email: 'both@example.com' });
            expect(user.customerStripeID).toBe('cus_both');
            expect(user.stripeID).toBe('acct_both');
        });

        it('should return error if username is taken', async () => {
            await User.create({
                email: 'other@example.com',
                password: 'hash',
                userName: 'taken',
                firstName: 'Other',
                lastName: 'User'
            });

            const response = await request(app)
                .post('/auth/registerUser')
                .send({
                    email: 'new@example.com',
                    password: 'pass',
                    userName: 'taken'
                });

            expect(response.body.message).toContain('already taken');
        });
    });

    describe('POST /auth/login', () => {
        it('should login successfully and return access token', async () => {
            const bcrypt = require('bcryptjs');
            const password = 'password123';
            const hashedPassword = bcrypt.hashSync(password, 7);

            await User.create({
                email: 'login@example.com',
                password: hashedPassword,
                userName: 'loginuser',
                firstName: 'Login',
                lastName: 'User',
                isStudent: true
            });

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'login@example.com', password });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.userName).toBe('loginuser');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'wrong' });

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /auth/updateProfileImage/:id', () => {
        it('should update profile image and call cloudinary', async () => {
            const jwt = require('jsonwebtoken');
            const userId = new mongoose.Types.ObjectId();
            const token = jwt.sign({ id: userId, userName: 'testuser' }, process.env.ACCESS_TOKEN_SECRET);

            await User.create({
                _id: userId,
                email: 'test@example.com',
                password: 'hash',
                userName: 'testuser',
                firstName: 'Test',
                lastName: 'User',
                profileImage: { public_id: 'old_id', url: 'old_url' }
            });

            cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });
            cloudinary.uploader.upload.mockResolvedValue({
                public_id: 'new_id',
                secure_url: 'new_url'
            });

            const response = await request(app)
                .put(`/auth/updateProfileImage/${userId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ image: 'data:image/png;base64,newimage' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('old_id');
            expect(cloudinary.uploader.upload).toHaveBeenCalled();

            const updatedUser = await User.findById(userId);
            expect(updatedUser.profileImage.public_id).toBe('new_id');
        });
    });

    describe('POST /auth/resend-verification', () => {
        const emailService = require('../services/emailService');

        it('should return 400 if email is missing', async () => {
            const response = await request(app)
                .post('/auth/resend-verification')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email is required.');
        });

        it('should return 404 if user not found', async () => {
            const response = await request(app)
                .post('/auth/resend-verification')
                .send({ email: 'nonexistent@example.com' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found.');
        });

        it('should return 200 if email is already verified', async () => {
            await User.create({
                email: 'verified@example.com',
                password: 'hash',
                userName: 'verifieduser',
                firstName: 'Verified',
                lastName: 'User',
                isEmailVerified: true
            });

            const response = await request(app)
                .post('/auth/resend-verification')
                .send({ email: 'verified@example.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Email is already verified.');
        });

        it('should resend verification code and return 200 on success', async () => {
            await User.create({
                email: 'unverified@example.com',
                password: 'hash',
                userName: 'unverifieduser',
                firstName: 'Unverified',
                lastName: 'User',
                isEmailVerified: false
            });

            const sendEmailSpy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue(true);

            const response = await request(app)
                .post('/auth/resend-verification')
                .send({ email: 'unverified@example.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Verification code resent successfully.');
            expect(sendEmailSpy).toHaveBeenCalled();

            const user = await User.findOne({ email: 'unverified@example.com' });
            expect(user.emailVerificationCode).toBeDefined();
            expect(user.emailVerificationCode.length).toBe(6);

            sendEmailSpy.mockRestore();
        });

        it('should return 500 error if email sending fails', async () => {
            await User.create({
                email: 'fail@example.com',
                password: 'hash',
                userName: 'failuser',
                firstName: 'Fail',
                lastName: 'User',
                isEmailVerified: false
            });

            const sendEmailSpy = jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('SMTP failure'));

            const response = await request(app)
                .post('/auth/resend-verification')
                .send({ email: 'fail@example.com' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Failed to send verification email');
            expect(response.body.error).toBe('SMTP failure');
            expect(sendEmailSpy).toHaveBeenCalled();

            sendEmailSpy.mockRestore();
        });
    });
});
