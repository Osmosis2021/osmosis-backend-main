const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');

const getAllListings = async () => {
    return await Course.find().populate('teacherID');
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
    const listing = await Course.findById(id).populate('feedback.studentID');
    if (listing) {
        // This mutation of the mongoose document is from the original code.
        // Ideally we should lean on .lean() or toObject() but preserving behavior for now.
        listing.set('schedule', []);
        const timeslots = await CourseTimeslot.find({ courseID: id });
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
