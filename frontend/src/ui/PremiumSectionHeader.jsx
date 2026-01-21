import React from 'react';
import { Box, Typography } from '@mui/material';

export const PremiumSectionHeader = ({ title, subtitle, align = 'left', ...props }) => {
    return (
        <Box sx={{ mb: 4, textAlign: align }} {...props}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body1" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
};
