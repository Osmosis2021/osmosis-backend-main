const CourseTimeslot = require('../models/courseTimeslot');
const Booking = require('../models/booking');
const stripe = require('./stripeClient');
const emailService = require('./emailService');
const env = require('../config/env');
const {
    DEFAULT_TIMEZONE,
    DATE_RE,
    TIME_RE,
    INACTIVE_STATUSES,
    isValidTimeZone,
    zonedTimeToUtc,
    dayKeyFor,
    effectiveStartAt,
    formatSessionForHumans,
    isActiveSession,
} = require('./sessionTime');

const MAX_SESSIONS_PER_REQUEST = 60;
const MAX_DAYS_AHEAD = 366;
const ACTIVE_BOOKING_FILTER = { status: { $nin: ['cancelled', 'cancelled by host'] } };

const httpError = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });

const courseTimeZone = (course) => (isValidTimeZone(course.timezone) ? course.timezone : DEFAULT_TIMEZONE);

const durationOf = (slot, course) => Number(slot.durationMinutes || course.duration || 60);

/**
 * Turns [{ date: 'YYYY-MM-DD', startTime: 'HH:mm' }] into session documents for `course`.
 * Rejects malformed, past or too-distant times with a 400.
 */
const buildSessions = (course, entries) => {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw httpError(400, 'Add at least one session.');
    }
    if (entries.length > MAX_SESSIONS_PER_REQUEST) {
        throw httpError(400, `You can add up to ${MAX_SESSIONS_PER_REQUEST} sessions at a time.`);
    }

    const timezone = courseTimeZone(course);
    const now = Date.now();
    const latest = now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;

    return entries.map(({ date, startTime }) => {
        if (!DATE_RE.test(date || '') || !TIME_RE.test(startTime || '')) {
            throw httpError(400, 'Each session needs a valid date and start time.');
        }
        const startAt = zonedTimeToUtc(date, startTime, timezone);
        if (Number.isNaN(startAt.getTime())) throw httpError(400, 'Each session needs a valid date and start time.');
        if (startAt.getTime() <= now) throw httpError(400, `${date} at ${startTime} is in the past. Choose a future time.`);
        if (startAt.getTime() > latest) throw httpError(400, 'Sessions can be scheduled up to a year ahead.');

        return {
            courseID: course._id,
            startAt,
            timezone,
            startDate: new Date(`${date}T12:00:00Z`),
            startTime,
            dayOfWeek: dayKeyFor(date),
            durationMinutes: Number(course.duration) || 60,
            capacity: Number(course.capacity) || 1,
            enrollment: 0,
            enrolledStudents: [],
            isRepeating: false,
            status: 'created',
        };
    });
};

const overlaps = (aStart, aMinutes, bStart, bMinutes) => {
    const aEnd = aStart.getTime() + aMinutes * 60000;
    const bEnd = bStart.getTime() + bMinutes * 60000;
    return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
};

/** Throws 409 if any new session overlaps another new one or an existing active session. */
const assertNoConflicts = (course, newSessions, existingSessions, { ignoreId } = {}) => {
    const timezone = courseTimeZone(course);
    const existing = existingSessions
        .filter((slot) => isActiveSession(slot) && String(slot._id) !== String(ignoreId))
        .map((slot) => ({ start: effectiveStartAt(slot, timezone), minutes: durationOf(slot, course) }))
        .filter((slot) => slot.start);

    const accepted = [];
    newSessions.forEach((session) => {
        const clash = [...existing, ...accepted].some((other) => overlaps(session.startAt, session.durationMinutes, other.start, other.minutes));
        if (clash) {
            throw httpError(409, `${formatSessionForHumans(session, timezone)} overlaps another session. Pick a different time.`);
        }
        accepted.push({ start: session.startAt, minutes: session.durationMinutes });
    });
};

/** Adds sessions to a course. `entries` is [{ date, startTime }] (weekly repeats already expanded). */
const addSessions = async (course, entries) => {
    const sessions = buildSessions(course, entries);
    const existing = course._id ? await CourseTimeslot.find({ courseID: course._id }) : [];
    assertNoConflicts(course, sessions, existing);
    return CourseTimeslot.insertMany(sessions);
};

/** Moves a session or changes its capacity. Booked sessions can't be moved. */
const updateSession = async (course, session, changes) => {
    if (!isActiveSession(session)) throw httpError(409, 'This session was cancelled and can no longer be changed.');
    const timezone = courseTimeZone(course);
    const startsAt = effectiveStartAt(session, timezone);
    if (startsAt && startsAt.getTime() <= Date.now()) throw httpError(409, 'This session has already started.');

    const update = {};
    if (changes.date !== undefined || changes.startTime !== undefined) {
        if ((session.enrollment || 0) > 0) {
            throw httpError(409, "Guests have booked this session, so its date and time can't change. Cancel it instead if you need to.");
        }
        const [built] = buildSessions(course, [{ date: changes.date, startTime: changes.startTime }]);
        const existing = await CourseTimeslot.find({ courseID: course._id });
        assertNoConflicts(course, [built], existing, { ignoreId: session._id });
        Object.assign(update, {
            startAt: built.startAt,
            timezone: built.timezone,
            startDate: built.startDate,
            startTime: built.startTime,
            dayOfWeek: built.dayOfWeek,
        });
    }
    if (changes.capacity !== undefined) {
        const capacity = Number(changes.capacity);
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) throw httpError(400, 'Capacity must be between 1 and 100.');
        if (capacity < (session.enrollment || 0)) {
            throw httpError(409, `${session.enrollment} guests are already booked, so capacity can't go below that.`);
        }
        update.capacity = capacity;
    }
    return CourseTimeslot.findByIdAndUpdate(session._id, { $set: update }, { new: true });
};

const escapeHtml = (text) => String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const refundLine = (refundStatus, total) => {
    if (refundStatus === 'refunded') return `<p>Your payment of $${total} has been refunded to your original payment method. It usually appears within 5–10 business days.</p>`;
    if (refundStatus === 'not_needed') return '';
    return `<p>We'll refund your payment of $${total} shortly. If you don't see it within 10 business days, just reply to this email.</p>`;
};

const sendCancellationEmail = async ({ booking, course, session, note }) => {
    const guest = booking.studentID;
    if (!guest?.email) return false;
    const when = formatSessionForHumans(session, courseTimeZone(course));
    const message = `
        <h3>Your Studio Time session was cancelled</h3>
        <p>Hi ${escapeHtml(guest.firstName) || 'there'},</p>
        <p>Unfortunately the host has cancelled <strong>${escapeHtml(course.courseTitle)}</strong> on ${escapeHtml(when)}.</p>
        ${note ? `<p>Message from the host: “${escapeHtml(note)}”</p>` : ''}
        ${refundLine(booking.refundStatus, booking.total)}
        <p>We're sorry for the change of plans. You can find other sessions at <a href="https://getstudiotime.com/explore">getstudiotime.com</a>.</p>
        <p>The Studio Time Team</p>
    `;
    // Replies should reach Studio Time, not bounce back to the guest.
    await emailService.sendEmail({ subject: `Cancelled: ${course.courseTitle} on ${when}`, message, sendTo: guest.email, replyTo: env.RESEND_FROM_EMAIL || undefined });
    return true;
};

/**
 * Cancels a session: refunds and emails every guest booked into it, then marks it cancelled.
 * Each guest is handled independently, so one failed refund or email doesn't stop the others.
 * Returns a summary the host can be shown.
 */
const cancelSession = async (course, session, { note } = {}) => {
    if (!isActiveSession(session)) throw httpError(409, 'This session is already cancelled.');

    const bookings = await Booking.find({ courseTimeslotID: session._id, ...ACTIVE_BOOKING_FILTER })
        .populate('studentID', 'email firstName');

    const summary = { guests: 0, refunded: 0, refundsNeedingAttention: 0, emailed: 0, emailFailed: 0 };

    for (const booking of bookings) {
        summary.guests += booking.numberOfGuests || 1;

        let refundStatus = 'not_needed';
        if (booking.paymentIntentID) {
            try {
                await stripe.refunds.create(
                    { payment_intent: booking.paymentIntentID, reverse_transfer: true, refund_application_fee: true },
                    { idempotencyKey: `cancel-booking-${booking._id}` }
                );
                refundStatus = 'refunded';
                summary.refunded += 1;
            } catch (err) {
                console.error(`[cancelSession] Refund failed for booking ${booking._id}:`, err.message);
                refundStatus = 'failed';
                summary.refundsNeedingAttention += 1;
            }
        } else if ((booking.total || 0) > 0) {
            // Booked before payments were linked to bookings: refund from the Stripe dashboard.
            refundStatus = 'manual';
            summary.refundsNeedingAttention += 1;
        }

        booking.status = 'cancelled by host';
        booking.refundStatus = refundStatus;
        booking.cancelledAt = new Date();
        await booking.save();

        try {
            if (await sendCancellationEmail({ booking, course, session, note })) summary.emailed += 1;
            else summary.emailFailed += 1;
        } catch (err) {
            console.error(`[cancelSession] Email failed for booking ${booking._id}:`, err.message);
            summary.emailFailed += 1;
        }
    }

    await CourseTimeslot.findByIdAndUpdate(session._id, {
        $set: { status: 'cancelled', cancelledAt: new Date(), cancellationNote: note ? String(note).slice(0, 500) : undefined },
    });

    if (summary.refundsNeedingAttention > 0) {
        console.warn(`[cancelSession] Session ${session._id}: ${summary.refundsNeedingAttention} booking(s) need a manual refund in Stripe.`);
    }
    return summary;
};

/** Upcoming active sessions of a course that have bookings. */
const upcomingBookedSessions = async (course) => {
    const timezone = courseTimeZone(course);
    const sessions = await CourseTimeslot.find({ courseID: course._id, status: { $nin: INACTIVE_STATUSES }, enrollment: { $gt: 0 } });
    return sessions.filter((slot) => {
        const start = effectiveStartAt(slot, timezone);
        return start && start.getTime() > Date.now();
    });
};

/**
 * Applies course-level capacity/duration changes to its future sessions.
 * Capacity can't drop below what's already booked; duration only changes unbooked sessions.
 */
const syncFutureSessions = async (course, { capacity, duration }) => {
    const timezone = courseTimeZone(course);
    const sessions = (await CourseTimeslot.find({ courseID: course._id, status: { $nin: INACTIVE_STATUSES } }))
        .filter((slot) => {
            const start = effectiveStartAt(slot, timezone);
            return start && start.getTime() > Date.now();
        });

    if (capacity !== undefined) {
        const tooFull = sessions.find((slot) => (slot.enrollment || 0) > capacity);
        if (tooFull) {
            throw httpError(409, `A session on ${formatSessionForHumans(tooFull, timezone)} already has ${tooFull.enrollment} guests booked, so capacity can't go below that.`);
        }
    }

    const updates = [];
    if (capacity !== undefined) {
        updates.push(CourseTimeslot.updateMany({ _id: { $in: sessions.map((s) => s._id) } }, { $set: { capacity } }));
    }
    if (duration !== undefined) {
        const unbooked = sessions.filter((slot) => !(slot.enrollment > 0)).map((s) => s._id);
        updates.push(CourseTimeslot.updateMany({ _id: { $in: unbooked } }, { $set: { durationMinutes: duration } }));
    }
    await Promise.all(updates);
};

module.exports = {
    buildSessions,
    addSessions,
    updateSession,
    cancelSession,
    upcomingBookedSessions,
    syncFutureSessions,
    courseTimeZone,
    ACTIVE_BOOKING_FILTER,
};
