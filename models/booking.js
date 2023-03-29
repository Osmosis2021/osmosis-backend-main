const mongoose = require('mongoose');
const Course = require('./course');
const User = require('./user');

const BookingSchema = new mongoose.Schema({
    date: {
        startDate: {type: String},
        startTime: {type: String},
    },
    // checkIn: {type: TimeRanges, required: true},
    // checkOut: {type: TimeRanges, required: true},
    studentFirstName: {type: String, required: true},
    studentLastName: {type: String, required: true},
    numberOfGuests: Number,
    cost: Number,
    profileImage: String,
    course: {type: mongoose.Schema.Types.ObjectId, required: true, ref: Course},
    student: {type: mongoose.Schema.Types.ObjectId, required: true, ref: User},
    teacher: {type: mongoose.Schema.Types.ObjectId, required: true, ref: User}
})

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;