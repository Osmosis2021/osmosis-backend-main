import React from 'react';
import { Chip, MenuItem, Stack, TextField } from '@mui/material';
import { DURATION_OPTIONS, POPULAR_DURATIONS, formatDuration } from '../../utils/sessionTime';

/** Session length picker: 30 min to 4 hrs in 15-minute steps, with one-tap common lengths. */
const DurationSelect = ({ value, onChange, helperText, disabled, id = 'session-length' }) => (
    <Stack spacing={1.5}>
        <TextField
            select
            id={id}
            label="Session length"
            value={DURATION_OPTIONS.includes(Number(value)) ? Number(value) : ''}
            onChange={(e) => onChange(Number(e.target.value))}
            helperText={helperText}
            disabled={disabled}
            fullWidth
        >
            {DURATION_OPTIONS.map((minutes) => (
                <MenuItem key={minutes} value={minutes}>{formatDuration(minutes)}</MenuItem>
            ))}
        </TextField>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap aria-label="Common lengths">
            {POPULAR_DURATIONS.map((minutes) => (
                <Chip
                    key={minutes}
                    label={formatDuration(minutes)}
                    onClick={() => onChange(minutes)}
                    aria-pressed={Number(value) === minutes}
                    disabled={disabled}
                    // Selected chips are solid so the choice is obvious (the theme keeps chips subtle by default).
                    sx={Number(value) === minutes ? { bgcolor: 'text.primary', color: 'background.default', borderColor: 'text.primary', '&:hover': { bgcolor: 'text.primary' } } : undefined}
                />
            ))}
        </Stack>
    </Stack>
);

export default DurationSelect;
