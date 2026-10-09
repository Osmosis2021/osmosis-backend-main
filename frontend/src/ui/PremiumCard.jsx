import React from 'react';
import { Card } from '@mui/material';
import { styled } from '@mui/material/styles';

// `interactive` is styling-only; don't pass it through to the DOM.
const StyledCard = styled(Card, { shouldForwardProp: (prop) => prop !== 'interactive' })(({ theme, interactive }) => ({
    borderRadius: 0,
    boxShadow: 'none',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s',
    cursor: interactive ? 'pointer' : 'default',
    ...(interactive && {
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            borderColor: theme.palette.text.primary,
        },
        '&:focus-visible': {
            outline: `3px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
        },
    }),
    '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
}));

/**
 * Card used across the app. It only looks clickable (hover lift, pointer) when it is:
 * a link (`to`/`href`) or has an `onClick`, or `hoverable` is set (card inside a link).
 * Pass `nohover` to force a static card.
 */
export const PremiumCard = ({ children, nohover = false, hoverable = false, ...props }) => {
    const interactive = !nohover && (hoverable || Boolean(props.onClick || props.to || props.href));
    return (
        <StyledCard interactive={interactive} {...props}>
            {children}
        </StyledCard>
    );
};
