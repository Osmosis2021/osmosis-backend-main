import React, { useEffect } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import { Link, useLocation } from 'react-router-dom';
import TopNavBar from '../TopNavBar/TopNavBar';
import usePayouts from '../../hooks/usePayouts';
import useStore from '../../store';

const COPY = {
    not_started: {
        title: 'Get paid for your sessions',
        body: 'Studio Time uses Stripe to send your earnings straight to your bank account. Setup takes about 5 minutes: you\'ll confirm your identity and add your bank details on Stripe\'s secure site.',
        action: 'Set up payouts with Stripe',
    },
    in_progress: {
        title: 'Finish setting up payouts',
        body: "You've started setting up payouts but haven't finished Stripe's form. Pick up where you left off.",
        action: 'Continue on Stripe',
    },
    action_needed: {
        title: 'Stripe needs a bit more information',
        body: 'Stripe needs a few more details before it can send you money. This is usually quick.',
        action: 'Add details on Stripe',
    },
    pending_review: {
        title: 'Stripe is reviewing your details',
        body: "Thanks! Stripe is verifying your information, which usually takes a few minutes and occasionally a day or two. You can keep listing studio times in the meantime.",
        action: 'Review details on Stripe',
    },
    ready: {
        title: "You're ready to get paid",
        body: 'Payouts are set up. Earnings from bookings are sent to your bank account automatically.',
        action: 'View payouts in Stripe',
    },
};

/**
 * Host payout setup (Stripe Express). Also used as the page Stripe returns hosts to
 * (`returned`), and for refreshing an expired onboarding link (`refresh`).
 */
const PayoutSetup = ({ mode }) => {
    const { userName } = useStore();
    const location = useLocation();
    const { status, isLoading, isRedirecting, error, reload, startOnboarding, openDashboard } = usePayouts({ load: mode !== 'refresh' });

    // Stripe sends hosts here when an onboarding link has expired: get a fresh one and go back.
    useEffect(() => {
        if (mode === 'refresh') startOnboarding();
    }, [mode, startOnboarding]);

    const state = status?.state || 'not_started';
    const copy = COPY[state] || COPY.not_started;
    const isReady = state === 'ready';

    return (
        <Box sx={{ pb: 16 }}>
            <TopNavBar back={`/teachers/${userName}`} title="Payouts" />
            <Container maxWidth="sm" sx={{ pt: 4 }}>
                {mode === 'refresh' && !error ? (
                    <Stack alignItems="center" spacing={2} sx={{ py: 10 }} role="status">
                        <CircularProgress aria-label="Opening Stripe" />
                        <Typography color="text.secondary">Your Stripe link expired. Opening a fresh one…</Typography>
                    </Stack>
                ) : isLoading ? (
                    <Stack alignItems="center" spacing={2} sx={{ py: 10 }} role="status">
                        <CircularProgress aria-label="Checking your payout setup" />
                        <Typography color="text.secondary">Checking your payout setup…</Typography>
                    </Stack>
                ) : (
                    <Stack spacing={3}>
                        {mode === 'returned' && isReady && (
                            <Alert icon={<CheckCircleIcon />} severity="success" sx={{ borderRadius: '12px' }}>
                                All set! Guests can now book and pay for your studio times.
                            </Alert>
                        )}
                        {status?.mode === 'test' && (
                            <Alert severity="info" sx={{ borderRadius: '12px' }}>
                                Test mode: Stripe accepts test details here and no real money moves.
                            </Alert>
                        )}

                        <Box>
                            <Chip
                                label={isReady ? 'Payouts active' : state === 'pending_review' ? 'In review' : 'Not set up yet'}
                                color={isReady ? 'success' : 'default'}
                                sx={{ mb: 2, fontWeight: 700 }}
                            />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1.5 }}>
                                {copy.title}
                            </Typography>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{copy.body}</Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" role="alert" sx={{ borderRadius: '12px' }}
                                action={!status ? <Button color="inherit" size="small" onClick={reload}>Try again</Button> : undefined}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            variant="contained"
                            size="large"
                            onClick={isReady ? openDashboard : startOnboarding}
                            disabled={isRedirecting}
                            sx={{ py: 1.5, borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
                        >
                            {isRedirecting ? <CircularProgress size={22} color="inherit" aria-label="Opening Stripe" /> : copy.action}
                        </Button>

                        {isReady && (
                            <Button component={Link} to={`/teachers/${userName}`} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                Back to my studio
                            </Button>
                        )}

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                            <LockIcon fontSize="small" aria-hidden />
                            <Typography variant="caption">
                                Your identity and bank details go directly to Stripe. Studio Time never sees or stores them.
                            </Typography>
                        </Stack>
                        {location.pathname.startsWith('/payouts/return') && !isReady && (
                            <Typography variant="body2" color="text.secondary">
                                Closed Stripe before finishing? No problem: tap the button above to continue.
                            </Typography>
                        )}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default PayoutSetup;
