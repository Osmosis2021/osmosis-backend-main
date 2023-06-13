const mongoose = require('mongoose');
const Course = require('./course');

const CourseTimeslotSchema = new mongoose.Schema({

    dayOfWeek: String,
    startTime: String,
    courseLength: Number,
    startDate: Date,
    courseID: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
    isRepeating: Boolean,
    capacity: {type: Number, default: 1},
    enrolledStudents: {type: [String], default: []},
    enrollment: 0,
    endTime: Number,
    status: ''

})

const CourseTimeslot = mongoose.model('CourseTimeslot', CourseTimeslotSchema);
module.exports = CourseTimeslot;