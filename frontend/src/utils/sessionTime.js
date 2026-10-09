// Formatting helpers for studio-time sessions.
//
// Sessions store `startAt` (exact UTC moment) and `timezone` (the studio's zone). Older sessions
// only have `startDate` (a calendar day) and `startTime` ("HH:mm" at the studio). Calendar days
// are formatted in UTC so they never shift a day for people west of London.

export const DURATION_OPTIONS = Array.from({ length: 15 }, (_, i) => 30 + i * 15); // 30 min … 4 hrs
export const POPULAR_DURATIONS = [60, 90, 120, 180];
export const MAX_REPEAT_WEEKS = 26;

export const browserTimeZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    } catch (e) {
        return 'America/New_York';
    }
};

/** "1 hr 30 min", "45 min", "2 hrs" */
export const formatDuration = (minutes) => {
    const total = Number(minutes) || 0;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    const parts = [];
    if (hours) parts.push(`${hours} hr${hours > 1 && !mins ? 's' : ''}`);
    if (mins || !hours) parts.push(`${mins} min`);
    return parts.join(' ');
};

/** "14:00" -> "2:00 PM" */
export const formatClockTime = (hhmm) => {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

/** "14:00" + 90 -> "15:30" (may roll past midnight) */
export const addMinutesToClock = (hhmm, minutes) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const total = (h * 60 + m + Number(minutes || 0)) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** "2:00 – 3:30 PM" style range for a session's local start time and length. */
export const formatTimeRange = (startTime, durationMinutes) => {
    const start = formatClockTime(startTime);
    const end = formatClockTime(addMinutesToClock(startTime, durationMinutes));
    if (!start) return '';
    if (!durationMinutes) return start;
    const [startNum, startSuffix] = start.split(' ');
    const [, endSuffix] = end.split(' ');
    return startSuffix === endSuffix ? `${startNum} – ${end}` : `${start} – ${end}`;
};

/** Calendar day of a session as "YYYY-MM-DD". */
export const sessionDateString = (slot) => {
    if (!slot) return '';
    if (slot.date) return slot.date; // drafts in the scheduler
    if (slot.startAt && slot.timezone) {
        try {
            // en-CA formats as YYYY-MM-DD
            return new Date(slot.startAt).toLocaleDateString('en-CA', { timeZone: slot.timezone });
        } catch (e) { /* fall through to startDate */ }
    }
    return slot.startDate ? new Date(slot.startDate).toISOString().slice(0, 10) : '';
};

/** "Sat, Nov 14" (or any Intl date options) for a session or a "YYYY-MM-DD" string. */
export const formatSessionDate = (slotOrDate, options = { weekday: 'short', month: 'short', day: 'numeric' }) => {
    const dateStr = typeof slotOrDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(slotOrDate)
        ? slotOrDate.slice(0, 10)
        : sessionDateString(slotOrDate);
    if (!dateStr) return '';
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString(undefined, { ...options, timeZone: 'UTC' });
};

/** Exact start of a session as a Date (best effort for older sessions). */
export const sessionStart = (slot) => {
    if (!slot) return null;
    if (slot.startAt) return new Date(slot.startAt);
    const dateStr = sessionDateString(slot);
    if (!dateStr) return null;
    return new Date(`${dateStr}T${slot.startTime || '00:00'}:00`);
};

export const isUpcomingSession = (slot, now = Date.now()) => {
    const start = sessionStart(slot);
    return Boolean(start) && start.getTime() > now;
};

/** "Eastern Time (EST)" style label for a timezone. */
export const describeTimeZone = (timeZone) => {
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'long' }).formatToParts(new Date());
        const short = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date());
        const longName = parts.find((p) => p.type === 'timeZoneName')?.value || timeZone;
        const shortName = short.find((p) => p.type === 'timeZoneName')?.value;
        const friendly = longName.replace(/ (Standard|Daylight) Time$/, ' Time');
        return shortName && shortName !== longName ? `${friendly} (${shortName})` : friendly;
    } catch (e) {
        return timeZone;
    }
};

/** Adds whole weeks to a "YYYY-MM-DD" date. */
export const addWeeks = (dateStr, weeks) => {
    const d = new Date(`${dateStr}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + weeks * 7);
    return d.toISOString().slice(0, 10);
};

/** Whether two sessions (with date, startTime, duration) overlap. Times are compared as studio-local. */
export const sessionsOverlap = (a, b, durationMinutes) => {
    const toMinutes = (slot) => {
        const dateStr = sessionDateString(slot);
        const [h, m] = (slot.startTime || '00:00').split(':').map(Number);
        return Date.parse(`${dateStr}T00:00:00Z`) / 60000 + h * 60 + m;
    };
    const aStart = toMinutes(a);
    const bStart = toMinutes(b);
    const aLen = Number(a.durationMinutes || durationMinutes || 60);
    const bLen = Number(b.durationMinutes || durationMinutes || 60);
    return aStart < bStart + bLen && bStart < aStart + aLen;
};

/** A session/booking calendar day as a local Date at noon (safe for day comparisons and calendars). */
export const sessionLocalDay = (slotOrDate) => {
    const dateStr = typeof slotOrDate === 'string' ? slotOrDate.slice(0, 10) : sessionDateString(slotOrDate);
    return dateStr ? new Date(`${dateStr}T12:00:00`) : null;
};
