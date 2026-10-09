import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link as LinkRouter } from "react-router-dom";
import {
    Alert,
    Container,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Box,
    Stack,
    IconButton,
    InputAdornment,
    Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import './Signup.css';
import TopNavBar from '../TopNavBar/TopNavBar';
import useKeyboard from '../../hooks/useKeyboard';
import useSession, { getLandingPath } from '../../hooks/useSession';
import useGoogleSignIn from '../../hooks/useGoogleSignIn';
import { getAuthErrorMessage } from '../../utils/authErrors';
import axios from '../../actions/axios';
import RoleOptions from './RoleOptions';
import RolePickerDialog from './RolePickerDialog';
import GoogleSignInButton, { useGoogleSignInAvailable } from './GoogleSignInButton';

const MIN_USERNAME_LENGTH = 5;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['artist', 'guest'];

/**
 * Account creation. The role can be pre-selected with `initialRole` or `?role=artist|guest`
 * (handy for links in Instagram bios); otherwise the person chooses.
 */
const Signup = ({ initialRole }) => {
    const navigate = useNavigate();
    const manageKeyboard = useKeyboard();
    const startSession = useSession();
    const [searchParams] = useSearchParams();
    const roleFromLink = searchParams.get('role');

    const [role, setRole] = useState(VALID_ROLES.includes(roleFromLink) ? roleFromLink : (initialRole || ''));
    const [form, setForm] = useState({ firstName: '', lastName: '', userName: '', email: '', password: '', repeatPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' }); // idle | checking | available | taken | error
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const latestUsernameCheck = useRef('');

    const google = useGoogleSignIn({ role: role || undefined });
    const isGoogleAvailable = useGoogleSignInAvailable();

    useEffect(() => {
        manageKeyboard('fieldGrid'); // consistent with Opening.jsx
    }, [manageKeyboard]);

    // Debounced username availability check; ignores responses for names the user has since changed.
    useEffect(() => {
        const name = form.userName.trim();
        if (name.length < MIN_USERNAME_LENGTH) {
            setUsernameStatus({ state: 'idle', message: '' });
            return undefined;
        }
        setUsernameStatus({ state: 'checking', message: 'Checking availability…' });
        latestUsernameCheck.current = name;
        const timer = setTimeout(async () => {
            try {
                const { data } = await axios.get(`user/isUserNameUnique/${encodeURIComponent(name)}`);
                if (latestUsernameCheck.current !== name) return;
                setUsernameStatus(data.isAvailable
                    ? { state: 'available', message: 'Username is available!' }
                    : { state: 'taken', message: 'That username is already taken.' });
            } catch (err) {
                if (latestUsernameCheck.current === name) setUsernameStatus({ state: 'error', message: '' });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [form.userName]);

    const errors = {
        role: !role ? 'Choose Artist or Guest.' : '',
        firstName: !form.firstName.trim() ? 'Enter your first name.' : '',
        lastName: !form.lastName.trim() ? 'Enter your last name.' : '',
        userName: !form.userName.trim()
            ? 'Choose a username.'
            : form.userName.trim().length < MIN_USERNAME_LENGTH
                ? `Usernames need at least ${MIN_USERNAME_LENGTH} characters.`
                : usernameStatus.state === 'taken' ? usernameStatus.message : '',
        email: !EMAIL_PATTERN.test(form.email.trim()) ? 'Enter a valid email address.' : '',
        password: form.password.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : '',
        repeatPassword: form.repeatPassword !== form.password ? 'Passwords do not match.' : '',
    };
    const showError = (field) => (touched[field] || submitAttempted) && errors[field];

    const handleChange = (field) => (event) => setForm(prev => ({ ...prev, [field]: event.target.value }));
    const handleBlur = (field) => () => setTouched(prev => ({ ...prev, [field]: true }));

    const handleUserRegistration = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true);
        setSubmitError('');
        google.setError('');

        const firstInvalid = Object.keys(errors).find(field => errors[field]);
        if (firstInvalid) {
            document.getElementById(firstInvalid === 'role' ? `role-option-${role || 'artist'}` : `signup-${firstInvalid}`)?.focus();
            return;
        }
        if (usernameStatus.state === 'checking') {
            setSubmitError('Still checking your username. Try again in a second.');
            return;
        }

        const userObj = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            userName: form.userName.trim(),
            email: form.email.trim(),
            password: form.password,
            isTeacher: role === 'artist',
            isStudent: role === 'guest'
        };

        setIsLoading(true);
        try {
            const { data } = await axios.post('user/registerUser', userObj);
            if (data?.success === false || data?.message?.startsWith('Unsuccessful')) {
                setSubmitError((data?.message || 'Registration failed, please try again.').replace(/^Unsuccessful\.\s*/, ''));
                setIsLoading(false);
                return;
            }

            // Sign straight in so the next screen is "check your email", not the login form.
            const { data: user } = await axios.post('user/login', { email: userObj.email, password: userObj.password, persist: true });
            startSession(user);
            navigate(getLandingPath(user), { replace: true });
        } catch (error) {
            console.error('Error registering user:\n', error);
            setSubmitError(getAuthErrorMessage(error, 'Registration failed, please try again.'));
            setIsLoading(false);
        }
    };

    const visibleError = submitError || google.error;
    const isBusy = isLoading || google.isSubmitting;

    const passwordAdornment = (
        <InputAdornment position="end">
            <IconButton
                onClick={() => setShowPassword(!showPassword)}
                size="small"
                edge="end"
                aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
            >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
        </InputAdornment>
    );

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: 'background.default'
        }}>
            <TopNavBar back='/' title="Create Account" />

            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 3,
                py: 4
            }}>
                <Container maxWidth="xs" sx={{ p: 0 }}>
                    <Box component="form" onSubmit={handleUserRegistration} id="fieldGrid" noValidate>
                        <Stack spacing={3}>
                            <Box sx={{ textAlign: 'center', mb: 1 }}>
                                <Typography component="h1" variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontFamily: 'Outfit' }}>
                                    Join Studio Time
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Book time inside real artists' studios, or host your own.
                                </Typography>
                            </Box>

                            {visibleError && (
                                <Alert severity="error" role="alert" sx={{ borderRadius: '12px' }}>
                                    {visibleError}
                                </Alert>
                            )}

                            <RoleOptions value={role} onChange={setRole} error={submitAttempted ? errors.role : ''} />

                            {/* Fastest path, especially on phones */}
                            {isGoogleAvailable && (
                                <>
                                    <Box>
                                        <GoogleSignInButton onCredential={google.handleCredential} text="signup_with" />
                                        {google.isSubmitting && !google.rolePrompt.open && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }} role="status">
                                                <CircularProgress size={22} aria-label="Signing up with Google" />
                                            </Box>
                                        )}
                                    </Box>
                                    <Divider sx={{ color: 'text.secondary', typography: 'body2' }}>or sign up with email</Divider>
                                </>
                            )}

                            {/* Form Fields */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    id="signup-firstName"
                                    label="First name"
                                    autoComplete="given-name"
                                    fullWidth
                                    value={form.firstName}
                                    onChange={handleChange('firstName')}
                                    onBlur={handleBlur('firstName')}
                                    error={Boolean(showError('firstName'))}
                                    helperText={showError('firstName') || ' '}
                                    disabled={isBusy}
                                    required
                                />
                                <TextField
                                    id="signup-lastName"
                                    label="Last name"
                                    autoComplete="family-name"
                                    fullWidth
                                    value={form.lastName}
                                    onChange={handleChange('lastName')}
                                    onBlur={handleBlur('lastName')}
                                    error={Boolean(showError('lastName'))}
                                    helperText={showError('lastName') || ' '}
                                    disabled={isBusy}
                                    required
                                />
                            </Stack>

                            <TextField
                                id="signup-userName"
                                label="Username"
                                autoComplete="username"
                                fullWidth
                                value={form.userName}
                                onChange={handleChange('userName')}
                                onBlur={handleBlur('userName')}
                                required
                                disabled={isBusy}
                                inputProps={{ autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false }}
                                error={Boolean(showError('userName')) || usernameStatus.state === 'taken'}
                                helperText={
                                    showError('userName')
                                    || (['checking', 'available'].includes(usernameStatus.state) ? usernameStatus.message : 'This is your public profile link.')
                                }
                                FormHelperTextProps={{
                                    sx: { color: usernameStatus.state === 'available' && !showError('userName') ? 'success.main' : undefined },
                                    'aria-live': 'polite',
                                }}
                            />

                            <TextField
                                id="signup-email"
                                label="Email address"
                                autoComplete="email"
                                fullWidth
                                value={form.email}
                                onChange={handleChange('email')}
                                onBlur={handleBlur('email')}
                                required
                                type="email"
                                disabled={isBusy}
                                inputProps={{ autoCapitalize: 'none', autoCorrect: 'off' }}
                                error={Boolean(showError('email'))}
                                helperText={showError('email') || "We'll send you a code to confirm it."}
                            />

                            <TextField
                                id="signup-password"
                                label="Password"
                                autoComplete="new-password"
                                fullWidth
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                onChange={handleChange('password')}
                                onBlur={handleBlur('password')}
                                required
                                disabled={isBusy}
                                error={Boolean(showError('password'))}
                                helperText={showError('password') || `At least ${MIN_PASSWORD_LENGTH} characters.`}
                                InputProps={{ endAdornment: passwordAdornment }}
                            />
                            <TextField
                                id="signup-repeatPassword"
                                label="Confirm password"
                                autoComplete="new-password"
                                fullWidth
                                type={showPassword ? "text" : "password"}
                                value={form.repeatPassword}
                                onChange={handleChange('repeatPassword')}
                                onBlur={handleBlur('repeatPassword')}
                                required
                                disabled={isBusy}
                                error={Boolean(showError('repeatPassword'))}
                                helperText={showError('repeatPassword') || ' '}
                            />

                            {/* Actions */}
                            <Box>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={isBusy}
                                    sx={{ py: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '1rem', borderRadius: '12px' }}
                                >
                                    {isLoading ? <CircularProgress size={22} color="inherit" aria-label="Creating your account" /> : 'Create account'}
                                </Button>

                                <Box sx={{ mt: 3, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                                        By signing up, you agree to our{' '}
                                        <LinkRouter to='/termsofservice' style={{ color: '#0A0A0A', fontWeight: 600 }}>Terms of Service</LinkRouter>
                                        {' '}and{' '}
                                        <LinkRouter to='/privacy' style={{ color: '#0A0A0A', fontWeight: 600 }}>Privacy Policy</LinkRouter>.
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        Already have an account?{' '}
                                        <LinkRouter to='/' style={{ color: '#0A0A0A', fontWeight: 700 }}>
                                            Log in
                                        </LinkRouter>
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            <RolePickerDialog
                open={google.rolePrompt.open}
                firstName={google.rolePrompt.firstName}
                isSubmitting={google.isSubmitting}
                onConfirm={google.confirmRole}
                onCancel={google.cancelRole}
            />
        </Box>
    );
};

export default Signup;
