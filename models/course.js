const mongoose = require('mongoose');
// const mongoose = require('../db/connection');
// const Teacher = require('./teacher').schema;


const CourseSchema = new mongoose.Schema({
    address: String,
    courseTitle: String,
	courseDescription: String,
    latitude: Number,
    longitude: Number,
    industry: String,
    userName: String,
    minCapacity: Number,
    maxCapacity: Number,
    price: Number,
    tag: [String],
	schedule: {
        type: [Date],
	},
	photos: [String],
	online: Boolean,
	// students: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;