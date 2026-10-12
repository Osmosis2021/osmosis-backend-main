/**
 * Timezone helpers for session scheduling, using only the built-in Intl API.
 *
 * A session is entered as a local date + time at the studio ("2026-11-14", "14:00") and stored as:
 *   startAt   - the exact moment in UTC
 *   startDate - noon UTC on that calendar day, so any code that formats the date shows the right day
 *   startTime - "HH:mm" wall-clock time at the studio (as before)
 */
const DEFAULT_TIMEZONE = 'America/New_York';
const DAY_KEYS = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidTimeZone = (timeZone) => {
    if (!timeZone || typeof timeZone !== 'string') return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone });
        return true;
    } catch (err) {
        return false;
    }
};

// Offset (ms) between the wall-clock time in `timeZone` and UTC at the given instant.
const timeZoneOffsetMs = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
    return asUtc - date.getTime();
};

/** Converts a wall-clock date + time in `timeZone` to a UTC Date. */
const zonedTimeToUtc = (dateStr, timeStr, timeZone) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    const firstOffset = timeZoneOffsetMs(new Date(guess), timeZone);
    let result = guess - firstOffset;
    // Re-check across a daylight-saving change.
    const secondOffset = timeZoneOffsetMs(new Date(result), timeZone);
    if (secondOffset !== firstOffset) result = guess - secondOffset;
    return new Date(result);
};

/** "YYYY-MM-DD" n days later (calendar arithmetic, timezone-independent). */
const addDays = (dateStr, days) => {
    const d = new Date(`${dateStr}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

const dayKeyFor = (dateStr) => DAY_KEYS[new Date(`${dateStr}T12:00:00Z`).getUTCDay()];

/** The calendar day stored on an older session ("YYYY-MM-DD"), taken from startDate in UTC. */
const legacyDateString = (slot) => (slot.startDate ? new Date(slot.startDate).toISOString().slice(0, 10) : null);

/** Exact start of any session, old or new. Returns null if it can't be worked out. */
const effectiveStartAt = (slot, fallbackTimeZone = DEFAULT_TIMEZONE) => {
    if (slot.startAt) return new Date(slot.startAt);
    const dateStr = legacyDateString(slot);
    if (!dateStr || !TIME_RE.test(slot.startTime || '')) return slot.startDate ? new Date(slot.startDate) : null;
    return zonedTimeToUtc(dateStr, slot.startTime, isValidTimeZone(slot.timezone) ? slot.timezone : fallbackTimeZone);
};

/** Human-readable "Saturday, November 14 at 2:00 PM EST" in the studio's timezone. */
const formatSessionForHumans = (slot, fallbackTimeZone = DEFAULT_TIMEZONE) => {
    const start = effectiveStartAt(slot, fallbackTimeZone);
    if (!start) return 'your session';
    const timeZone = isValidTimeZone(slot.timezone) ? slot.timezone : fallbackTimeZone;
    const date = start.toLocaleDateString('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric' });
    const time = start.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    return `${date} at ${time}`;
};

/**
 * Guests get a full refund if they cancel before the day of their session: the deadline is
 * midnight at the start of the session's calendar day, in the studio's timezone.
 */
const freeCancellationDeadline = (slot, fallbackTimeZone = DEFAULT_TIMEZONE) => {
    const start = effectiveStartAt(slot, fallbackTimeZone);
    if (!start) return null;
    const timeZone = isValidTimeZone(slot.timezone) ? slot.timezone : fallbackTimeZone;
    const localDay = start.toLocaleDateString('en-CA', { timeZone }); // YYYY-MM-DD
    return zonedTimeToUtc(localDay, '00:00', timeZone);
};

const INACTIVE_STATUSES = ['cancelled', 'removed by teacher'];
const isActiveSession = (slot) => !INACTIVE_STATUSES.includes(slot.status);

module.exports = {
    DEFAULT_TIMEZONE,
    DATE_RE,
    TIME_RE,
    INACTIVE_STATUSES,
    isValidTimeZone,
    zonedTimeToUtc,
    addDays,
    dayKeyFor,
    effectiveStartAt,
    formatSessionForHumans,
    freeCancellationDeadline,
    isActiveSession,
};
