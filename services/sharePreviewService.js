const mongoose = require('mongoose');
const Course = require('../models/course');
const User = require('../models/user');
const { DEFAULT_TIMEZONE } = require('./sessionTime');
const { upcomingSessionsByCourse } = require('./listingService');

/**
 * Text and image for link previews (Instagram, iMessage, WhatsApp...) of listing and artist pages.
 * The frontend's Netlify edge function puts these into the page's Open Graph tags for link crawlers.
 * Only public information: never the street address, prices aside from the listed one, or contact details.
 */

const SITE_NAME = 'Studio Time';
const DESCRIPTION_MAX = 200;

const truncate = (text, max) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

// Cloudinary can crop any photo to the 1200x630 shape link previews use.
const shareImage = (url) => {
    if (!url) return null;
    if (/res\.cloudinary\.com\/.+\/image\/upload\//.test(url)) {
        return url.replace('/image/upload/', '/image/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/');
    }
    return url;
};

const formatHours = (minutes) => {
    if (!minutes) return null;
    const hours = minutes / 60;
    if (hours < 1) return `${minutes} min`;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
};

const cityOf = (course) => {
    const details = course?.addressDetails || {};
    return [details.city, details.state].filter(Boolean).join(', ') || null;
};

const formatDay = (date, timeZone) => date.toLocaleDateString('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric' });

const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ');

/** Preview for /teachers/:userName/:courseID. Null if there's no such listing. */
const listingPreview = async (courseID) => {
    if (!mongoose.isValidObjectId(courseID)) return null;
    const course = await Course.findById(courseID);
    if (!course) return null;
    const host = await User.findById(course.teacherID).select('firstName lastName profileImage');

    const next = (await upcomingSessionsByCourse([course])).get(String(course._id))?.[0];
    const facts = [
        course.pricePerStudent ? `$${course.pricePerStudent} per guest` : null,
        formatHours(course.duration),
        cityOf(course),
        next ? `Next: ${formatDay(next.start, next.slot.timezone || course.timezone || DEFAULT_TIMEZONE)}` : null,
    ].filter(Boolean).join(' · ');
    const about = truncate(course.courseDescription || course.studioVibe, DESCRIPTION_MAX - facts.length - 3);
    const hostName = fullName(host);

    return {
        title: hostName ? `${course.courseTitle} with ${hostName} | ${SITE_NAME}` : `${course.courseTitle} | ${SITE_NAME}`,
        description: [facts, about].filter(Boolean).join(' — '),
        image: shareImage(course.images?.[0]?.url) || shareImage(host?.profileImage?.url),
        imageAlt: course.courseTitle,
        type: 'website',
    };
};

/** Preview for an artist's profile, /teachers/:userName. Null if there's no such artist. */
const hostPreview = async (userName) => {
    if (typeof userName !== 'string' || !userName) return null;
    const host = await User.findOne({ userName, isTeacher: true }).select('firstName lastName description profileImage');
    if (!host) return null;
    const courses = await Course.find({ teacherID: host._id }).select('images courseTitle addressDetails');
    const city = courses.map(cityOf).find(Boolean);
    const name = fullName(host) || userName;
    const listingPhoto = courses.map((c) => c.images?.[0]?.url).find(Boolean);
    const summary = courses.length
        ? `Book studio time with ${host.firstName || name}${city ? ` in ${city}` : ''}.`
        : `${name} on ${SITE_NAME}.`;

    return {
        title: `${name} | ${SITE_NAME}`,
        description: truncate([summary, host.description].filter(Boolean).join(' '), DESCRIPTION_MAX),
        image: shareImage(listingPhoto) || shareImage(host.profileImage?.url),
        imageAlt: name,
        type: 'profile',
    };
};

module.exports = { listingPreview, hostPreview, shareImage };
