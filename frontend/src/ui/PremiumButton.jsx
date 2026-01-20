import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: 0,
    padding: '12px 28px',
    boxShadow: 'none',
    border: variant === 'outlined' ? '1px solid #000' : 'none',
    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: 'none',
        backgroundColor: variant === 'contained' ? '#333' : '#F7F7F7',
    },
}));

export const PremiumButton = ({ children, variant = 'contained', color = 'primary', ...props }) => {
    return (
        <StyledButton variant={variant} color={color} {...props}>
            {children}
        </StyledButton>
    );
};
