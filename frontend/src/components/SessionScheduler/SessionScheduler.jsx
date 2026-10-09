import React, { useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { useConfirm, useToast } from '../../ui/feedback';
import {
    MAX_REPEAT_WEEKS,
    addWeeks,
    describeTimeZone,
    formatClockTime,
    formatSessionDate,
    formatTimeRange,
    isUpcomingSession,
    sessionDateString,
    sessionStart,
    sessionsOverlap,
} from '../../utils/sessionTime';

// Text for screen readers only.
// (Pixel strings on purpose: in sx, width: 1 would mean 100%.)
const visuallyHidden = { position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };

const MAX_DRAFT_SESSIONS = 60;
const DEFAULT_START = '14:00';

const toDateString = (value) => (value && value.isValid() ? value.format('YYYY-MM-DD') : '');
const toTimeString = (value) => (value && value.isValid() ? value.format('HH:mm') : '');
const fromTimeString = (hhmm) => dayjs(`2000-01-01T${hhmm}`);

/**
 * Validates a proposed set of sessions against what's already scheduled.
 * Returns an error message, or '' if everything is fine.
 */
const validateNewSessions = (entries, existing, durationMinutes, ignoreKey) => {
    const now = Date.now();
    for (const entry of entries) {
        // Studio-local time; the server re-checks in the studio's timezone.
        if (new Date(`${entry.date}T${entry.startTime}:00`).getTime() <= now) {
            return `${formatSessionDate(entry.date)} at ${formatClockTime(entry.startTime)} has already passed. Choose a later time.`;
        }
    }
    const others = existing.filter((slot) => (slot._id || slot.key) !== ignoreKey);
    const checked = [];
    for (const entry of entries) {
        const clash = [...others, ...checked].find((other) => sessionsOverlap(entry, other, durationMinutes));
        if (clash) {
            return `${formatSessionDate(entry.date)} at ${formatClockTime(entry.startTime)} overlaps the ${formatClockTime(clash.startTime)} session that day.`;
        }
        checked.push(entry);
    }
    return '';
};

const DateAndTimeFields = ({ date, time, onDateChange, onTimeChange, disabled, idPrefix }) => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
        <DatePicker
            label="Date"
            value={date}
            onChange={onDateChange}
            disablePast
            maxDate={dayjs().add(1, 'year')}
            inputFormat="ddd, MMM D, YYYY"
            disabled={disabled}
            renderInput={(params) => <TextField {...params} id={`${idPrefix}-date`} fullWidth />}
        />
        <TimePicker
            label="Start time"
            value={time}
            onChange={onTimeChange}
            minutesStep={15}
            disabled={disabled}
            renderInput={(params) => <TextField {...params} id={`${idPrefix}-time`} fullWidth />}
        />
    </Stack>
);

/** Dialog for moving an unbooked session to a new date/time. */
const RescheduleDialog = ({ session, onClose, onSave, existing, durationMinutes }) => {
    const [date, setDate] = useState(() => dayjs(sessionDateString(session)));
    const [time, setTime] = useState(() => fromTimeString(session.startTime || DEFAULT_START));
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        const entry = { date: toDateString(date), startTime: toTimeString(time) };
        if (!entry.date || !entry.startTime) {
            setError('Choose a date and a start time.');
            return;
        }
        const problem = validateNewSessions([entry], existing, durationMinutes, session._id || session.key);
        if (problem) {
            setError(problem);
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            await onSave(entry);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "We couldn't move this session. Please try again.");
            setIsSaving(false);
        }
    };

    return (
        <Dialog open onClose={isSaving ? undefined : onClose} maxWidth="xs" fullWidth aria-labelledby="reschedule-title"
            PaperProps={{ sx: { borderRadius: '20px', m: 2 } }}>
            <DialogTitle id="reschedule-title" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>Change date & time</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    <DateAndTimeFields
                        date={date}
                        time={time}
                        onDateChange={setDate}
                        onTimeChange={setTime}
                        disabled={isSaving}
                        idPrefix="reschedule"
                    />
                </Box>
                {error && <Alert severity="error" role="alert" sx={{ mt: 2, borderRadius: '12px' }}>{error}</Alert>}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} disabled={isSaving} sx={{ textTransform: 'none', color: 'text.secondary' }}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ textTransform: 'none', fontWeight: 700, minWidth: 110 }}>
                    {isSaving ? <CircularProgress size={20} color="inherit" aria-label="Saving" /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

/** Optional message to guests, shown inside the cancel confirmation. */
const CancelNoteField = ({ noteRef }) => {
    const [value, setValue] = useState('');
    return (
        <TextField
            label="Message to guests (optional)"
            placeholder="e.g. I'm unwell, sorry! Hope to see you at another session."
            value={value}
            onChange={(e) => { setValue(e.target.value); noteRef.current = e.target.value; }}
            multiline
            minRows={2}
            fullWidth
            inputProps={{ maxLength: 500 }}
            sx={{ mt: 2 }}
        />
    );
};

/**
 * Schedule editor for a studio time.
 *
 * mode="draft": nothing is saved yet (creation wizard). `sessions` are { key, date, startTime };
 *               onAdd/onRemove just update the parent's list.
 * mode="live":  `sessions` come from the server. onAdd/onReschedule/onCancel call the API and
 *               may throw; booked sessions can't be moved, only cancelled (guests are refunded).
 */
const SessionScheduler = ({
    mode = 'draft',
    sessions = [],
    durationMinutes = 60,
    timezone,
    onAdd,
    onRemove,
    onReschedule,
    onCancel,
}) => {
    const confirm = useConfirm();
    const toast = useToast();
    const isLive = mode === 'live';

    const lastTime = sessions.length ? sessions[sessions.length - 1].startTime : DEFAULT_START;
    const [date, setDate] = useState(null);
    const [time, setTime] = useState(() => fromTimeString(lastTime || DEFAULT_START));
    const [repeat, setRepeat] = useState(false);
    const [repeatWeeks, setRepeatWeeks] = useState(8);
    const [error, setError] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [rescheduling, setRescheduling] = useState(null);
    const cancelNote = useRef('');

    const upcoming = useMemo(() => sessions
        .filter((slot) => !isLive || isUpcomingSession(slot))
        .sort((a, b) => (sessionStart(a)?.getTime() || 0) - (sessionStart(b)?.getTime() || 0)),
    [sessions, isLive]);

    const proposed = useMemo(() => {
        const dateStr = toDateString(date);
        const startTime = toTimeString(time);
        if (!dateStr || !startTime) return [];
        const weeks = repeat ? repeatWeeks : 1;
        return Array.from({ length: weeks }, (_, i) => ({ date: addWeeks(dateStr, i), startTime }));
    }, [date, time, repeat, repeatWeeks]);

    const handleAdd = async () => {
        if (!toDateString(date)) { setError('Pick a date for the session.'); return; }
        if (!toTimeString(time)) { setError('Pick a start time.'); return; }
        const problem = validateNewSessions(proposed, upcoming, durationMinutes);
        if (problem) { setError(problem); return; }
        if (!isLive && upcoming.length + proposed.length > MAX_DRAFT_SESSIONS) {
            setError(`You can add up to ${MAX_DRAFT_SESSIONS} sessions now, and more after going live.`);
            return;
        }
        setError('');
        setIsAdding(true);
        try {
            await onAdd(proposed);
            setDate(null);
            setRepeat(false);
            if (isLive) toast.success(proposed.length === 1 ? 'Session added.' : `${proposed.length} sessions added.`);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "We couldn't add that session. Please try again.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveUnbooked = async (slot) => {
        if (!isLive) {
            onRemove(slot);
            return;
        }
        const removed = await confirm({
            title: 'Remove this session?',
            description: `${formatSessionDate(slot, { weekday: 'long', month: 'long', day: 'numeric' })}, ${formatTimeRange(slot.startTime, slot.durationMinutes || durationMinutes)}. Nobody has booked it yet, so no guests are affected.`,
            confirmLabel: 'Remove session',
            destructive: true,
            onConfirm: () => onCancel(slot, ''),
        });
        if (removed) toast.success('Session removed.');
    };

    const handleCancelBooked = async (slot) => {
        cancelNote.current = '';
        let summary;
        const booked = slot.enrollment || 0;
        const cancelled = await confirm({
            title: 'Cancel this booked session?',
            description: (
                <>
                    <strong>{formatSessionDate(slot, { weekday: 'long', month: 'long', day: 'numeric' })}, {formatTimeRange(slot.startTime, slot.durationMinutes || durationMinutes)}</strong>
                    {' '}has {booked} {booked === 1 ? 'guest' : 'guests'} booked. If you cancel:
                    <Box component="ul" sx={{ pl: 2.5, my: 1, listStyle: 'disc', '& li': { display: 'list-item' } }}>
                        <li>Every guest gets a full refund automatically.</li>
                        <li>We email them that the session is cancelled.</li>
                        <li>The session disappears from your listing. This can't be undone.</li>
                    </Box>
                    <CancelNoteField noteRef={cancelNote} />
                </>
            ),
            confirmLabel: 'Cancel session & refund',
            cancelLabel: 'Keep session',
            destructive: true,
            onConfirm: async () => { summary = await onCancel(slot, cancelNote.current); },
        });
        if (!cancelled) return;
        const refunded = summary?.refunded || 0;
        const attention = summary?.refundsNeedingAttention || 0;
        if (attention > 0) {
            toast.warning(`Session cancelled and guests notified. ${attention} refund${attention > 1 ? 's' : ''} couldn't be processed automatically; the Studio Time team will follow up.`);
        } else {
            toast.success(refunded ? `Session cancelled. ${refunded === 1 ? 'Your guest was' : 'Guests were'} refunded and emailed.` : 'Session cancelled and guests notified.');
        }
    };

    const preview = proposed.length > 1
        ? `${proposed.length} sessions, every ${formatSessionDate(proposed[0].date, { weekday: 'long' })} from ${formatSessionDate(proposed[0].date, { month: 'short', day: 'numeric' })} to ${formatSessionDate(proposed[proposed.length - 1].date, { month: 'short', day: 'numeric' })}`
        : '';

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={3}>
                {/* Add session */}
                <Box sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 2 }}>Add a session</Typography>
                    <Stack spacing={2}>
                        <DateAndTimeFields
                            date={date}
                            time={time}
                            onDateChange={(value) => { setDate(value); setError(''); }}
                            onTimeChange={(value) => { setTime(value); setError(''); }}
                            disabled={isAdding}
                            idPrefix="add-session"
                        />
                        {toTimeString(time) && (
                            <Typography variant="body2" color="text.secondary">
                                {formatTimeRange(toTimeString(time), durationMinutes)}
                            </Typography>
                        )}

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <FormControlLabel
                                control={<Switch checked={repeat} onChange={(e) => setRepeat(e.target.checked)} disabled={isAdding} />}
                                label="Repeat weekly"
                            />
                            {repeat && (
                                <TextField
                                    select
                                    size="small"
                                    label="For"
                                    value={repeatWeeks}
                                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                                    disabled={isAdding}
                                    sx={{ minWidth: 140 }}
                                >
                                    {Array.from({ length: MAX_REPEAT_WEEKS - 1 }, (_, i) => i + 2).map((weeks) => (
                                        <MenuItem key={weeks} value={weeks}>{weeks} weeks</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        </Stack>
                        {preview && <Typography variant="body2" color="text.secondary">{preview}</Typography>}

                        {error && <Alert severity="error" role="alert" sx={{ borderRadius: '12px' }}>{error}</Alert>}

                        <Button
                            variant="contained"
                            onClick={handleAdd}
                            disabled={isAdding}
                            startIcon={isAdding ? null : <AddIcon />}
                            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 3, py: 1.25 }}
                        >
                            {isAdding
                                ? <CircularProgress size={20} color="inherit" aria-label="Adding sessions" />
                                : proposed.length > 1 ? `Add ${proposed.length} sessions` : 'Add session'}
                        </Button>
                    </Stack>
                </Box>

                {timezone && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                        <PublicIcon fontSize="small" aria-hidden />
                        <Typography variant="body2">Times are in {describeTimeZone(timezone)}, your studio's timezone.</Typography>
                    </Stack>
                )}

                {/* Scheduled sessions */}
                <Box>
                    <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 1.5 }}>
                        {upcoming.length ? `Upcoming sessions (${upcoming.length})` : 'Upcoming sessions'}
                    </Typography>
                    {upcoming.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '16px', color: 'text.secondary' }}>
                            <EventBusyIcon sx={{ fontSize: 32, mb: 1, opacity: 0.6 }} aria-hidden />
                            <Typography variant="body2">No sessions yet. Pick a date and time above to add your first one.</Typography>
                        </Box>
                    ) : (
                        <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                            {upcoming.map((slot) => {
                                const booked = isLive ? (slot.enrollment || 0) : 0;
                                const capacity = slot.capacity;
                                const dateStr = sessionDateString(slot);
                                return (
                                    <Box
                                        component="li"
                                        key={slot._id || slot.key}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, pr: 1, border: '1px solid', borderColor: 'divider', borderRadius: '14px', bgcolor: 'background.default' }}
                                    >
                                        <Box sx={{ width: 52, flexShrink: 0, textAlign: 'center', py: 0.5, borderRadius: '10px', bgcolor: 'background.paper' }} aria-hidden>
                                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.2 }}>
                                                {formatSessionDate(dateStr, { month: 'short' })}
                                            </Typography>
                                            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1 }}>
                                                {formatSessionDate(dateStr, { day: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            {/* The badge shows month and day; screen readers get the full date here. */}
                                            <Typography sx={{ fontWeight: 700 }}>
                                                {formatSessionDate(dateStr, { weekday: 'long' })}
                                                <Box component="span" sx={visuallyHidden}>, {formatSessionDate(dateStr, { month: 'long', day: 'numeric' })}</Box>
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatTimeRange(slot.startTime, slot.durationMinutes || durationMinutes)}
                                            </Typography>
                                            {isLive && (
                                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                                                    <Chip
                                                        size="small"
                                                        label={`${booked}/${capacity} booked`}
                                                        sx={booked ? { bgcolor: 'success.light', color: 'success.dark', borderColor: 'success.main' } : undefined}
                                                    />
                                                    {booked > 0 && (
                                                        <Tooltip title="Guests have booked this session, so its date and time are locked.">
                                                            <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-label="Date and time locked" />
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            )}
                                        </Box>
                                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                            {booked > 0 ? (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleCancelBooked(slot)}
                                                    sx={{ textTransform: 'none', fontWeight: 700 }}
                                                >
                                                    Cancel
                                                </Button>
                                            ) : (
                                                <>
                                                    {isLive && (
                                                        <IconButton
                                                            aria-label={`Change date and time of ${formatSessionDate(dateStr)} session`}
                                                            onClick={() => setRescheduling(slot)}
                                                        >
                                                            <EditCalendarIcon />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        aria-label={`Remove ${formatSessionDate(dateStr)} ${formatClockTime(slot.startTime)} session`}
                                                        onClick={() => handleRemoveUnbooked(slot)}
                                                    >
                                                        <DeleteOutlineIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            </Stack>

            {rescheduling && (
                <RescheduleDialog
                    session={rescheduling}
                    existing={upcoming}
                    durationMinutes={durationMinutes}
                    onClose={() => setRescheduling(null)}
                    onSave={async (entry) => {
                        await onReschedule(rescheduling, entry);
                        toast.success('Session moved.');
                    }}
                />
            )}
        </LocalizationProvider>
    );
};

export default SessionScheduler;
