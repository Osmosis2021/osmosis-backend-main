import React from 'react';
import {
    Stepper,
    Step,
    StepLabel,
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Stack } from '@mui/material';


const StyledStepper = styled(Stepper)(({ theme }) => ({
    padding: theme.spacing(3, 0, 5),
    '& .MuiStepLabel-label': {
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: theme.palette.text.secondary,
        '&.Mui-active': {
            color: theme.palette.primary.main,
            fontWeight: 700,
        },
        '&.Mui-completed': {
            color: theme.palette.text.primary,
        },
    },
    '& .MuiStepIcon-root': {
        width: 24,
        height: 24,
        '&.Mui-active': {
            color: theme.palette.primary.main,
        },
        '&.Mui-completed': {
            color: theme.palette.primary.main,
        },
    },
}));

const MobileProgressContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2, 2, 4),
}));

export const PremiumStepper = ({ activeStep, steps }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (isMobile) {
        const progress = ((activeStep + 1) / steps.length) * 100;
        return (
            <MobileProgressContainer>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Step {activeStep + 1} of {steps.length}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {steps[activeStep]}
                    </Typography>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0,174,239,0.1)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                        }
                    }}
                />
            </MobileProgressContainer>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto' }}>
            <StyledStepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </StyledStepper>
        </Box>
    );
};