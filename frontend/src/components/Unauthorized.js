import React from 'react';
import { Button, Container, Stack, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { Link, useLocation } from 'react-router-dom';
import useStore from '../store';

// Shown when a signed-in account opens a page meant for the other kind of account.
const Unauthorized = () => {
    const { isTeacher, userName } = useStore();
    const location = useLocation();
    const wanted = location.state?.from?.pathname || '';
    const isArtistPage = /^\/(editcourse|editphotos|payouts|stripeonboarding|flow|teacher\/bookings)/i.test(wanted);
    const home = userName ? `/${isTeacher ? 'teachers' : 'students'}/${userName}` : '/';

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 10, md: 14 }, textAlign: 'center' }}>
            <Stack spacing={2} alignItems="center">
                <LockIcon sx={{ fontSize: 48, color: 'text.disabled' }} aria-hidden />
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                    {isArtistPage ? 'This page is for artists' : "You don't have access to this page"}
                </Typography>
                <Typography color="text.secondary">
                    {isArtistPage
                        ? 'Hosting tools are only available on artist accounts. You can still browse and book studio times.'
                        : "It belongs to a different account. If you think that's a mistake, try logging out and back in."}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1, width: { xs: '100%', sm: 'auto' } }}>
                    <Button component={Link} to="/explore" variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                        Browse studio times
                    </Button>
                    <Button component={Link} to={home} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                        Go to my profile
                    </Button>
                </Stack>
            </Stack>
        </Container>
    );
};

export default Unauthorized;
