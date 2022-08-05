const mongoose = require('mongoose');
const Review = require('./review').schema;
// const mongoose = require('../db/connection');
// const Teacher = require('./teacher').schema;


const CourseSchema = new mongoose.Schema({
    // owner = {type: mongoose.Schema.Types.ObjectId, ref: 'Teacher'},
    courseTitle : String,
    courseDescription : String,
    subject : String,
    schedule : {
        type: [Date]
    },
    // images: [],
    online: Boolean,
    reviews: [Review],
    rating: Number
    // students: [{type: mongoose.Schema.Types.ObjectId, ref: 'Student'}],
})

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;