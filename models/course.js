const mongoose = require('mongoose');
const Review = require('./review').schema;
// const mongoose = require('../db/connection');
// const Teacher = require('./teacher').schema;


const CourseSchema = new mongoose.Schema({
    courseTitle: String,
	courseDescription: String,
	subject: String,
    capacity: Number,
    price: Number,
    tag: [String],
	schedule: {
        type: [Date],
	},
	// images: [],
    timeOfDay: String,
	online: Boolean,
	reviews: [Review],
	rating: Number,
	// students: [{type: mongoose.Schema.Types.ObjectId, ref: 'Student'}],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;