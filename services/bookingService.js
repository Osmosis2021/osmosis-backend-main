const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const User = require('../models/user');
const stripe = require('./stripeClient');
const emailService = require('./emailService');
const env = require('../config/env');
const reservationService = require('./reservationService');
const { formatSessionForHumans, DEFAULT_TIMEZONE } = require('./sessionTime');

const httpError = (status, message) => Object.assign(new Error(message), { status });

const escapeHtml = (text) => String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Confirmation to the guest and a heads-up to the host. Failures are logged, never thrown. */
const sendBookingEmails = async (details) => {
    // A paid booking must never fail because an email couldn't be built or sent.
    try {
        await sendBookingEmailsUnsafe(details);
    } catch (err) {
        console.error('[booking email] failed:', err.message);
    }
};

const sendBookingEmailsUnsafe = async ({ booking, course, timeslot, guest, host }) => {
    const when = formatSessionForHumans(timeslot, course.timezone || DEFAULT_TIMEZONE);
    const guests = booking.numberOfGuests;
    const listingUrl = `https://getstudiotime.com/teachers/${encodeURIComponent(course.userName)}/${course._id}`;
    const address = course.address ? `<p><strong>Where:</strong> ${escapeHtml(course.address)}</p>` : '';
    const replyTo = env.RESEND_FROM_EMAIL || undefined;

    const jobs = [];
    if (guest?.email) {
        jobs.push(emailService.sendEmail({
            sendTo: guest.email,
            replyTo,
            subject: `You're booked: ${course.courseTitle} on ${when}`,
            message: `
                <h3>You're booked! 🎉</h3>
                <p>Hi ${escapeHtml(guest.firstName) || 'there'},</p>
                <p>Your spot for <strong>${escapeHtml(course.courseTitle)}</strong> with ${escapeHtml(host?.firstName) || 'your host'} is confirmed.</p>
                <p><strong>When:</strong> ${escapeHtml(when)}</p>
                ${address}
                <p><strong>Guests:</strong> ${guests}<br/><strong>Paid:</strong> $${booking.total}</p>
                ${course.whatToBring ? `<p><strong>What to bring:</strong> ${escapeHtml(course.whatToBring)}</p>` : ''}
                <p>Questions? You can message your host in the Studio Time app. <a href="${listingUrl}">View the listing</a>.</p>
                <p>See you there,<br/>The Studio Time Team</p>
            `,
        }));
    }
    if (host?.email) {
        jobs.push(emailService.sendEmail({
            sendTo: host.email,
            replyTo,
            subject: `New booking: ${course.courseTitle} on ${when}`,
            message: `
                <h3>You have a new booking</h3>
                <p>${escapeHtml(guest?.firstName) || 'A guest'} booked ${guests} ${guests === 1 ? 'spot' : 'spots'} for <strong>${escapeHtml(course.courseTitle)}</strong> on ${escapeHtml(when)}.</p>
                <p>That session now has ${timeslot.enrollment ?? '?'} of ${timeslot.capacity} spots booked.</p>
                <p>You can message your guest from your bookings in the Studio Time app.</p>
                <p>The Studio Time Team</p>
            `,
        }));
    }
    const results = await Promise.allSettled(jobs);
    results.filter((r) => r.status === 'rejected').forEach((r) => console.error('[booking email] failed:', r.reason?.message));
};

const refundPayment = async (paymentIntentId, reason) => {
    try {
        await stripe.refunds.create(
            { payment_intent: paymentIntentId, reverse_transfer: true, refund_application_fee: true },
            { idempotencyKey: `unbookable-${paymentIntentId}` }
        );
        console.warn(`[booking] Refunded ${paymentIntentId}: ${reason}`);
        return true;
    } catch (err) {
        console.error(`[booking] NEEDS MANUAL REFUND ${paymentIntentId} (${reason}):`, err.message);
        return false;
    }
};

/**
 * Creates the booking paid for by a succeeded Stripe PaymentIntent. Safe to call more than once
 * for the same payment (checkout and the Stripe webhook may both call it): the second call
 * returns the existing booking.
 *
 * If the session can no longer be booked (it filled up or was cancelled after the guest paid),
 * the payment is refunded and a 409 with a clear message is thrown.
 */
const createBookingFromPayment = async (paymentIntent) => {
    if (!paymentIntent?.id) throw httpError(400, "We couldn't find that payment.");
    const existing = await Booking.findOne({ paymentIntentID: paymentIntent.id });
    if (existing) return { booking: existing, created: false };

    const metadata = paymentIntent.metadata || {};
    if (paymentIntent.status !== 'succeeded') throw httpError(400, "This payment hasn't gone through yet.");
    if (!mongoose.isValidObjectId(metadata.courseID) || !mongoose.isValidObjectId(metadata.timeslotID)) {
        throw httpError(400, "That payment isn't linked to a Studio Time session.");
    }

    const [course, timeslot, guest] = await Promise.all([
        Course.findById(metadata.courseID),
        CourseTimeslot.findOne({ _id: metadata.timeslotID, courseID: metadata.courseID }),
        User.findOne({ userName: metadata.studentUserName }),
    ]);
    if (!course || !timeslot || !guest) {
        await refundPayment(paymentIntent.id, 'listing, session or guest no longer exists');
        throw httpError(409, "This session is no longer available, so we've refunded your payment.");
    }

    const guests = Number(metadata.guests);
    const expectedCents = Math.round(Number(course.pricePerStudent || 0) * 100) * guests;
    if (!Number.isInteger(guests) || guests < 1 || paymentIntent.amount !== expectedCents) {
        console.error('[booking] Payment amount does not match listing price', { paymentIntent: paymentIntent.id, expectedCents, amount: paymentIntent.amount });
        throw httpError(400, "That payment doesn't match this booking. Please contact support if you were charged.");
    }

    let booking;
    try {
        booking = await reservationService.createReservation({
            timestamp: Date.now(),
            numberOfGuests: guests,
            total: expectedCents / 100,
            courseTimeslotID: String(timeslot._id),
            courseID: String(course._id),
            teacherID: String(course.teacherID),
            teacherUserName: course.userName,
            studentUserName: guest.userName,
            studentID: String(guest._id),
            time: timeslot.startTime,
            date: timeslot.startDate ? timeslot.startDate.toISOString() : undefined,
            paymentIntentID: paymentIntent.id,
            status: 'confirmed',
        });
    } catch (err) {
        // Another request for this payment won the race: return its booking.
        if (err.code === 11000) {
            const winner = await Booking.findOne({ paymentIntentID: paymentIntent.id });
            if (winner) return { booking: winner, created: false };
        }
        if (err.status === 409 || /capacity|full/i.test(err.message || '')) {
            const refunded = await refundPayment(paymentIntent.id, err.message);
            throw httpError(409, refunded
                ? "Sorry, someone grabbed the last spot just before you. We've refunded your payment in full."
                : "Sorry, this session filled up just before you. Our team will refund your payment shortly.");
        }
        throw err;
    }

    const host = await User.findById(course.teacherID).select('email firstName');
    const updatedSlot = await CourseTimeslot.findById(timeslot._id);
    await sendBookingEmails({ booking, course, timeslot: updatedSlot || timeslot, guest, host });

    return { booking, created: true };
};

module.exports = { createBookingFromPayment, sendBookingEmails };
