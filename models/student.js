const mongoose = require('mongoose');

// create Student Schema here
const StudentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        // toJSON: {
        //     virtuals: true,
        //     transform: (_doc, ret) => {
        //         delete ret.password;
        //         return ret;
        //     },
        // },
    }
);

// export Student Schema
const Student = mongoose.model('Student', StudentSchema);
module.exports = Student;
