import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';
import EventIcon from '@mui/icons-material/Event';

export const ROLE_OPTIONS = [
    { value: 'artist', label: 'Artist', description: 'Host creative studio experiences', Icon: BrushIcon },
    { value: 'guest', label: 'Guest', description: 'Explore & book art sessions', Icon: EventIcon },
];

/**
 * "How will you use Studio Time?" choice, shared by the signup form and the Google role dialog.
 * Behaves as a radio group: arrow keys and Tab/Enter/Space all work.
 */
const RoleOptions = ({ value, onChange, error, labelId = 'role-options-label' }) => {
    const handleKeyDown = (event, index) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const next = ROLE_OPTIONS[(index + 1) % ROLE_OPTIONS.length];
        onChange(next.value);
        document.getElementById(`role-option-${next.value}`)?.focus();
    };

    return (
        <Box>
            <Typography id={labelId} variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                How will you use Studio Time?
            </Typography>
            <Box role="radiogroup" aria-labelledby={labelId} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {ROLE_OPTIONS.map(({ value: optionValue, label, description, Icon }, index) => {
                    const selected = value === optionValue;
                    return (
                        <ButtonBase
                            key={optionValue}
                            id={`role-option-${optionValue}`}
                            role="radio"
                            aria-checked={selected}
                            aria-label={`${label}: ${description}`}
                            tabIndex={selected || (!value && index === 0) ? 0 : -1}
                            onClick={() => onChange(optionValue)}
                            onKeyDown={(event) => handleKeyDown(event, index)}
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                border: '2px solid',
                                borderColor: selected ? 'primary.main' : error ? 'error.main' : 'divider',
                                borderRadius: '16px',
                                bgcolor: selected ? 'rgba(10, 10, 10, 0.04)' : 'background.default',
                                textAlign: 'center',
                                transition: 'border-color 0.2s ease-in-out, transform 0.2s ease-in-out',
                                '&:hover': { borderColor: selected ? 'primary.main' : 'text.disabled' },
                                '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                            }}
                        >
                            <Icon sx={{ fontSize: 28, color: selected ? 'primary.main' : 'text.secondary', mb: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                {label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.3 }}>
                                {description}
                            </Typography>
                        </ButtonBase>
                    );
                })}
            </Box>
            {error && (
                <Typography variant="caption" color="error" role="alert" sx={{ display: 'block', mt: 1 }}>
                    {error}
                </Typography>
            )}
        </Box>
    );
};

export default RoleOptions;
