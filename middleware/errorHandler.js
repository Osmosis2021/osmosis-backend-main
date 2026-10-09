const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
    // Log the error for server-side debugging
    console.error(`[Error] ${err.message || err}`);
    if (env.NODE_ENV !== 'production' && err.stack) {
        console.error(err.stack);
    }

    // Determine status code: prioritize err.status or err.statusCode if available, otherwise res.statusCode or 500
    // Validation errors (zod) are the client's to fix: 400 with a readable first message
    // and per-field messages for forms.
    if (err.name === 'ZodError' && Array.isArray(err.issues)) {
        const fieldErrors = {};
        err.issues.forEach((issue) => {
            const field = issue.path?.join('.') || 'form';
            if (!fieldErrors[field]) fieldErrors[field] = issue.message;
        });
        return res.status(400).json({
            success: false,
            message: err.issues[0]?.message || 'Please check the form and try again.',
            fieldErrors,
        });
    }

    const statusCode = err.status || err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

    res.status(statusCode);

    res.json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(env.NODE_ENV !== 'production' && err.stack && { stack: err.stack }),
    });
};

module.exports = errorHandler;
