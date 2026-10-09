import React from 'react';
import { Skeleton, Stack } from '@mui/material';

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

// Single empty-state component, kept here for existing imports.
export { PremiumEmptyState } from './PremiumEmptyState';
