/**
 * Small in-memory limiter for guessable codes (password reset, email verification).
 * Counts failed attempts per key inside a time window.
 *
 * In-memory is enough for a single server instance. If the API is scaled to several
 * instances, move this to a shared store (e.g. Redis or a Mongo collection).
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const failures = new Map(); // key -> { count, firstAt }

const getEntry = (key) => {
    const entry = failures.get(key);
    if (entry && Date.now() - entry.firstAt > WINDOW_MS) {
        failures.delete(key);
        return null;
    }
    return entry || null;
};

const isLocked = (key) => {
    const entry = getEntry(key);
    return Boolean(entry && entry.count >= MAX_FAILURES);
};

const recordFailure = (key) => {
    const entry = getEntry(key) || { count: 0, firstAt: Date.now() };
    entry.count += 1;
    failures.set(key, entry);
};

const reset = (key) => failures.delete(key);

const LOCKED_MESSAGE = 'Too many incorrect attempts. Please wait 15 minutes and request a new code.';

module.exports = { isLocked, recordFailure, reset, LOCKED_MESSAGE, MAX_FAILURES };
