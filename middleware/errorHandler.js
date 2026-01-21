const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
    // Log the error for server-side debugging
    console.error(`[Error] ${err.message}`);
    if (env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Determine status code: use existing if set and not 200, otherwise 500
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    res.status(statusCode);

    res.json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
