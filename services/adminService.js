const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { z } = require('zod');
const User = require('../models/user');
const Course = require('../models/course');
const env = require('../config/env');
const cloudinary = require('../config/cloudinary');
const emailService = require('./emailService');
const guestAccountService = require('./guestAccountService');
const payoutService = require('./payoutService');
const { emailMatch, buildRoles } = require('./authService');

/**
 * Outreach tools for the Studio Time team: set up an artist's account and studio times for them,
 * then hand it over with a "claim your studio" link. The artist owns the account from the start
 * (their name, username and URL); the team only gets short-lived access until it's claimed.
 */

const httpError = (status, message) => Object.assign(new Error(message), { status });
const escapeHtml = (text) => String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ACTING_TOKEN_TTL = '2h';
const frontendUrl = () => (env.FRONTEND_URL || 'https://getstudiotime.com').replace(/\/$/, '');

const text = (schema) => z.preprocess((value) => (value == null ? '' : value), schema);
const artistSchema = z.object({
    firstName: text(z.string().trim().min(1, "Enter the artist's first name.").max(50)),
    lastName: text(z.string().trim().min(1, "Enter the artist's last name.").max(50)),
    email: text(z.string().trim().toLowerCase().email("Enter the artist's email address.").max(254)),
    userName: text(z.string().trim().min(3, 'Usernames need at least 3 characters.').max(30)
        .regex(/^[a-zA-Z0-9._]+$/, 'Usernames can only use letters, numbers, dots and underscores.')),
    description: text(z.string().trim().max(1000)).optional(),
    profileImage: z.string().startsWith('data:image/').optional(),
});

/** Whether a team member may still work on this account (an artist account that hasn't been claimed). */
const isManageable = (user) => Boolean(user?.isTeacher && user.passwordSetupRequired);

const summary = async (user) => {
    const listings = await Course.countDocuments({ teacherID: user._id });
    return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        profileImage: user.profileImage,
        claimed: !user.passwordSetupRequired,
        listings,
        payoutsReady: payoutService.payoutsReady(user),
        createdAt: user.createdAt,
    };
};

/** Creates an artist account the artist will claim later. */
const createArtist = async (admin, raw) => {
    const result = artistSchema.safeParse(raw || {});
    if (!result.success) throw httpError(400, result.error.issues[0]?.message || 'Check the details and try again.');
    const data = result.data;

    if (await User.exists(emailMatch(data.email))) throw httpError(409, 'An account with that email already exists.');
    if (await User.exists({ userName: data.userName })) throw httpError(409, 'That username is taken. Try another.');

    let profileImage;
    if (data.profileImage) {
        try {
            const uploaded = await cloudinary.uploader.upload(data.profileImage);
            profileImage = { public_id: uploaded.public_id, url: uploaded.secure_url };
        } catch (err) {
            console.error('[admin] Profile photo upload failed:', err.message);
            throw httpError(502, "We couldn't upload the photo. Try again, or add it later.");
        }
    }

    const artist = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        userName: data.userName,
        description: data.description || '',
        ...(profileImage && { profileImage }),
        // Random and never shown: nobody can sign in until the artist sets their own password.
        password: bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 7),
        isTeacher: true,
        isStudent: false,
        isEmailVerified: false,
        passwordSetupRequired: true,
        createdByAdmin: admin._id,
    });
    return summary(artist);
};

/** Artist accounts the team has set up (newest first), with whether each has been claimed. */
const listArtists = async () => {
    const artists = await User.find({ createdByAdmin: { $exists: true }, isTeacher: true }).sort({ createdAt: -1 }).limit(500);
    return Promise.all(artists.map(summary));
};

const findManageableArtist = async (artistId) => {
    if (!mongoose.isValidObjectId(artistId)) throw httpError(404, "We couldn't find that artist.");
    const artist = await User.findById(artistId);
    if (!artist) throw httpError(404, "We couldn't find that artist.");
    if (!isManageable(artist)) throw httpError(409, `${artist.firstName || 'This artist'} has claimed their account, so only they can change it now.`);
    return artist;
};

/**
 * Short-lived access to an unclaimed artist account, to build their profile and studio times.
 * The token is marked as acting for the team member: it stops working the moment the artist claims
 * the account, and it can't set up payouts, message anyone or delete the account.
 */
const actAsArtist = async (admin, artistId) => {
    const artist = await findManageableArtist(artistId);
    const roles = buildRoles(artist);
    const accessToken = jwt.sign({ userName: artist.userName, roles, actingBy: String(admin._id) }, env.ACCESS_TOKEN_SECRET, { expiresIn: ACTING_TOKEN_TTL });
    return { user: { ...artist.toJSON(), roles, accessToken }, actingAs: { adminName: admin.firstName || 'Studio Time' } };
};

/** The "claim your studio" link (to paste in a DM), and optionally an email with it. */
const inviteArtist = async (admin, artistId, { sendEmail = false } = {}) => {
    const artist = await findManageableArtist(artistId);
    const link = guestAccountService.claimLinkFor(artist, { next: `/teachers/${artist.userName}` });
    let emailed = false;
    if (sendEmail) {
        const listings = await Course.find({ teacherID: artist._id }).select('courseTitle').limit(3);
        const titles = listings.map((c) => `<li>${escapeHtml(c.courseTitle)}</li>`).join('');
        try {
            await emailService.sendEmail({
                sendTo: artist.email,
                replyTo: env.RESEND_FROM_EMAIL || undefined,
                subject: `${admin.firstName || 'Studio Time'} set up your studio on Studio Time`,
                message: `
                    <p>Hi ${escapeHtml(artist.firstName)},</p>
                    <p>${escapeHtml(admin.firstName || 'We')} set up your Studio Time profile so guests can book time in your studio.</p>
                    ${titles ? `<p>Your studio times:</p><ul>${titles}</ul>` : ''}
                    <p><a href="${link}"><strong>Claim your studio</strong></a>: set a password, check everything looks right, and set up payouts so guests can start booking.</p>
                    <p>Your profile: <a href="${frontendUrl()}/teachers/${encodeURIComponent(artist.userName)}">${frontendUrl().replace(/^https?:\/\//, '')}/teachers/${escapeHtml(artist.userName)}</a></p>
                    <p>Questions? Just reply to this email.</p>
                    <p>The Studio Time Team</p>
                `,
            });
            emailed = true;
        } catch (err) {
            console.error('[admin] Invite email failed:', err.message);
            throw httpError(502, "We couldn't send the email. Copy the link and send it yourself instead.");
        }
    }
    return { link, emailed };
};

module.exports = { createArtist, listArtists, actAsArtist, inviteArtist, isManageable };
