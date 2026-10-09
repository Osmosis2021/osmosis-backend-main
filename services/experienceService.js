const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const cloudinary = require('../config/cloudinary');
const { z } = require('zod');

const sessionService = require('./sessionService');
const { isValidTimeZone } = require('./sessionTime');

const MIN_DURATION = 30;
const MAX_DURATION = 240;

// Fields a host can set on a studio time. Unknown fields (e.g. `_id`, `feedback`, `schedule`,
// already-uploaded `images` objects sent back by the edit page) are ignored rather than rejected;
// photos and sessions have their own endpoints.
const editableFields = {
    teacherID: z.string().optional(),
    userName: z.string().optional(),
    address: z.any().optional(),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
    industry: z.string().optional(),
    tags: z.array(z.string().trim().max(40)).max(20).optional(),
    pricePerStudent: z.number({ error: 'Enter a price.' }).int('Use a whole-dollar price.').min(1, 'Price must be at least $1.').max(10000, 'Price must be $10,000 or less.'),
    courseTitle: z.string({ error: 'Add a title.' }).trim().min(1, 'Add a title.').max(100, 'Keep the title under 100 characters.'),
    courseDescription: z.string().max(5000, 'Keep the description under 5,000 characters.').optional(),
    studioVibe: z.string().max(2000).optional(),
    whatToBring: z.string().max(2000).optional(),
    capacity: z.number({ error: 'Set how many guests can join.' }).int().min(1, 'Allow at least 1 guest.').max(100, 'Up to 100 guests per session.'),
    duration: z.coerce.number({ error: 'Choose a session length.' }).int()
        .min(MIN_DURATION, `Sessions must be at least ${MIN_DURATION} minutes.`)
        .max(MAX_DURATION, `Sessions can be up to ${MAX_DURATION / 60} hours.`)
        .refine((minutes) => minutes % 15 === 0, 'Use 15-minute steps.'),
};

const createSchema = z.object({
    ...editableFields,
    timezone: z.string().optional(),
    images: z.array(z.string()).optional(),
    sessions: z.array(z.object({ date: z.string(), startTime: z.string() })).min(1, 'Add at least one session.'),
});

const updateSchema = z.object(editableFields).partial();

const normalizeAddress = (addressInput) => {
    if (!addressInput) return { address: '', addressDetails: null };
    if (typeof addressInput === 'string') {
        return { address: addressInput, addressDetails: null };
    }
    if (typeof addressInput === 'object' && addressInput !== null) {
        const details = addressInput;
        const addressString = details.fullAddress || details.place_name || details.line1 || details.street || '';
        return {
            address: addressString,
            addressDetails: details
        };
    }
    return { address: '', addressDetails: null };
};

const createExperience = async (rawData) => {
    const { sessions, timezone, ...data } = createSchema.parse(rawData);
    data.timezone = isValidTimeZone(timezone) ? timezone : undefined;

    // Check every session before saving anything, so a bad time doesn't leave a half-created listing.
    sessionService.buildSessions(data, sessions);

    // Normalize address before creating
    if (rawData.address) {
        const { address, addressDetails } = normalizeAddress(rawData.address);
        data.address = address;
        data.addressDetails = addressDetails;
    }
    // Upload images (base64 or URLs) to Cloudinary
    let imagesBuffer = [];
    if (data.images && Array.isArray(data.images)) {
        for (let i = 0; i < data.images.length; i++) {
            const result = await cloudinary.uploader.upload(data.images[i], {
                folder: "banners",
                width: 1920,
                crop: "scale"
            });
            imagesBuffer.push({
                public_id: result.public_id,
                url: result.secure_url
            });
        }
    }

    const course = await Course.create({ ...data, images: imagesBuffer });
    try {
        await sessionService.addSessions(course, sessions);
    } catch (error) {
        await Course.findByIdAndDelete(course._id);
        throw error;
    }
    return course;
};

const updateExperience = async (id, rawData) => {
    const data = updateSchema.parse(rawData);

    // Normalize address before updating
    if (rawData.address) {
        const { address, addressDetails } = normalizeAddress(rawData.address);
        data.address = address;
        data.addressDetails = addressDetails;
    }

    const course = await Course.findById(id);
    if (!course) return null;

    // Push capacity/length changes to upcoming sessions first; this throws (and nothing is
    // saved) if capacity would drop below what guests have already booked.
    const capacityChanged = data.capacity !== undefined && data.capacity !== course.capacity;
    const durationChanged = data.duration !== undefined && data.duration !== course.duration;
    if (capacityChanged || durationChanged) {
        await sessionService.syncFutureSessions(course, {
            capacity: capacityChanged ? data.capacity : undefined,
            duration: durationChanged ? data.duration : undefined,
        });
    }

    return Course.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
};

const deleteExperience = async (id) => {
    const foundCourse = await Course.findById(id);
    if (!foundCourse) return null;

    // Guests must be refunded and told first: the host cancels booked sessions, then deletes.
    const booked = await sessionService.upcomingBookedSessions(foundCourse);
    if (booked.length > 0) {
        const error = new Error(`This studio time has ${booked.length} upcoming booked ${booked.length === 1 ? 'session' : 'sessions'}. Cancel ${booked.length === 1 ? 'it' : 'them'} first so guests are refunded and notified.`);
        error.status = 409;
        throw error;
    }

    // Delete images from Cloudinary
    if (foundCourse.images && Array.isArray(foundCourse.images)) {
        for (let i = 0; i < foundCourse.images.length; i++) {
            const public_id = foundCourse.images[i].public_id;
            if (public_id) {
                await cloudinary.uploader.destroy(public_id);
            }
        }
    }

    // Update timeslots status
    await CourseTimeslot.updateMany({ courseID: foundCourse._id }, { status: 'removed by teacher' });

    // Delete course
    return await Course.findByIdAndDelete(id);
};

const addPhotos = async (id, images) => {
    let imagesBuffer = [];
    if (images && Array.isArray(images)) {
        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.uploader.upload(images[i], {
                folder: "banners",
                width: 1920,
                crop: "scale"
            });
            imagesBuffer.push({
                public_id: result.public_id,
                url: result.secure_url
            });
        }
    }

    return await Course.findByIdAndUpdate(id, { $push: { images: { $each: imagesBuffer } } }, { new: true });
};

const removePhoto = async (id, imageId) => {
    return await Course.findByIdAndUpdate(id, { $pull: { images: { _id: imageId } } }, { new: true });
};

module.exports = {
    createExperience,
    updateExperience,
    deleteExperience,
    addPhotos,
    removePhoto
};
