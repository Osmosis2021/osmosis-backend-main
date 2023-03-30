const mongoose = require('mongoose');
const Booking = require('./booking');
// const mongoose = require('../db/connection');
// const Teacher = require('./teacher').schema;


const CourseSchema = new mongoose.Schema({
    address: {
        line1,
        line2,
        city,
        zipCode,
        state,
        country,
    },
    duration: Number,
    courseTitle: String,
	courseDescription: String,
    industry: String,
    userName: String,
    capacity: Number,
    pricePerStudent: Number,
    tags: [String],
    // city: String,
    // zipCode: Number,
    // address: String,
    longitude: Number,
    latitude: Number,
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
    },
});

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;