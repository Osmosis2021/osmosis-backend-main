const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const { PUBLIC_FIELDS } = require('../models/user');
const Booking = require('../models/booking');
const User = require('../models/user');
const payoutService = require('./payoutService');
const { INACTIVE_STATUSES, DEFAULT_TIMEZONE, effectiveStartAt } = require('./sessionTime');

// Upcoming, still-bookable sessions for the given courses, keyed by course id and sorted by start.
const upcomingSessionsByCourse = async (courses) => {
    const ids = courses.map((c) => c._id);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const candidates = await CourseTimeslot.find({
        courseID: { $in: ids },
        status: { $nin: INACTIVE_STATUSES },
        $or: [{ startAt: { $gt: new Date() } }, { startAt: { $exists: false }, startDate: { $gte: oneDayAgo } }],
    });
    const timezoneOf = new Map(courses.map((c) => [String(c._id), c.timezone]));
    const now = Date.now();
    const byCourse = new Map();
    candidates.forEach((slot) => {
        const start = effectiveStartAt(slot, timezoneOf.get(String(slot.courseID)) || DEFAULT_TIMEZONE);
        if (!start || start.getTime() <= now) return;
        const key = String(slot.courseID);
        if (!byCourse.has(key)) byCourse.set(key, []);
        byCourse.get(key).push({ slot, start });
    });
    byCourse.forEach((list) => list.sort((a, b) => a.start - b.start));
    return byCourse;
};

/**
 * All listings, each with `nextSession` (the soonest session with spots left, or null)
 * and `upcomingSessionCount`, so browse pages can show dates and skip dead ends.
 */
const getAllListings = async () => withNextSessions(await Course.find().populate('teacherID', PUBLIC_FIELDS));

const withNextSessions = async (courses) => {
    const sessions = await upcomingSessionsByCourse(courses);
    const hosts = await User.find({ _id: { $in: courses.map((c) => c.teacherID?._id || c.teacherID) } });
    await payoutService.refreshUnknownPayoutFlags(hosts);
    const payoutsById = new Map(hosts.map((h) => [String(h._id), payoutService.payoutsReady(h)]));
    return courses.map((course) => {
        const upcoming = sessions.get(String(course._id)) || [];
        const open = upcoming.find(({ slot }) => (slot.enrollment || 0) < (slot.capacity || 1));
        const json = course.toJSON();
        const hostId = String(course.teacherID?._id || course.teacherID);
        if (json.teacherID && typeof json.teacherID === 'object') json.teacherID.payoutsEnabled = payoutsById.get(hostId);
        return {
            ...json,
            // false: the artist hasn't finished payout setup, so sessions can't be booked yet
            paymentsReady: payoutsById.get(hostId) || false,
            upcomingSessionCount: upcoming.length,
            nextSession: open ? {
                _id: open.slot._id,
                startAt: open.start,
                startDate: open.slot.startDate,
                startTime: open.slot.startTime,
                timezone: open.slot.timezone || course.timezone,
                spotsLeft: (open.slot.capacity || 1) - (open.slot.enrollment || 0),
            } : null,
        };
    });
};

/**
 * Public, real numbers for a host's profile (nothing made up): past sessions that had guests,
 * guests hosted, and reviews across their listings.
 */
const getHostStats = async (userName) => {
    const courses = await Course.find({ userName }).select('_id feedback timezone addressDetails');
    const ratings = courses.flatMap((c) => (c.feedback || []).map((f) => Number(f.rating)).filter((r) => r > 0));
    const pastSessions = (await CourseTimeslot.find({
        courseID: { $in: courses.map((c) => c._id) },
        status: { $nin: INACTIVE_STATUSES },
        enrollment: { $gt: 0 },
    })).filter((slot) => {
        const start = effectiveStartAt(slot, DEFAULT_TIMEZONE);
        return start && start.getTime() < Date.now();
    });
    const pastSessionIds = new Set(pastSessions.map((s) => String(s._id)));
    const bookings = await Booking.find({
        teacherUserName: userName,
        status: { $not: /^cancelled/ },
    }).select('courseTimeslotID numberOfGuests');
    const guestsHosted = bookings
        .filter((b) => pastSessionIds.has(String(b.courseTimeslotID)))
        .reduce((sum, b) => sum + (b.numberOfGuests || 0), 0);
    const city = courses.map((c) => c.addressDetails?.city).find(Boolean) || null;

    return {
        listings: courses.length,
        sessionsHosted: pastSessions.length,
        guestsHosted,
        reviewCount: ratings.length,
        averageRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
        city,
    };
};

const getListingsByLocation = async (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return await Course.find({
        $and: [
            { latitude: { $gt: (lat - 1) } }, { latitude: { $lte: (lat + 1) } },
            { longitude: { $gt: (lng - 1) } }, { longitude: { $lte: (lng + 1) } }
        ]
    });
};

const getListingsByHost = async (userName) => withNextSessions(await Course.find({ userName }));

const getListingById = async (id) => {
    const listing = await Course.findById(id).populate('feedback.studentID', PUBLIC_FIELDS);
    if (listing) {
        // This mutation of the mongoose document is from the original code.
        // Ideally we should lean on .lean() or toObject() but preserving behavior for now.
        listing.set('schedule', []);
        // Cancelled sessions and sessions of deleted listings are never shown or bookable.
        const timeslots = await CourseTimeslot.find({ courseID: id, status: { $nin: INACTIVE_STATUSES } })
            .sort({ startAt: 1, startDate: 1, startTime: 1 });
        if (timeslots) {
            listing.set('schedule', [...timeslots]);
        }
    }
    return listing;
};

module.exports = {
    getAllListings,
    getHostStats,
    getListingsByLocation,
    getListingsByHost,
    getListingById,
    upcomingSessionsByCourse,
};
