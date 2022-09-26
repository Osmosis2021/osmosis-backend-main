const mongoose = require('mongoose');

// create Teacher Schema here
const TeacherSchema = new mongoose.Schema(
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
		industry: {
			type: String,
			required: true,
		},
		generalTag: {
			type: String,
			required: true
		 },
		specificTags: {
			type: String,
		},
		firstName: {
			type: String,
			required: true
		 },
		lastName: {
			type: String,
			required: true
		 },
		length: {
			type: String,
			required: true
		 },
		time: {
			type: String,
			required: true
		 },
		
		latitude: {
			type: Number,
			required: true
		 },
		longitude: {
			type: Number,
			required: true
		 },
		
		capacity: {
			type: Number,
			required: true
		 },
		price: {
			type: Number,
			required: true
		 },
		stars: {
			type: Number,
			required: true
		 },
		 description: {
			type: String
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