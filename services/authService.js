const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const stripe = require('./stripeClient');
const emailService = require('./emailService');

const bcryptSalt = bcrypt.genSaltSync(7);
const jwtSecret = env.ACCESS_TOKEN_SECRET;
const refreshSecret = env.REFRESH_TOKEN_SECRET;

const ACCESS_TOKEN_TTL = '1d';
const REFRESH_TOKEN_TTL_DAYS = 30;

// Options for the httpOnly refresh-token cookie. It lives as long as the refresh token itself,
// so "keep me signed in" really lasts 30 days.
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

const ROLES = { USER: 2119, STUDENT: 1920, TEACHER: 205 };

// Every signed-in account has the base USER role; guests and hosts add their own.
const buildRoles = (user) => {
    const roles = [ROLES.USER];
    if (user?.isStudent) roles.push(ROLES.STUDENT);
    if (user?.isTeacher) roles.push(ROLES.TEACHER);
    return roles;
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Emails are matched case-insensitively ("Jane@Gmail.com" and "jane@gmail.com" are one account).
const emailMatch = (email) => ({ email: { $regex: `^${escapeRegex(String(email).trim())}$`, $options: 'i' } });

const signAccessToken = (user, roles) => jwt.sign({ userName: user.userName, roles }, jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });

// Issues an access token and (optionally) a refresh token, storing the refresh token on the user.
const issueTokens = async (userDoc, { persist = true } = {}) => {
    const roles = buildRoles(userDoc);
    const accessToken = signAccessToken(userDoc, roles);
    const refreshToken = persist
        ? jwt.sign({ userName: userDoc.userName, roles }, refreshSecret, { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` })
        : '';
    userDoc.refreshToken = refreshToken;
    await userDoc.save();
    return { roles, accessToken, refreshToken };
};

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
            userDoc = await User.findOne({ $or: [emailMatch(email), { userName: email }] });
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
        let tokens;
        try {
            tokens = await issueTokens(userDoc, { persist });
            console.log(`[Login] Refresh token saved. Login process complete.`);
        } catch (saveError) {
            console.error(`[Login] Failed to save refresh token to database:`, saveError);
            throw saveError;
        }
        const { roles, accessToken, refreshToken } = tokens;

        return {
            user: { ...userDoc.toJSON(), roles, accessToken },
            refreshToken
        };
    }

    async registerUser(userData) {
        const { email, userName, firstName, lastName, isStudent, isTeacher } = userData;
        console.log(`[Signup] Starting registration for user: email=${email}, userName=${userName}`);

        const existingUser = await User.findOne({ $or: [emailMatch(email), { userName }] });
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
        // Only these fields come from the signup form; everything else is set by the server.
        const userInfo = {
            firstName,
            lastName,
            userName,
            email,
            isStudent: Boolean(isStudent),
            isTeacher: Boolean(isTeacher),
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
            await emailService.sendVerificationEmail(email, verificationCode);
            console.log(`[Signup] Verification email sent to ${email}`);
        } catch (emailError) {
            console.error("[Signup] Failed to send verification email:", emailError);
            if (env.NODE_ENV !== 'production') {
                console.log(`[Signup] [DEV FALLBACK] Verification code for ${email} is: ${verificationCode}`);
            }
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

                const roles = buildRoles(foundUser);
                const accessToken = signAccessToken(foundUser, roles);

                resolve({ ...foundUser.toJSON(), roles, accessToken });
            });
        });
    }

    /**
     * Signs in (or signs up) with already-verified Google claims.
     * Returns { needsRole: true } for a brand-new user who hasn't said whether they are
     * an artist or a guest yet; the client asks, then calls again with `role`.
     */
    async googleSignIn(claims, role) {
        const { email, sub, given_name, family_name } = claims;

        let userDoc = await User.findOne({ $or: [{ googleId: sub }, emailMatch(email)] });
        let isNewUser = false;

        if (userDoc) {
            if (!userDoc.googleId) {
                userDoc.googleId = sub;
                userDoc.isEmailVerified = true;
                await userDoc.save();
            }
        } else {
            const normalizedRole = role === 'student' ? 'guest' : role;
            if (normalizedRole !== 'artist' && normalizedRole !== 'guest') {
                return { needsRole: true, firstName: given_name || '' };
            }

            isNewUser = true;
            const firstName = given_name || 'Google';
            const lastName = family_name || 'User';
            const baseUsername = (given_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
            let userName = baseUsername;
            let count = 1;
            while (await User.findOne({ userName })) {
                userName = `${baseUsername}${count}`;
                count++;
            }

            const isTeacher = normalizedRole === 'artist';
            const isStudent = !isTeacher;

            let accountID;
            let customerID;
            try {
                if (isTeacher) {
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
                } else {
                    const customer = await stripe.customers.create({
                        name: firstName + ' ' + lastName,
                        email: email,
                    });
                    customerID = customer.id;
                }
            } catch (stripeErr) {
                console.error("Stripe initialization failed for Google signup:", stripeErr);
            }

            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            const userInfo = {
                firstName,
                lastName,
                userName,
                email,
                password: bcrypt.hashSync(randomPassword, bcryptSalt),
                isStudent,
                isTeacher,
                isEmailVerified: true,
                googleId: sub,
                stripeID: accountID,
                customerStripeID: customerID
            };
            Object.keys(userInfo).forEach(key => userInfo[key] === undefined && delete userInfo[key]);
            userDoc = await User.create(userInfo);
        }

        const { roles, accessToken, refreshToken } = await issueTokens(userDoc);
        return {
            user: { ...userDoc.toJSON(), roles, accessToken, isNewUser },
            refreshToken,
        };
    }

    async updateProfileImage(userId, image, authHeader) {
        const accessToken = authHeader?.slice(7);
        if (!accessToken) throw { status: 401, message: 'Unauthorized' };

        return new Promise((resolve, reject) => {
            jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
                // 403 (not 401) so the client refreshes an expired token and retries.
                if (err) return reject({ status: 403, message: 'Your session has expired. Please sign in again.' });

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
module.exports.REFRESH_COOKIE_OPTIONS = REFRESH_COOKIE_OPTIONS;
module.exports.ROLES = ROLES;
module.exports.buildRoles = buildRoles;
module.exports.emailMatch = emailMatch;
module.exports.issueTokens = issueTokens;
