import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

// Studio Time's mascot: a little cube, a blank studio waiting to be filled.
// The artwork is public/favicon.svg; keep the two in sync.

const float = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6%); }
`;

const rock = keyframes`
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
`;

// A happy little hop, then a rest.
const hop = keyframes`
    0%, 60%, 100% { transform: translateY(0) scale(1, 1); }
    10% { transform: translateY(0) scale(1.04, 0.94); }
    25% { transform: translateY(-14%) scale(0.97, 1.04); }
    40% { transform: translateY(0) scale(1.03, 0.97); }
`;

const blink = keyframes`
    0%, 92%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
`;

const MOTIONS = {
    float: `${float} 3.2s ease-in-out infinite`,
    rock: `${rock} 2.8s ease-in-out infinite`,
    hop: `${hop} 2.4s ease-in-out infinite`,
    none: 'none',
};

/**
 * The Studio Time cube.
 *
 * @param {number} size       width and height in px
 * @param {'float'|'rock'|'hop'|'none'} motion
 * @param {boolean} blink     whether the eyes blink now and then
 * @param {string} title      accessible name; without it the mascot is decorative (hidden from screen readers)
 *
 * Animations are switched off for people who ask their device to reduce motion.
 */
export const Mascot = ({ size = 96, motion = 'float', blink: shouldBlink = true, title, sx = {} }) => (
    <Box
        component="svg"
        viewBox="0 0 256 256"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={title ? 'img' : undefined}
        aria-label={title || undefined}
        aria-hidden={title ? undefined : true}
        focusable="false"
        sx={{
            display: 'block',
            flexShrink: 0,
            overflow: 'visible',
            transformOrigin: '50% 85%',
            animation: MOTIONS[motion] || 'none',
            '& .mascot-eyes': {
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: shouldBlink ? `${blink} 4.5s ease-in-out infinite` : 'none',
            },
            '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
                '& .mascot-eyes': { animation: 'none' },
            },
            ...sx,
        }}
    >
        <path d="M43 83 L111 46 L213 67 L145 104 Z" fill="#F8F7F4" stroke="#111318" strokeWidth="10" strokeLinejoin="round" />
        <path d="M43 83 L111 46 L111 211 L43 184 Z" fill="#F1F0EC" stroke="#111318" strokeWidth="10" strokeLinejoin="round" />
        <path d="M111 46 L213 67 L213 188 L111 211 Z" fill="#FFFFFF" stroke="#111318" strokeWidth="10" strokeLinejoin="round" />
        <path d="M133 94 L193 83 L193 177 L133 188 Z" fill="#F8F7F4" stroke="#111318" strokeWidth="7" strokeLinejoin="round" />
        <g className="mascot-eyes">
            <rect x="148" y="127" width="8" height="20" rx="4" fill="#111318" />
            <rect x="172" y="127" width="8" height="20" rx="4" fill="#111318" />
        </g>
    </Box>
);

export default Mascot;
