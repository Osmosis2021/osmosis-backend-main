const mongoose = require('mongoose');

const courseTimeslotSchema = new mongoose.Schema({

    dayOfWeek: Number,
    startTime: Number,
    courseLength: Number,
    startDate: Date,
    isRepeating: Boolean,
    remainingCapacity: Number,
    enrolledStudents: String,
    endTime: Number,

})

const courseTimeslot = mongoose.model('courseTimeslot', courseTimeslotSchema);
module.exports = courseTimeslot;