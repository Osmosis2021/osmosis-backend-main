const mongoose = require('mongoose');
const Course = require('./course');

const CourseTimeslotSchema = new mongoose.Schema({

    dayOfWeek: String,
    startTime: String,
    courseLength: Number,
    startDate: Date,
    courseID: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
    isRepeating: Boolean,
    remainingCapacity: Number,
    enrolledStudents: String,
    endTime: Number,

})

const CourseTimeslot = mongoose.model('courseTimeslot', CourseTimeslotSchema);
module.exports = CourseTimeslot;