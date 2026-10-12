const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/user');
const env = require('../config/env');
const { emailMatch } = require('./authService');

const httpError = (status, message) => Object.assign(new Error(message), { status });

const CLAIM_TOKEN_TTL = '60d';
const CLAIM_PURPOSE = 'claim-account';

/** Name and email a guest gives at checkout instead of signing up. */
// Missing fields are treated as empty so the guest sees the friendly message, not a type error.
const text = (schema) => z.preprocess((value) => (value == null ? '' : value), schema);
const guestDetailsSchema = z.object({
    firstName: text(z.string().trim().min(1, 'Please enter your first name.').max(50)),
    lastName: text(z.string().trim().min(1, 'Please enter your last name.').max(50)),
    email: text(z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254)),
});

const parseGuestDetails = (raw) => {
    const result = guestDetailsSchema.safeParse(raw || {});
    if (!result.success) throw httpError(400, result.error.issues[0]?.message || 'Please enter your name and email.');
    return result.data;
};

const uniqueUserName = async (firstName, lastName) => {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'guest';
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidate = `${base}${crypto.randomInt(1000, 10000)}`;
        if (!(await User.exists({ userName: candidate }))) return candidate;
    }
    return `${base}${Date.now()}`;
};

/**
 * The account a guest checkout belongs to. An existing account with that email is reused
 * (the guest isn't signed in to it); otherwise a placeholder account is created with no usable
 * password, which the guest claims later from the link in their confirmation email.
 *
 * Only called once a payment has gone through, so unpaid checkouts never create accounts.
 */
const findOrCreateGuestAccount = async (details) => {
    const { firstName, lastName, email } = parseGuestDetails(details);
    const existing = await User.findOne(emailMatch(email));
    if (existing) return { user: existing, created: false };

    try {
        const user = await User.create({
            firstName,
            lastName,
            email,
            userName: await uniqueUserName(firstName, lastName),
            // Random and never shown to anyone: nobody can sign in with a password until the
            // guest sets their own.
            password: bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 7),
            isStudent: true,
            isEmailVerified: false,
            passwordSetupRequired: true,
        });
        return { user, created: true };
    } catch (err) {
        // Two checkouts with the same new email at once: use the account the other one created.
        if (err.code === 11000) {
            const winner = await User.findOne(emailMatch(email));
            if (winner) return { user: winner, created: false };
        }
        throw err;
    }
};

/** Link for the confirmation email that lets a guest set a password. Null if not needed. */
const claimLinkFor = (user, { next } = {}) => {
    if (!user?.passwordSetupRequired) return null;
    const token = jwt.sign({ sub: String(user._id), purpose: CLAIM_PURPOSE }, env.ACCESS_TOKEN_SECRET, { expiresIn: CLAIM_TOKEN_TTL });
    const params = new URLSearchParams({ token });
    if (next) params.set('next', next);
    return `${env.FRONTEND_URL || 'https://getstudiotime.com'}/claim-account?${params.toString()}`;
};

/** Who a claim link belongs to, for showing "Welcome back, Ana" before they set a password. */
const userForClaimToken = async (token) => {
    let payload;
    try {
        payload = jwt.verify(String(token || ''), env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw httpError(400, 'This link has expired or isn\'t valid. Use "Forgot password" on the login page to set a password instead.');
    }
    if (payload.purpose !== CLAIM_PURPOSE) throw httpError(400, "This link isn't valid.");
    const user = await User.findById(payload.sub);
    if (!user) throw httpError(404, 'We couldn\'t find this account.');
    if (!user.passwordSetupRequired) throw httpError(409, 'This account already has a password. Please log in.');
    return user;
};

/**
 * Sets the guest's password. Following the emailed link proves they own the email,
 * so the email is marked verified too. Returns the user, ready to be signed in.
 */
const claimAccount = async (token, password) => {
    if (typeof password !== 'string' || password.length < 6) throw httpError(400, 'Please choose a password with at least 6 characters.');
    const user = await userForClaimToken(token);
    user.password = bcrypt.hashSync(password, 7);
    user.passwordSetupRequired = false;
    user.isEmailVerified = true;
    user.emailVerificationCode = '';
    await user.save();
    return user;
};

module.exports = { parseGuestDetails, findOrCreateGuestAccount, claimLinkFor, userForClaimToken, claimAccount };
