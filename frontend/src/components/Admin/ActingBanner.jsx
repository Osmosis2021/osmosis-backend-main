import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useRefreshToken from '../../hooks/useRefreshToken';
import { useToast } from '../../ui/feedback';

/**
 * Shown while a team member is working on an unclaimed artist's profile, so it's always clear whose
 * account you're in. "Back to my account" restores the team member's own session (their sign-in
 * cookie was never replaced).
 */
export default function ActingBanner() {
    const { auth } = useAuth();
    const refresh = useRefreshToken();
    const navigate = useNavigate();
    const toast = useToast();
    const [isLeaving, setIsLeaving] = useState(false);

    if (!auth?.actingAs) return null;

    const backToMyAccount = async () => {
        setIsLeaving(true);
        try {
            await refresh();
            navigate('/admin');
        } catch (err) {
            toast.error('Please sign in again.');
            navigate('/');
        } finally {
            setIsLeaving(false);
        }
    };

    return (
        <Box
            role="status"
            sx={{
                position: 'sticky', top: 0, zIndex: 1250,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap',
                px: 2, py: 1, bgcolor: '#E2B04A', color: '#111318', textAlign: 'center',
            }}
        >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                You're working on {auth.actingAs.artistName || auth.userName}'s profile. Changes save to their account.
            </Typography>
            <Button size="small" variant="contained" onClick={backToMyAccount} disabled={isLeaving}
                sx={{ bgcolor: '#111318', color: '#FFFFFF', textTransform: 'none', fontWeight: 800, borderRadius: '10px', '&:hover': { bgcolor: '#2a2d35' } }}>
                {isLeaving ? 'Switching…' : 'Back to my account'}
            </Button>
        </Box>
    );
}
