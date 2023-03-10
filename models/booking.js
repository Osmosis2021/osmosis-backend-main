const mongoose = require('mongoose');
const Course = require('./course');
const User = require('./user');

const BookingSchema = new mongoose.Schema({
    // date: {type: Date, required: true},
    // checkIn: {type: TimeRanges, required: true},
    // checkOut: {type: TimeRanges, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    numberOfGuests: Number,
    cost: Number,
    profileImage: String,
    course: {type: mongoose.Schema.Types.ObjectId, required: true, ref: Course},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: User},
    owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: User}
})

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;