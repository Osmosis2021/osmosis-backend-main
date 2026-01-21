const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
    try {
        // Fix deprecation warning
        mongoose.set('strictQuery', false);

        await mongoose.connect(env.MONGOOSE_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to DB 🌟');
    } catch (error) {
        console.error('Connection failed!', error);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
