const mongoose = require('mongoose');

// create User Schema here
const UserSchema = new mongoose.Schema(
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
		resetCode: '',
		stripeID : {
			type: String,
		},
		isStudent: {
			type: Boolean,
			default: false
		},
		isTeacher: {
			type: Boolean,
			default: false
		},
		refreshToken: String,
		profileImage: {
			public_id: {
				type: String,
				
				// required: true
			},
			url: {
				type: String,
				default: ''
				// required: true
			}
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

// export User Schema
const User = mongoose.model('User', UserSchema);
module.exports = User;



	
// },
// "description": "I love tennis. It's a lot of fun."
// }