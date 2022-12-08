const mongoose = require('mongoose');
// const mongoose = require('../db/connection');
// const Teacher = require('./teacher').schema;


const CourseSchema = new mongoose.Schema({
    courseTitle: String,
	courseDescription: String,
	subject: String,
    userName: String,
    capacity: Number,
    price: Number,
    tag: [String],
	schedule: {
        type: [Date],
	},
	// images: [],
    timeOfDay: String,
	online: Boolean,
	// students: [{type: mongoose.Schema.Types.ObjectId, ref: 'Student'}],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;