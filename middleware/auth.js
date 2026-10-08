const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/user');

/**
 * Reads the access token from the `Authorization: Bearer <token>` header.
 * Returns null for a missing header or the literal strings the frontend sends
 * when it has no token ("Bearer undefined" / "Bearer null").
 */
const getBearerToken = (req) => {
    const header = req.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) return null;
    const token = header.slice(7).trim();
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
};

const verifyAccessToken = (token) => new Promise((resolve, reject) => {
    jwt.verify(token, env.ACCESS_TOKEN_SECRET, {}, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
    });
});

/**
 * Resolves the user for an access token. Attaches:
 *   req.user        -> decoded token payload ({ userName, roles })
 *   req.currentUser -> the User document
 */
const authenticate = async (req, token) => {
    const decoded = await verifyAccessToken(token);
    const currentUser = await User.findOne({ userName: decoded.userName });
    if (!currentUser) {
        const error = new Error('User no longer exists');
        error.status = 401;
        throw error;
    }
    req.user = decoded;
    req.currentUser = currentUser;
};

/**
 * Requires a valid access token.
 * 401 when no token is sent; 403 when the token is invalid or expired,
 * which is the status the frontend's axios interceptor uses to trigger a refresh.
 */
const requireAuth = async (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    }
    try {
        await authenticate(req, token);
        next();
    } catch (err) {
        const status = err.status || 403;
        return res.status(status).json({ success: false, message: status === 401 ? err.message : 'Your session has expired. Please sign in again.' });
    }
};

/**
 * Attaches the user when a valid token is present, otherwise continues anonymously.
 * Used by public endpoints that return extra data to the owner.
 */
const optionalAuth = async (req, res, next) => {
    const token = getBearerToken(req);
    if (token) {
        try {
            await authenticate(req, token);
        } catch (err) {
            // Treat a bad token on a public endpoint as an anonymous request.
            req.user = undefined;
            req.currentUser = undefined;
        }
    }
    next();
};

/** Requires the authenticated user to be a host. Must run after requireAuth. */
const requireTeacher = (req, res, next) => {
    if (!req.currentUser?.isTeacher) {
        return res.status(403).json({ success: false, message: 'Only hosts can do this.' });
    }
    next();
};

module.exports = {
    getBearerToken,
    verifyAccessToken,
    requireAuth,
    optionalAuth,
    requireTeacher,
};
