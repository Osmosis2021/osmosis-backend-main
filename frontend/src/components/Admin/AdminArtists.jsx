import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress, Container, Dialog, IconButton,
    Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useSession from '../../hooks/useSession';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../ui/feedback';
import { PremiumCard } from '../../ui/PremiumCard';
import PremiumEmptyState from '../../ui/PremiumEmptyState';
import { ImagePrepError, prepareImage } from '../../utils/prepareImage';

const EMPTY_FORM = { firstName: '', lastName: '', email: '', userName: '', description: '' };

const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        return false;
    }
};

/** Form to set up a new artist account (they claim it later). */
function NewArtistDialog({ open, onClose, onCreated }) {
    const axiosPrivate = useAxiosPrivate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [form, setForm] = useState(EMPTY_FORM);
    const [photo, setPhoto] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const pickPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            setPhoto(await prepareImage(file, { maxDimension: 1024 }));
        } catch (err) {
            setError(err instanceof ImagePrepError ? err.message : "We couldn't use that photo.");
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            const { data } = await axiosPrivate.post('admin/artists', { ...form, ...(photo && { profileImage: photo }) });
            setForm(EMPTY_FORM);
            setPhoto('');
            onCreated(data);
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't create the artist. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="sm" sx={{ zIndex: 200000 }}
            PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px' } }} aria-labelledby="new-artist-title">
            <Box component="form" onSubmit={submit} noValidate sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography id="new-artist-title" variant="h6" component="h2" sx={{ fontWeight: 800 }}>New artist</Typography>
                    <IconButton onClick={onClose} aria-label="Close" size="small"><CloseIcon /></IconButton>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Only add artists who've agreed to be on Studio Time. They'll get a link to claim the account,
                    set a password and set up payouts.
                </Typography>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={photo} alt="" sx={{ width: 64, height: 64 }} />
                        <Button component="label" variant="outlined" size="small" startIcon={<CameraAltIcon />} sx={{ textTransform: 'none', fontWeight: 700 }}>
                            {photo ? 'Change photo' : 'Add profile photo'}
                            <input hidden type="file" accept="image/*" onChange={pickPhoto} />
                        </Button>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="First name" value={form.firstName} onChange={update('firstName')} fullWidth required />
                        <TextField label="Last name" value={form.lastName} onChange={update('lastName')} fullWidth required />
                    </Stack>
                    <TextField label="Email" type="email" value={form.email} onChange={update('email')} fullWidth required
                        helperText="Where their claim link goes. They'll sign in with this." inputProps={{ autoCapitalize: 'none' }} />
                    <TextField label="Username" value={form.userName} onChange={update('userName')} fullWidth required
                        helperText={`Their profile link: getstudiotime.com/teachers/${form.userName || 'username'}. Their Instagram handle works well.`}
                        inputProps={{ autoCapitalize: 'none', autoCorrect: 'off' }} />
                    <TextField label="Bio (optional)" value={form.description} onChange={update('description')} fullWidth multiline minRows={3} />
                    {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}
                    <Button type="submit" variant="contained" disabled={isSaving} sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '12px', py: 1.5 }}>
                        {isSaving ? 'Creating…' : 'Create artist'}
                    </Button>
                </Stack>
            </Box>
        </Dialog>
    );
}

/** Studio Time team page: set up artists for outreach and hand their accounts over. */
export default function AdminArtists() {
    const axiosPrivate = useAxiosPrivate();
    const startSession = useSession();
    const { persist } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [artists, setArtists] = useState([]);
    const [status, setStatus] = useState('loading');
    const [isCreating, setIsCreating] = useState(false);
    const [busy, setBusy] = useState('');

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const { data } = await axiosPrivate.get('admin/artists');
            setArtists(data);
            setStatus('ready');
        } catch (err) {
            setStatus('error');
        }
    }, [axiosPrivate]);

    useEffect(() => { load(); }, [load]);

    const workOn = async (artist) => {
        setBusy(`act-${artist._id}`);
        try {
            const { data } = await axiosPrivate.post(`admin/artists/${artist._id}/act`);
            // Switch to the artist (the refresh cookie stays ours, so "Back to my account" restores us).
            startSession(data.user, { persist, actingAs: { ...data.actingAs, artistName: artist.firstName } });
            navigate(`/teachers/${artist.userName}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "We couldn't open that profile.");
            setBusy('');
        }
    };

    const invite = async (artist, sendEmail) => {
        setBusy(`${sendEmail ? 'email' : 'copy'}-${artist._id}`);
        try {
            const { data } = await axiosPrivate.post(`admin/artists/${artist._id}/invite`, { sendEmail });
            if (sendEmail) {
                toast.success(`Invite emailed to ${artist.email}.`);
            } else if (await copyToClipboard(data.link)) {
                toast.success('Claim link copied. Paste it in your DM.');
            } else {
                toast.info(data.link, { duration: 15000 });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "We couldn't make the claim link.");
        } finally {
            setBusy('');
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, md: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>Artist setup</Typography>
                    <Typography color="text.secondary">
                        Set up artists' profiles and studio times, then send them a link to claim their account.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '12px', whiteSpace: 'nowrap' }}>
                    New artist
                </Button>
            </Stack>

            <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
                <strong>How it works:</strong> create the artist → "Work on profile" to add their photo, bio and studio times →
                copy or email their claim link. Once they claim it, the account is theirs and only they can change it.
                Guests can book once the artist sets up payouts.
            </Alert>

            {status === 'loading' && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress aria-label="Loading artists" /></Box>}
            {status === 'error' && (
                <Alert severity="error" action={<Button color="inherit" onClick={load}>Try again</Button>} sx={{ borderRadius: '12px' }}>
                    We couldn't load the artists.
                </Alert>
            )}
            {status === 'ready' && artists.length === 0 && (
                <PremiumEmptyState title="No artists yet" subtitle="Set up your first artist to start filling the Explore page." actionLabel="New artist" onAction={() => setIsCreating(true)} />
            )}
            {status === 'ready' && artists.length > 0 && (
                <Stack spacing={1.5}>
                    {artists.map((artist) => (
                        <PremiumCard nohover key={artist._id} sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                                    <Avatar src={artist.profileImage?.url} alt="" sx={{ width: 48, height: 48 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 800 }} noWrap>
                                            <RouterLink to={`/teachers/${artist.userName}`} style={{ color: 'inherit' }}>
                                                {artist.firstName} {artist.lastName}
                                            </RouterLink>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" noWrap>@{artist.userName} · {artist.email}</Typography>
                                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.75 }}>
                                            <Chip size="small" label={artist.claimed ? 'Claimed' : 'Not claimed yet'} color={artist.claimed ? 'success' : 'default'} variant={artist.claimed ? 'filled' : 'outlined'} sx={{ fontWeight: 700 }} />
                                            <Chip size="small" variant="outlined" label={`${artist.listings} ${artist.listings === 1 ? 'studio time' : 'studio times'}`} />
                                            <Chip size="small" variant="outlined" label={artist.payoutsReady ? 'Taking bookings' : 'Payouts not set up'} color={artist.payoutsReady ? 'success' : 'default'} />
                                        </Stack>
                                    </Box>
                                </Stack>
                                {!artist.claimed && (
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, '& > *': { m: '0 !important' } }}>
                                        <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => workOn(artist)} disabled={Boolean(busy)}
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                                            Work on profile
                                        </Button>
                                        <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => invite(artist, false)} disabled={Boolean(busy)}
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                                            Copy claim link
                                        </Button>
                                        <Button size="small" variant="outlined" startIcon={<EmailOutlinedIcon />} onClick={() => invite(artist, true)} disabled={Boolean(busy)}
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                                            Email invite
                                        </Button>
                                    </Stack>
                                )}
                            </Stack>
                        </PremiumCard>
                    ))}
                </Stack>
            )}

            <NewArtistDialog
                open={isCreating}
                onClose={() => setIsCreating(false)}
                onCreated={(artist) => {
                    setIsCreating(false);
                    setArtists((prev) => [artist, ...prev]);
                    toast.success(`${artist.firstName} is set up. Tap "Work on profile" to add their studio times.`);
                }}
            />
        </Container>
    );
}
