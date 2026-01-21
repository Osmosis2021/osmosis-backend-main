import React from 'react';
import { Card } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme, nohover }) => ({
    borderRadius: 0,
    boxShadow: 'none',
    border: '1px solid #EDEDED',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: nohover ? 'default' : 'pointer',
    '&:hover': {
        transform: nohover ? 'none' : 'translateY(-2px)',
        boxShadow: nohover ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
        borderColor: '#000',
    },
}));

export const PremiumCard = ({ children, nohover = false, ...props }) => {
    return (
        <StyledCard nohover={nohover} {...props}>
            {children}
        </StyledCard>
    );
};
