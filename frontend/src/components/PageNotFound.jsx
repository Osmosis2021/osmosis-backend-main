import React from 'react';
import { Button, Container, Stack, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Link } from 'react-router-dom';

const PageNotFound = () => (
    <Container maxWidth="sm" sx={{ py: { xs: 10, md: 14 }, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
            <SearchOffIcon sx={{ fontSize: 52, color: 'text.disabled' }} aria-hidden />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>We couldn't find that page</Typography>
            <Typography color="text.secondary">The link may be old or mistyped. Here are some good places to go instead.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Button component={Link} to="/explore" variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                    Browse studio times
                </Button>
                <Button component={Link} to="/" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                    Go to home
                </Button>
            </Stack>
        </Stack>
    </Container>
);

export default PageNotFound;
