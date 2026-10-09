const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const { PUBLIC_FIELDS } = require('../models/user');
const { INACTIVE_STATUSES } = require('./sessionTime');

const getAllListings = async () => {
    return await Course.find().populate('teacherID', PUBLIC_FIELDS);
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

const getListingsByHost = async (userName) => {
    return await Course.find({ userName });
};

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
    getListingsByLocation,
    getListingsByHost,
    getListingById
};
