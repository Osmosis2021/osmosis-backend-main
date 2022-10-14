const mongoose = require('mongoose');
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
    // students: [{type: mongoose.Schema.Types.ObjectId, ref: 'Student'}],
})

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;