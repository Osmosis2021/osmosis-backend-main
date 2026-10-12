import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../../actions/axios';
import useSession from '../../hooks/useSession';
import { useToast } from '../../ui/feedback';

const MIN_PASSWORD_LENGTH = 6;

// Only follow links back into the app (never to another site).
const safeNextPath = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null);

/**
 * Where a guest who booked with just name + email lands from their confirmation email.
 * They set a password, which finishes their account and signs them in.
 */
export default function ClaimAccount() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const next = safeNextPath(searchParams.get('next'));
    const navigate = useNavigate();
    const startSession = useSession();
    const toast = useToast();

    const [status, setStatus] = useState('loading'); // loading | ready | invalid
    const [account, setAccount] = useState(null);
    const [problem, setProblem] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!token) {
            setProblem("This link is missing something. Open it again from your booking confirmation email.");
            setStatus('invalid');
            return;
        }
        axios.get('user/claim-account', { params: { token } })
            .then(({ data }) => {
                setAccount(data);
                setStatus('ready');
            })
            .catch((err) => {
                setProblem(err.response?.data?.message || "We couldn't open this link. Check your connection and try again.");
                setStatus('invalid');
            });
    }, [token]);

    const submit = async (e) => {
        e.preventDefault();
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Please use at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            const { data } = await axios.post('user/claim-account', { token, password }, { withCredentials: true });
            startSession(data, { persist: true });
            toast.success("You're all set. Welcome to Studio Time!");
            navigate(next || `/students/${data.userName}`, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't save your password. Please try again.");
            setIsSaving(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 }, px: 2 }}>
            {status === 'loading' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress aria-label="Loading" />
                </Box>
            )}

            {status === 'invalid' && (
                <Stack spacing={3}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>Set your password</Typography>
                    <Alert severity="warning" sx={{ borderRadius: '12px' }}>{problem}</Alert>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button component={RouterLink} to="/" variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                            Log in
                        </Button>
                        <Button component={RouterLink} to="/forgot" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                            Forgot password
                        </Button>
                    </Stack>
                </Stack>
            )}

            {status === 'ready' && (
                <Box component="form" onSubmit={submit} noValidate>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
                                Welcome{account?.firstName ? `, ${account.firstName}` : ''}!
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Set a password to see your bookings, message artists and leave reviews.
                            </Typography>
                        </Box>
                        <TextField label="Email" value={account?.email || ''} InputProps={{ readOnly: true }} fullWidth />
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            autoFocus
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                            error={Boolean(error)}
                            helperText={error || `At least ${MIN_PASSWORD_LENGTH} characters.`}
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button type="submit" variant="contained" size="large" disabled={isSaving}
                            sx={{ py: 1.5, textTransform: 'none', fontWeight: 800, borderRadius: '12px' }}>
                            {isSaving ? 'Saving…' : 'Set password and continue'}
                        </Button>
                    </Stack>
                </Box>
            )}
        </Container>
    );
}
