const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');
const env = require('../config/env');
const stripe = require('./stripeClient');
const emailService = require('./emailService');

const bcryptSalt = bcrypt.genSaltSync(7);
const jwtSecret = env.ACCESS_TOKEN_SECRET;
const refreshSecret = env.REFRESH_TOKEN_SECRET;

class AuthService {
    async login(email, password, persist) {
        if (!email || !password) {
            throw { status: 400, message: 'Username and password are required.' };
        }

        const userDoc = await User.findOne({ $or: [{ email }, { userName: email }] });
        if (!userDoc) {
            throw { status: 401, message: 'Unauthorized' };
        }

        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (!passOk) {
            throw { status: 401, message: 'Unauthorized' };
        }

        const roles = Object.values(userDoc?.roles || [2119]).filter(Boolean);
        if (userDoc?.isStudent && !roles.includes(1920)) roles.push(1920);
        if (userDoc?.isTeacher && !roles.includes(205)) roles.push(205);

        const accessToken = jwt.sign(
            { userName: userDoc.userName, roles },
            jwtSecret,
            { expiresIn: '1d' }
        );

        let refreshToken = '';
        if (persist) {
            refreshToken = jwt.sign(
                { userName: userDoc.userName, roles },
                refreshSecret,
                { expiresIn: '30d' }
            );
        }

        userDoc.refreshToken = refreshToken;
        await userDoc.save();

        return {
            user: { ...userDoc._doc, roles, accessToken },
            refreshToken
        };
    }

    async registerUser(userData) {
        const { email, userName, firstName, lastName, isStudent, isTeacher } = userData;

        const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
        if (existingUser) {
            if (existingUser.userName === userName) {
                return { success: false, message: 'Unsuccessful. This username is already taken.' };
            }
            return { success: false, message: 'Unsuccessful. This email is already registered.' };
        }

        let accountID;
        let customerID;

        if (isStudent && isTeacher) {
            const customer = await stripe.customers.create({
                name: firstName + lastName,
                email: email,
            });
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: email,
                business_type: 'individual',
                business_profile: {
                    url: `https://studiotime.app/teachers/${userName}`,
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
            customerID = customer.id;
        } else if (isTeacher) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: email,
                business_type: 'individual',
                business_profile: {
                    url: `https://studiotime.app/teachers/${userName}`,
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
        } else if (isStudent) {
            const customer = await stripe.customers.create({
                name: firstName + lastName,
                email: email,
            });
            customerID = customer.id;
        }

        const verificationCode = emailService.makePasswordResetCode();
        const userInfo = {
            ...userData,
            password: bcrypt.hashSync(userData.password, bcryptSalt),
            stripeID: accountID,
            customerStripeID: customerID,
            isEmailVerified: false,
            emailVerificationCode: verificationCode
        };

        // Clean up undefined
        Object.keys(userInfo).forEach(key => {
            if (userInfo[key] === undefined) delete userInfo[key];
        });

        await User.create(userInfo);

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
            console.log(`Verification email sent to ${email} with code ${verificationCode}`);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            console.log(`[DEV FALLBACK] Verification code for ${email} is: ${verificationCode}`);
        }

        return { success: true, message: 'Successfully saved a new user.', email };
    }

    async refresh(refreshToken) {
        if (!refreshToken) throw { status: 401, message: 'Unauthorized' };

        const foundUser = await User.findOne({ refreshToken }).exec();
        if (!foundUser) throw { status: 403, message: 'Forbidden' };

        return new Promise((resolve, reject) => {
            jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
                if (err || foundUser.userName !== decoded.userName) {
                    return reject({ status: 403, message: 'Forbidden' });
                }

                const roles = Object.values(foundUser?.roles || [2119]).filter(Boolean);
                if (foundUser?.isStudent && !roles.includes(1920)) roles.push(1920);
                if (foundUser?.isTeacher && !roles.includes(205)) roles.push(205);

                const accessToken = jwt.sign(
                    { userName: decoded.userName, roles: roles },
                    jwtSecret,
                    { expiresIn: '1d' }
                );

                resolve({ ...foundUser._doc, refreshToken: '', roles, accessToken });
            });
        });
    }

    async updateProfileImage(userId, image, authHeader) {
        const accessToken = authHeader?.slice(7);
        if (!accessToken) throw { status: 401, message: 'Unauthorized' };

        return new Promise((resolve, reject) => {
            jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
                if (err) return reject({ status: 401, message: 'Unauthorized' });

                try {
                    const currentUser = await User.findById(userId);
                    if (!currentUser) return reject({ status: 404, message: 'User not found' });

                    if (userData.userName !== currentUser.userName) {
                        return reject({ status: 403, message: 'Forbidden' });
                    }

                    const data = {};
                    if (image !== '') {
                        const ImgId = currentUser.profileImage?.public_id;
                        if (ImgId) {
                            await cloudinary.uploader.destroy(ImgId);
                        }

                        const newImage = await cloudinary.uploader.upload(image);
                        data.profileImage = {
                            public_id: newImage.public_id,
                            url: newImage.secure_url
                        };
                    }

                    const userUpdate = await User.findOneAndUpdate(
                        { _id: userId },
                        { $set: data },
                        { new: true }
                    );

                    resolve(userUpdate);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}

module.exports = new AuthService();
