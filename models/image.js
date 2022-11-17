const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
	{
		name: String,
		data: Buffer,
		contentType: String,
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true }
);

const Image = mongoose.model('Image', ImageSchema);
module.exports = Image;