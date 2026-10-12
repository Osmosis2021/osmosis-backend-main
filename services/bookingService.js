const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const User = require('../models/user');
const stripe = require('./stripeClient');
const emailService = require('./emailService');
const env = require('../config/env');
const reservationService = require('./reservationService');
const { formatSessionForHumans, freeCancellationDeadline, DEFAULT_TIMEZONE } = require('./sessionTime');
const guestAccountService = require('./guestAccountService');

const FRONTEND_URL = () => env.FRONTEND_URL || 'https://getstudiotime.com';

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
    const listingUrl = `${FRONTEND_URL()}/teachers/${encodeURIComponent(course.userName)}/${course._id}`;
    const bookingPath = `/student/bookings/${booking._id}`;
    // Guests who checked out without an account get a link to set a password (and land on their booking).
    const claimLink = guestAccountService.claimLinkFor(guest, { next: bookingPath });
    const manageLink = claimLink || `${FRONTEND_URL()}${bookingPath}`;
    const deadline = freeCancellationDeadline(timeslot, course.timezone || DEFAULT_TIMEZONE);
    const deadlineText = deadline
        ? `until the end of ${new Date(deadline.getTime() - 60000).toLocaleDateString('en-US', { timeZone: timeslot.timezone || course.timezone || DEFAULT_TIMEZONE, weekday: 'long', month: 'long', day: 'numeric' })}`
        : 'until the day before your session';
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
                <p><strong>Free cancellation ${escapeHtml(deadlineText)}.</strong> Cancel any time before the day of your session for a full refund.</p>
                ${claimLink
                    ? `<p><a href="${claimLink}"><strong>Set a password</strong></a> to see your booking, cancel if plans change, message the artist and leave a review afterwards.</p>`
                    : `<p><a href="${manageLink}">Manage your booking</a> to cancel or message the artist.</p>`}
                <p><a href="${listingUrl}">View the listing</a></p>
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
    if (existing) return { booking: existing, created: false, guest: await User.findById(existing.studentID) };

    const metadata = paymentIntent.metadata || {};
    if (paymentIntent.status !== 'succeeded') throw httpError(400, "This payment hasn't gone through yet.");
    if (!mongoose.isValidObjectId(metadata.courseID) || !mongoose.isValidObjectId(metadata.timeslotID)) {
        throw httpError(400, "That payment isn't linked to a Studio Time session.");
    }

    const [course, timeslot] = await Promise.all([
        Course.findById(metadata.courseID),
        CourseTimeslot.findOne({ _id: metadata.timeslotID, courseID: metadata.courseID }),
    ]);
    // Signed-in checkouts name the guest; guest checkouts carry a name and email instead.
    let guest = null;
    if (metadata.studentUserName) {
        guest = await User.findOne({ userName: metadata.studentUserName });
    } else if (metadata.guestEmail && course && timeslot) {
        ({ user: guest } = await guestAccountService.findOrCreateGuestAccount({
            firstName: metadata.guestFirstName,
            lastName: metadata.guestLastName,
            email: metadata.guestEmail,
        }));
    }
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
            if (winner) return { booking: winner, created: false, guest };
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

    return { booking, created: true, guest };
};

const sendGuestCancellationEmails = async ({ booking, course, timeslot, guest, host, refunded }) => {
    try {
        const when = formatSessionForHumans(timeslot, course.timezone || DEFAULT_TIMEZONE);
        const replyTo = env.RESEND_FROM_EMAIL || undefined;
        const spots = booking.numberOfGuests === 1 ? 'spot' : 'spots';
        const jobs = [];
        if (guest?.email) {
            jobs.push(emailService.sendEmail({
                sendTo: guest.email,
                replyTo,
                subject: `Cancelled: ${course.courseTitle} on ${when}`,
                message: `
                    <p>Hi ${escapeHtml(guest.firstName) || 'there'},</p>
                    <p>Your booking for <strong>${escapeHtml(course.courseTitle)}</strong> on ${escapeHtml(when)} is cancelled.</p>
                    <p>${refunded
                        ? `Your $${booking.total} refund is on its way. It usually appears on your statement within 5–10 business days.`
                        : 'Our team will process your refund shortly.'}</p>
                    <p>The Studio Time Team</p>
                `,
            }));
        }
        if (host?.email) {
            jobs.push(emailService.sendEmail({
                sendTo: host.email,
                replyTo,
                subject: `Booking cancelled: ${course.courseTitle} on ${when}`,
                message: `
                    <p>${escapeHtml(guest?.firstName) || 'A guest'} cancelled ${booking.numberOfGuests} ${spots} for <strong>${escapeHtml(course.courseTitle)}</strong> on ${escapeHtml(when)}.</p>
                    <p>The ${spots} ${booking.numberOfGuests === 1 ? 'is' : 'are'} open again for other guests to book.</p>
                    <p>The Studio Time Team</p>
                `,
            }));
        }
        const results = await Promise.allSettled(jobs);
        results.filter((r) => r.status === 'rejected').forEach((r) => console.error('[cancel email] failed:', r.reason?.message));
    } catch (err) {
        console.error('[cancel email] failed:', err.message);
    }
};

/** Whether a guest can still cancel this booking for a full refund, and until when. */
const cancellationInfo = (booking, timeslot, course) => {
    if (!booking || /^cancelled/.test(booking.status || '') || !timeslot) return { canCancel: false, deadline: null };
    const deadline = freeCancellationDeadline(timeslot, course?.timezone || DEFAULT_TIMEZONE);
    return { canCancel: Boolean(deadline) && Date.now() < deadline.getTime(), deadline };
};

/**
 * A guest cancels their own booking. Allowed until the day of the session (in the studio's
 * timezone), with a full refund including the Studio Time fee. Frees the spots and emails both sides.
 */
const cancelBookingByGuest = async (bookingId, user) => {
    if (!mongoose.isValidObjectId(bookingId)) throw httpError(404, "We couldn't find that booking.");
    const booking = await Booking.findById(bookingId);
    if (!booking) throw httpError(404, "We couldn't find that booking.");
    if (String(booking.studentID) !== String(user._id) && booking.studentUserName !== user.userName) {
        throw httpError(403, 'You can only cancel your own bookings.');
    }
    if (/^cancelled/.test(booking.status || '')) throw httpError(409, 'This booking is already cancelled.');

    const [course, timeslot] = await Promise.all([
        Course.findById(booking.courseID),
        CourseTimeslot.findById(booking.courseTimeslotID),
    ]);
    const { canCancel } = cancellationInfo(booking, timeslot, course);
    if (!canCancel) {
        throw httpError(409, "Bookings can be cancelled for a full refund until the day before the session. Message the artist if something came up.");
    }

    // Claim the booking first so two taps can't refund twice.
    const claimed = await Booking.findOneAndUpdate(
        { _id: booking._id, status: booking.status },
        { $set: { status: 'cancelled by guest', cancelledAt: new Date() } },
        { new: true }
    );
    if (!claimed) throw httpError(409, 'This booking is already cancelled.');

    let refundStatus = 'not_needed';
    if (claimed.paymentIntentID) {
        try {
            await stripe.refunds.create(
                { payment_intent: claimed.paymentIntentID, reverse_transfer: true, refund_application_fee: true },
                { idempotencyKey: `guest-cancel-${claimed._id}` }
            );
            refundStatus = 'refunded';
        } catch (err) {
            console.error(`[guest cancel] NEEDS MANUAL REFUND for booking ${claimed._id}:`, err.message);
            refundStatus = 'failed';
        }
    } else if ((claimed.total || 0) > 0) {
        refundStatus = 'manual';
    }
    claimed.refundStatus = refundStatus;
    await claimed.save();

    // Free the spots (never below zero).
    await CourseTimeslot.updateOne(
        { _id: claimed.courseTimeslotID, enrollment: { $gte: claimed.numberOfGuests } },
        { $inc: { enrollment: -claimed.numberOfGuests } }
    );

    if (course && timeslot) {
        const host = await User.findById(course.teacherID).select('email firstName');
        await sendGuestCancellationEmails({ booking: claimed, course, timeslot, guest: user, host, refunded: refundStatus === 'refunded' });
    }
    return claimed;
};

module.exports = { createBookingFromPayment, sendBookingEmails, cancelBookingByGuest, cancellationInfo };
