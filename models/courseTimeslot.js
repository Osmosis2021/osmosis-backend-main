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
    // 'created' (bookable), 'cancelled' (cancelled by the host), 'removed by teacher' (studio time deleted)
    status: '',

    // Added for timezone-aware scheduling. Older sessions don't have these and fall back to
    // startDate + startTime (see services/sessionTime.js).
    startAt: Date,             // exact start, in UTC
    timezone: String,          // IANA zone of the studio, e.g. 'America/New_York'
    durationMinutes: Number,
    cancelledAt: Date,
    cancellationNote: String,
})

CourseTimeslotSchema.index({ courseID: 1, startAt: 1 });

const CourseTimeslot = mongoose.model('CourseTimeslot', CourseTimeslotSchema);
module.exports = CourseTimeslot;