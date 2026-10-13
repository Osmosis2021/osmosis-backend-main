import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

// A short, one-time confetti burst for big moments (like publishing a studio time).
// Purely decorative: hidden from screen readers, never blocks clicks, and skipped entirely
// for people who ask their device to reduce motion.

const fall = keyframes`
    0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translate3d(var(--drift), 100vh, 0) rotate(var(--spin)); opacity: 0; }
`;

const COLORS = ['#111318', '#111318', '#F1F0EC', '#E2B04A', '#E2725B', '#5B9A8B'];

export const Confetti = ({ pieces = 70, duration = 2.8 }) => {
    const bits = useMemo(() => Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        size: 6 + Math.random() * 6,
        drift: `${(Math.random() - 0.5) * 30}vw`,
        spin: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.7,
    })), [pieces]);

    return (
        <Box
            aria-hidden
            sx={{
                position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1500,
                '@media (prefers-reduced-motion: reduce)': { display: 'none' },
            }}
        >
            {bits.map((bit, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: `${bit.left}%`,
                        width: bit.size,
                        height: bit.round ? bit.size : bit.size * 0.45,
                        borderRadius: bit.round ? '50%' : '1px',
                        bgcolor: bit.color,
                        border: bit.color === '#F1F0EC' ? '1px solid #111318' : 'none',
                        '--drift': bit.drift,
                        '--spin': bit.spin,
                        opacity: 0,
                        animation: `${fall} ${duration}s cubic-bezier(.2,.6,.4,1) ${bit.delay}s forwards`,
                    }}
                />
            ))}
        </Box>
    );
};

export default Confetti;
