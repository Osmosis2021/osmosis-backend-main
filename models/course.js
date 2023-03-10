const mongoose = require('mongoose');
// const mongoose = require('../db/connection');
// const Teacher = require('./teacher').schema;


const CourseSchema = new mongoose.Schema({
    courseTitle: String,
	courseDescription: String,
    industry: String,
    userName: String,
    capacity: Number,
    price: Number,
    tags: [String],
	schedule: {
        type: [Date],
	},
    longitude: Number,
    latitude: Number,
    city: String,
    zipCode: Number,
    address: String,
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
});

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;