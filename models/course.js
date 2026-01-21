const mongoose = require('mongoose');
const Booking = require('./booking');
// const mongoose = require('../db/connection');
// const Teacher = require('./teacher').schema;


const CourseSchema = new mongoose.Schema({
    address: String,
    addressDetails: mongoose.Schema.Types.Mixed,
    duration: Number,
    courseTitle: String,
    courseDescription: String,
    studioVibe: String,
    whatToBring: String,
    industry: String,
    userName: String,
    capacity: Number,
    pricePerStudent: Number,
    tags: [String],
    feedback: [{
        rating: Number,
        reviews: String,
        studentID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    // city: String,
    // zipCode: Number,
    // address: String,
    longitude: Number,
    latitude: Number,
    schedule: [],
    images: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    online: Boolean,
    // students: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    teacherID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    }
});

CourseSchema.index({ teacherID: 1 });
CourseSchema.index({ userName: 1 });
CourseSchema.index({ industry: 1 });
CourseSchema.index({ latitude: 1, longitude: 1 });

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;