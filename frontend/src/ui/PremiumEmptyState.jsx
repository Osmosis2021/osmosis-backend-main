import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { PremiumButton } from './PremiumButton';

export const PremiumEmptyState = ({
    title,
    subtitle,
    icon,
    actionLabel,
    onAction,
    sx = {}
}) => {
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 8,
                px: 4,
                bgcolor: 'white',
                borderRadius: 4,
                border: '1px dashed #E0E0E0',
                ...sx
            }}
        >
            <Stack spacing={3} alignItems="center">
                {icon && (
                    <Box sx={{ color: 'primary.light', mb: 1 }}>
                        {icon}
                    </Box>
                )}
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                        {subtitle}
                    </Typography>
                </Box>
                {actionLabel && (
                    <PremiumButton variant="contained" onClick={onAction}>
                        {actionLabel}
                    </PremiumButton>
                )}
            </Stack>
        </Box>
    );
}; export default PremiumEmptyState;
