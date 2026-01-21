import React from 'react';
import { Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledChip = styled(Chip)(({ theme }) => ({
    borderRadius: 8,
    fontWeight: 600,
    fontSize: '0.75rem',
    height: '24px',
    backgroundColor: '#F5F5F5',
    color: '#666',
    border: 'none',
    '& .MuiChip-label': {
        paddingLeft: '8px',
        paddingRight: '8px',
    },
}));

export const PremiumChip = ({ label, ...props }) => {
    return <StyledChip label={label} {...props} />;
};
