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
		resetCodeExpires: {
			type: Date,
		},
		stripeID : {
			type: String,
		},
		customerStripeID : {
			type: String,
		},
		paymentMethodID : {
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
		 },
		isEmailVerified: {
			type: Boolean,
			default: false
		},
		emailVerificationCode: {
			type: String,
			default: ''
		},
		phoneNumber: {
			type: String,
			default: ''
		},
		smsEnabled: {
			type: Boolean,
			default: false
		},
		googleId: {
			type: String,
			default: ''
		},
		// Cached from Stripe: can this host receive payouts (and so take bookings)?
		// Unset means "not checked yet".
		payoutsEnabled: {
			type: Boolean,
		},
		// Created by a guest checkout (name + email only). There is no usable password until the
		// guest follows the link in their confirmation email and sets one.
		passwordSetupRequired: {
			type: Boolean,
		}

	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: (_doc, ret) => {
				PRIVATE_FIELDS.forEach((field) => delete ret[field]);
				return ret;
			},
		},
	}
);

// Never sent to any client, including the account owner.
const PRIVATE_FIELDS = ['password', 'refreshToken', 'resetCode', 'resetCodeExpires', 'emailVerificationCode'];

// Safe to show to other users (profile pages, listings, chats, bookings).
const PUBLIC_FIELDS = '_id firstName lastName userName profileImage description industries generalTags specificTags stars isTeacher isStudent stripeID payoutsEnabled createdAt';

const pickPublicFields = (userDoc) => {
	if (!userDoc) return userDoc;
	const json = typeof userDoc.toJSON === 'function' ? userDoc.toJSON() : { ...userDoc };
	const publicJson = {};
	PUBLIC_FIELDS.split(' ').forEach((field) => {
		if (json[field] !== undefined) publicJson[field] = json[field];
	});
	return publicJson;
};

// export User Schema
const User = mongoose.model('User', UserSchema);
module.exports = User;
module.exports.PRIVATE_FIELDS = PRIVATE_FIELDS;
module.exports.PUBLIC_FIELDS = PUBLIC_FIELDS;
module.exports.pickPublicFields = pickPublicFields;



	
// },
// "description": "I love tennis. It's a lot of fun."
// }