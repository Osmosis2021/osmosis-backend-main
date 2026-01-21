import React from 'react';
import { Box, Typography, Skeleton, Stack } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const PremiumSkeleton = ({ count = 1, height = 200 }) => {
    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            {Array.from(new Array(count)).map((_, index) => (
                <Skeleton
                    key={index}
                    variant="rectangular"
                    height={height}
                    sx={{ borderRadius: 4, bgcolor: 'rgba(0,0,0,0.03)' }}
                />
            ))}
        </Stack>
    );
};

export const PremiumEmptyState = ({ title, message, icon: Icon = InfoOutlinedIcon }) => {
    return (
        <Box
            sx={{
                py: 8,
                px: 4,
                textAlign: 'center',
                borderRadius: 4,
                bgcolor: '#F9F9F9',
                border: '1px dashed #E0E0E0'
            }}
        >
            <Icon sx={{ fontSize: 48, color: '#CCC', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {message}
            </Typography>
        </Box>
    );
};
