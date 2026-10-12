const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const User = require('../models/user');
const emailService = require('./emailService');
const env = require('../config/env');
const guestAccountService = require('./guestAccountService');
const { effectiveStartAt, zonedTimeToUtc, addDays, isValidTimeZone, DEFAULT_TIMEZONE } = require('./sessionTime');

const httpError = (status, message) => Object.assign(new Error(message), { status });
const escapeHtml = (text) => String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MAX_REVIEW_LENGTH = 1000;
const REQUEST_WINDOW_DAYS = 7; // only ask about sessions from the last week
const REQUEST_HOUR = '09:00'; // the morning after, in the studio's timezone

const timeZoneOf = (slot, course) => {
    const zone = slot?.timezone || course?.timezone;
    return isValidTimeZone(zone) ? zone : DEFAULT_TIMEZONE;
};

/** When the session ends (start + length), or null if unknown. */
const sessionEnd = (slot, course) => {
    const start = slot ? effectiveStartAt(slot, timeZoneOf(slot, course)) : null;
    if (!start) return null;
    const minutes = slot.durationMinutes || course?.duration || 60;
    return new Date(start.getTime() + minutes * 60000);
};

/**
 * A guest reviews a session they went to: 1–5 stars, optional text, once per booking,
 * only after the session has finished and only if it wasn't cancelled.
 */
const submitReview = async (bookingId, user, { rating, text } = {}) => {
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw httpError(400, 'Please choose between 1 and 5 stars.');
    const written = typeof text === 'string' ? text.trim() : '';
    if (written.length > MAX_REVIEW_LENGTH) throw httpError(400, `Please keep your review under ${MAX_REVIEW_LENGTH} characters.`);

    if (!mongoose.isValidObjectId(bookingId)) throw httpError(404, "We couldn't find that booking.");
    const booking = await Booking.findById(bookingId);
    if (!booking) throw httpError(404, "We couldn't find that booking.");
    if (booking.studentUserName !== user.userName && String(booking.studentID) !== String(user._id)) {
        throw httpError(403, 'You can only review your own bookings.');
    }
    if (/^cancelled/.test(booking.status || '')) throw httpError(409, "This booking was cancelled, so it can't be reviewed.");
    if (booking.ratedAndReviewed) throw httpError(409, "You've already reviewed this session. Thank you!");

    const [course, slot] = await Promise.all([
        Course.findById(booking.courseID),
        CourseTimeslot.findById(booking.courseTimeslotID),
    ]);
    const end = sessionEnd(slot, course);
    if (end && end.getTime() > Date.now()) throw httpError(409, 'You can leave a review once the session is over.');

    // Claim the booking so a double tap can't add two reviews.
    const reviewed = await Booking.findOneAndUpdate(
        { _id: booking._id, ratedAndReviewed: { $ne: true } },
        { $set: { rating: stars, review: written, ratedAndReviewed: true, reviewedAt: new Date() } },
        { new: true }
    );
    if (!reviewed) throw httpError(409, "You've already reviewed this session. Thank you!");

    if (course) {
        await Course.updateOne({ _id: course._id }, {
            $push: { feedback: { rating: stars, reviews: written, studentID: user._id, bookingID: booking._id, createdAt: new Date() } },
        });
    }
    return reviewed;
};

const frontendUrl = () => env.FRONTEND_URL || 'https://getstudiotime.com';

/** The morning after the session (9am in the studio's timezone). */
const reviewRequestTime = (slot, course) => {
    const end = sessionEnd(slot, course);
    if (!end) return null;
    const zone = timeZoneOf(slot, course);
    const localDay = end.toLocaleDateString('en-CA', { timeZone: zone });
    return zonedTimeToUtc(addDays(localDay, 1), REQUEST_HOUR, zone);
};

const sendReviewRequest = async ({ booking, course, guest, host }) => {
    const bookingPath = `/student/bookings/${booking._id}`;
    const link = guestAccountService.claimLinkFor(guest, { next: bookingPath }) || `${frontendUrl()}${bookingPath}`;
    const hostName = host?.firstName || 'your artist';
    await emailService.sendEmail({
        sendTo: guest.email,
        replyTo: env.RESEND_FROM_EMAIL || undefined,
        subject: `How was ${course.courseTitle}?`,
        message: `
            <p>Hi ${escapeHtml(guest.firstName) || 'there'},</p>
            <p>Thanks for spending time in ${escapeHtml(hostName)}'s studio for <strong>${escapeHtml(course.courseTitle)}</strong>.</p>
            <p>How was it? A quick star rating helps ${escapeHtml(hostName)} and helps other guests find great studios.</p>
            <p><a href="${link}"><strong>Leave a review</strong></a> (it takes 30 seconds)</p>
            <p>The Studio Time Team</p>
        `,
    });
};

/**
 * Emails guests the morning after their session to ask for a review. Runs every hour.
 * Each booking is claimed before its email goes out, so a guest is never asked twice,
 * even if two servers run this at once. Sessions older than a week are left alone.
 */
const sendDueReviewRequests = async (now = new Date()) => {
    const earliest = new Date(now.getTime() - (REQUEST_WINDOW_DAYS + 2) * 86400000).toISOString().slice(0, 10);
    const candidates = await Booking.find({
        status: { $not: /^cancelled/ },
        ratedAndReviewed: { $ne: true },
        reviewRequestSentAt: { $exists: false },
        date: { $gte: earliest },
    }).limit(500);

    let sent = 0;
    for (const booking of candidates) {
        try {
            const [course, slot] = await Promise.all([
                Course.findById(booking.courseID),
                CourseTimeslot.findById(booking.courseTimeslotID),
            ]);
            if (!course || !slot || /^cancelled|removed/.test(slot.status || '')) continue;
            const dueAt = reviewRequestTime(slot, course);
            if (!dueAt || dueAt > now) continue;
            if (now.getTime() - dueAt.getTime() > REQUEST_WINDOW_DAYS * 86400000) continue;

            const claimed = await Booking.findOneAndUpdate(
                { _id: booking._id, reviewRequestSentAt: { $exists: false } },
                { $set: { reviewRequestSentAt: now } }
            );
            if (!claimed) continue;

            const [guest, host] = await Promise.all([
                User.findById(booking.studentID),
                User.findById(course.teacherID).select('firstName'),
            ]);
            if (!guest?.email) continue;
            await sendReviewRequest({ booking, course, guest, host });
            sent += 1;
        } catch (err) {
            console.error(`[review requests] booking ${booking._id}:`, err.message);
        }
    }
    if (sent) console.log(`[review requests] sent ${sent}`);
    return sent;
};

/** Starts the hourly review-request check (not in tests). */
const startReviewRequestJob = () => {
    const run = () => sendDueReviewRequests().catch((err) => console.error('[review requests]', err.message));
    setTimeout(run, 60 * 1000); // shortly after startup
    return setInterval(run, 60 * 60 * 1000);
};

module.exports = { submitReview, sendDueReviewRequests, startReviewRequestJob, reviewRequestTime, sessionEnd };
