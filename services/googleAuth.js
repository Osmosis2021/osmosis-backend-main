const env = require('../config/env');

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

/**
 * Verifies a Google Identity Services ID token (the `credential` from the Sign-In button)
 * and returns its claims. Google checks the signature and expiry; we check that the token
 * was issued for our client ID, by Google, for a verified email address.
 *
 * Uses Google's tokeninfo endpoint so no extra dependency is needed. If login volume grows,
 * this can be swapped for local verification with `google-auth-library`.
 */
const verifyGoogleCredential = async (credential) => {
    if (!env.GOOGLE_CLIENT_ID) {
        console.error('[Google] GOOGLE_CLIENT_ID is not set on the server; cannot verify Google sign-in.');
        throw httpError(503, 'Google sign-in is temporarily unavailable. Please use your email and password.');
    }
    if (!credential || typeof credential !== 'string') {
        throw httpError(400, 'Google credential token is required.');
    }

    let response;
    try {
        response = await fetch(`${TOKENINFO_URL}?id_token=${encodeURIComponent(credential)}`);
    } catch (networkError) {
        console.error('[Google] Could not reach Google to verify sign-in:', networkError.message);
        throw httpError(502, 'We could not reach Google. Please try again.');
    }

    if (!response.ok) {
        throw httpError(401, 'Your Google sign-in could not be verified. Please try again.');
    }

    const claims = await response.json();

    if (claims.aud !== env.GOOGLE_CLIENT_ID) {
        console.error('[Google] Token audience mismatch. Check that GOOGLE_CLIENT_ID matches the frontend client ID.');
        throw httpError(401, 'Your Google sign-in could not be verified. Please try again.');
    }
    if (!GOOGLE_ISSUERS.includes(claims.iss)) {
        throw httpError(401, 'Your Google sign-in could not be verified. Please try again.');
    }
    if (claims.exp && Number(claims.exp) * 1000 < Date.now()) {
        throw httpError(401, 'Your Google sign-in expired. Please try again.');
    }
    if (!claims.email || !(claims.email_verified === true || claims.email_verified === 'true')) {
        throw httpError(401, 'Your Google account email is not verified.');
    }

    return claims;
};

module.exports = { verifyGoogleCredential };
