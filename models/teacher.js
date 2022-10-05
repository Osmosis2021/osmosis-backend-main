const mongoose = require('mongoose');

// create Teacher Schema here
const TeacherSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true
		 },
		lastName: {
			type: String,
			required: true
		 },
		 userName: {
			type: String,
			required: true
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
		industries: {
			type: [String],
			default: [],
		},
		generalTags: {
			type: [String],
			default: []
		 },
		specificTags: {
			type: String,
		},
		stars: {
			type: Number,
			default: 0
		 },
		 description: {
			type: String,
			default: ''
		 }

	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: (_doc, ret) => {
				delete ret.password;
				return ret;
			},
		},
	}
);

// export Teacher Schema
const Teacher = mongoose.model('Teacher', TeacherSchema);
module.exports = Teacher;



	
// },
// "description": "I love tennis. It's a lot of fun."
// }