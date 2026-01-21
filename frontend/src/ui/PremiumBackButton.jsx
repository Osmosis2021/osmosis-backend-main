import React from 'react';
import { IconButton, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export const PremiumBackButton = ({ fallback = '/explore', sx = {} }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(fallback);
        }
    };

    return (
        <IconButton
            onClick={handleBack}
            sx={{
                width: 44,
                height: 44,
                bgcolor: 'white',
                color: 'text.primary',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #F0F0F0',
                transition: 'all 0.2s ease',
                '&:hover': {
                    bgcolor: '#F8F9FA',
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                },
                '&:active': {
                    transform: 'scale(0.95)',
                },
                ...sx
            }}
        >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
    );
};
