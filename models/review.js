const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		body: {
			type: String,
			required: true,
		},
        rating: {
            type: Number,
            required: true,
        },
		author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		courseId: String,
	},
	{
		timestamps: true,
	}
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
