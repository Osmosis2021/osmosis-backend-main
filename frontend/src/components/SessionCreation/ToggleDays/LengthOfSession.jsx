import { Typography, ToggleButton, ToggleButtonGroup, Box, Stack } from '@mui/material';
import React, { useEffect } from 'react';
import { withStyles } from '@mui/styles';
import useStore from '../../../store';

const StyledToggle = withStyles({
    root: {
        color: '#000000',
        borderRadius: '24px !important',
        height: '36px',
        minWidth: '72px',
        padding: '0 16px',
        border: '1px solid #EDEDED !important',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.8rem',
        '&.Mui-selected': {
            color: 'white !important',
            background: '#000000 !important',
        },
        '&:hover': {
            borderColor: '#000000 !important',
            background: 'rgba(0,0,0,0.04)',
        },
    },
    selected: {},
})(ToggleButton);

function LengthOfSession() {
    const { newCourseDuration, setNewCourseDuration } = useStore();
    const lengths = [30, 60, 90];

    useEffect(() => {
        if (!newCourseDuration) setNewCourseDuration(60);
    }, [newCourseDuration, setNewCourseDuration]);

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 1.5, display: 'block', textAlign: 'center' }}>
                Session Duration
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
                <ToggleButtonGroup
                    exclusive
                    value={newCourseDuration}
                    onChange={(e, val) => { if (val) setNewCourseDuration(val) }}
                    sx={{ gap: 1 }}
                >
                    {lengths.map((length) => (
                        <StyledToggle
                            key={length}
                            value={length}
                            aria-label={`${length} minutes`}
                        >
                            {length === 60 ? '1 hr' : length === 90 ? '1.5 hr' : `${length} min`}
                        </StyledToggle>
                    ))}
                </ToggleButtonGroup>
            </Stack>
        </Box>
    );
}

export default LengthOfSession;

