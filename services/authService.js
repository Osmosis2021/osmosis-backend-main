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
        console.log(`[Login] Login attempt initiated for identifier: "${email}"`);
        if (!email || !password) {
            console.log(`[Login] Failure: Missing email/username or password.`);
            throw { status: 400, message: 'Username and password are required.' };
        }

        console.log(`[Login] Searching database for user...`);
        let userDoc;
        try {
            userDoc = await User.findOne({ $or: [{ email }, { userName: email }] });
        } catch (dbError) {
            console.error(`[Login] Database query error:`, dbError);
            throw dbError;
        }

        if (!userDoc) {
            console.log(`[Login] Failure: User not found in MongoDB.`);
            throw { status: 401, message: 'Unauthorized' };
        }

        console.log(`[Login] User found: userName="${userDoc.userName}", email="${userDoc.email}". Verifying password...`);
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (!passOk) {
            console.log(`[Login] Failure: Incorrect password provided.`);
            throw { status: 401, message: 'Unauthorized' };
        }

        console.log(`[Login] Password verified successfully. Generating tokens...`);
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
        try {
            await userDoc.save();
            console.log(`[Login] Refresh token saved. Login process complete.`);
        } catch (saveError) {
            console.error(`[Login] Failed to save refresh token to database:`, saveError);
            throw saveError;
        }

        return {
            user: { ...userDoc._doc, roles, accessToken },
            refreshToken
        };
    }

    async registerUser(userData) {
        const { email, userName, firstName, lastName, isStudent, isTeacher } = userData;
        console.log(`[Signup] Starting registration for user: email=${email}, userName=${userName}`);

        const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
        if (existingUser) {
            if (existingUser.userName === userName) {
                console.log(`[Signup] Registration failed: Username "${userName}" is already taken.`);
                return { success: false, message: 'Unsuccessful. This username is already taken.' };
            }
            console.log(`[Signup] Registration failed: Email "${email}" is already registered.`);
            return { success: false, message: 'Unsuccessful. This email is already registered.' };
        }

        let accountID;
        let customerID;

        try {
            if (isStudent && isTeacher) {
                console.log(`[Signup] Initializing Stripe customer and account for both student and teacher...`);
                const customer = await stripe.customers.create({
                    name: firstName + ' ' + lastName,
                    email: email,
                });
                const account = await stripe.accounts.create({
                    type: 'express',
                    country: 'US',
                    email: email,
                    business_type: 'individual',
                    business_profile: {
                        url: `https://getstudiotime.com/teachers/${userName}`,
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
                console.log(`[Signup] Stripe initialized successfully: customerID=${customerID}, accountID=${accountID}`);
            } else if (isTeacher) {
                console.log(`[Signup] Initializing Stripe account for teacher...`);
                const account = await stripe.accounts.create({
                    type: 'express',
                    country: 'US',
                    email: email,
                    business_type: 'individual',
                    business_profile: {
                        url: `https://getstudiotime.com/teachers/${userName}`,
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
                console.log(`[Signup] Stripe initialized successfully: accountID=${accountID}`);
            } else if (isStudent) {
                console.log(`[Signup] Initializing Stripe customer for student...`);
                const customer = await stripe.customers.create({
                    name: firstName + ' ' + lastName,
                    email: email,
                });
                customerID = customer.id;
                console.log(`[Signup] Stripe initialized successfully: customerID=${customerID}`);
            }
        } catch (stripeErr) {
            console.error("[Signup] Stripe initialization failed during registration:", stripeErr);
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

        console.log(`[Signup] Saving new user to MongoDB...`);
        try {
            const createdUser = await User.create(userInfo);
            console.log(`[Signup] User saved successfully. User ID: ${createdUser._id}`);
        } catch (dbError) {
            console.error(`[Signup] Failed to save user to MongoDB:`, dbError);
            throw dbError;
        }

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
            console.log(`[Signup] Verification email sent to ${email} with code ${verificationCode}`);
        } catch (emailError) {
            console.error("[Signup] Failed to send verification email:", emailError);
            console.log(`[Signup] [DEV FALLBACK] Verification code for ${email} is: ${verificationCode}`);
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
