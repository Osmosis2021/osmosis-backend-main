const cloudinary = require('cloudinary');
const env = require('./env');

// Credentials come from the environment only. Never commit them.
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
    });
} else if (env.NODE_ENV !== 'test') {
    console.warn('⚠️  Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET). Image uploads will fail.');
}

module.exports = cloudinary;
