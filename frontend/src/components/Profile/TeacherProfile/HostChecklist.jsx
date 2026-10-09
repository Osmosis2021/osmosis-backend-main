import React from 'react';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import IosShareIcon from '@mui/icons-material/IosShare';
import { Link } from 'react-router-dom';
import { PremiumCard } from '../../../ui/PremiumCard';
import { useToast } from '../../../ui/feedback';

/**
 * First-run guide on an artist's own profile: the few things needed before guests can book.
 * Disappears into a small "share your studio" card once everything is done.
 */
const HostChecklist = ({ host, listingCount, payoutsReady }) => {
    const toast = useToast();
    const profileUrl = `${window.location.origin}/teachers/${host.userName}`;

    const steps = [
        { key: 'photo', label: 'Add a profile photo', why: 'Guests book people they can picture.', done: Boolean(host.profileImage?.url), to: '/edit', action: 'Add photo' },
        { key: 'bio', label: 'Write a short bio', why: 'A few lines about you and your craft.', done: Boolean(host.description?.trim()), to: '/edit', action: 'Write bio' },
        { key: 'payouts', label: 'Set up payouts', why: "Guests can't book until Stripe knows where to pay you.", done: payoutsReady, to: '/payouts', action: 'Set up' },
        { key: 'listing', label: 'List your first studio time', why: 'Pick a template, set a price and add dates.', done: listingCount > 0, to: '/flow', action: 'Start' },
    ];
    const doneCount = steps.filter((s) => s.done).length;
    const allDone = doneCount === steps.length;

    const share = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: `${host.firstName}'s studio on Studio Time`, url: profileUrl });
                return;
            } catch (err) {
                if (err?.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(profileUrl);
            toast.success('Link copied. Paste it in your Instagram bio or stories!');
        } catch (err) {
            toast.info(profileUrl, { duration: 10000 });
        }
    };

    if (allDone) {
        return (
            <PremiumCard sx={{ mb: 6, p: { xs: 2.5, sm: 3 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                    <Box>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>Your studio is ready for guests</Typography>
                        <Typography variant="body2" color="text.secondary">Share your page so your followers can book.</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<IosShareIcon />} onClick={share} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                        Share my studio
                    </Button>
                </Stack>
            </PremiumCard>
        );
    }

    return (
        <PremiumCard sx={{ mb: 6, p: { xs: 2.5, sm: 3 } }} aria-labelledby="host-checklist-title">
            <Typography id="host-checklist-title" variant="h6" component="h2" sx={{ fontWeight: 800 }}>Get ready to host</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {doneCount} of {steps.length} done. Finish these and guests can start booking you.
            </Typography>
            <LinearProgress variant="determinate" value={(doneCount / steps.length) * 100} sx={{ mb: 2.5, height: 6, borderRadius: 3 }} aria-hidden />
            <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {steps.map((step) => (
                    <Stack component="li" key={step.key} direction="row" spacing={1.5} alignItems="center">
                        {step.done
                            ? <CheckCircleIcon color="success" aria-hidden />
                            : <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} aria-hidden />}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, textDecoration: step.done ? 'line-through' : 'none', color: step.done ? 'text.secondary' : 'text.primary' }}>
                                {step.label}
                                <Box component="span" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                                    {step.done ? ' (done)' : ' (to do)'}
                                </Box>
                            </Typography>
                            {!step.done && <Typography variant="body2" color="text.secondary">{step.why}</Typography>}
                        </Box>
                        {!step.done && (
                            <Button component={Link} to={step.to} size="small" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', flexShrink: 0 }}>
                                {step.action}
                            </Button>
                        )}
                    </Stack>
                ))}
            </Stack>
        </PremiumCard>
    );
};

export default HostChecklist;
