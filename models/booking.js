const mongoose = require('mongoose');
const Course = require('./course');
const User = require('./user');
const CourseTimeslot = require('./courseTimeslot');

const BookingSchema = new mongoose.Schema({
    timestamp: {type: Number},
    studentID: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    numberOfGuests: {type: Number, required: true},
    total: {type: Number},
    courseTimeslotID: {type: mongoose.Schema.Types.ObjectId, ref: 'CourseTimeslot'},
    courseID: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
    teacherID: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    time: {type: String},
    date: {type: String}
    // date: { startDate: {type: String}, startTime: {type: String},},
    // checkIn: {type: TimeRanges, required: true},
    // checkOut: {type: TimeRanges, required: true},
    // studentFirstName: {type: String, required: true},
    // studentLastName: {type: String, required: true},
    // numberOfGuests: {type: Number, default: 0},
    // cost: Number,
    // profileImage: String,
    // courseLength: {type: Number},
    // dayOfWeek: {type: String},
    // endTime: {type: String},
    // enrolledStudents: {type: Array},
    // startDate: {type: String},
    // startTime: {type: String},
    // course: {type: mongoose.Schema.Types.ObjectId, required: true, ref: Course},
    // student: {type: mongoose.Schema.Types.ObjectId, ref: User},
    // teacher: {type: mongoose.Schema.Types.ObjectId, required: true, ref: User}
})

const Booking = mongoose.model('booking', BookingSchema);
module.exports = Booking;