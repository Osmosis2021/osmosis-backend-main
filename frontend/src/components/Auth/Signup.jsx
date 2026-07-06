import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as LinkRouter } from "react-router-dom";
import {
    Container,
    Typography,
    TextField,
    Grid,
    Button,
    CircularProgress,
    Box,
    Stack,
    IconButton,
    InputAdornment,
    Snackbar,
    Alert
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BrushIcon from '@mui/icons-material/Brush';
import EventIcon from '@mui/icons-material/Event';
import './Signup.css';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from "../../store";
import useKeyboard from '../../hooks/useKeyboard';
import useAuth from '../../hooks/useAuth';

const Signup = props => {
    const { backendURL, setFirstName, setLastName, setUserName, setIsTeacher, setIsStudent } = useStore();
    const { setAuth, setPersist } = useAuth();
    const navigate = useNavigate();
    const manageKeyboard = useKeyboard();

    // Route-based pre-selection logic
    const initialRole = props.isTeacher ? 'artist' : props.isStudent ? 'guest' : '';

    const [tempFirstName, setTempFirstName] = useState('');
    const [tempLastName, setTempLastName] = useState('');
    const [tempUserName, setTempUserName] = useState('');
    const [tempEmail, setTempEmail] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [repeatedTempPassword, setRepeatedTempPassword] = useState('');
    const [showRepeatedPassword, setShowRepeatedPassword] = useState(false);
    const [role, setRole] = useState(initialRole); // artist or guest
    const [isLoading, setIsLoading] = useState(false);

    // Validation feedback states
    const [usernameError, setUsernameError] = useState('');
    const [usernameSuccess, setUsernameSuccess] = useState('');

    // Toast Feedback state
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const showToast = useCallback((message, severity = 'success') => {
        setToast({ open: true, message, severity });
    }, []);

    const handleGoogleSignupResponse = useCallback(async (response) => {
        if (!role) {
            showToast("Please select if you are an Artist or a Guest before continuing.", "warning");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${backendURL}user/google-login`, {
                body: JSON.stringify({
                    credential: response.credential,
                    role: role
                }),
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const userDoc = await res.json();

            if (userDoc._id) {
                localStorage.setItem("persist", true);
                setPersist(true);
                const accessToken = userDoc?.accessToken;
                const roles = userDoc?.roles;
                setAuth({ userName: userDoc.userName, accessToken, roles, isEmailVerified: userDoc.isEmailVerified });

                setFirstName(userDoc.firstName);
                setLastName(userDoc.lastName);
                setUserName(userDoc.userName);
                setIsTeacher(userDoc.isTeacher);
                setIsStudent(userDoc.isStudent);

                showToast('Successfully registered and logged in!', 'success');

                setTimeout(() => {
                    if (userDoc.isTeacher) {
                        navigate(`/teachers/${userDoc.userName}`);
                    } else {
                        navigate('/explore');
                    }
                }, 1500);
            } else {
                setIsLoading(false);
                showToast(userDoc.message || 'Google registration failed.', 'error');
            }
        } catch (error) {
            showToast('Registration failed, please try again later', 'error');
            console.error('Error registering user via Google:\n', error);
            setIsLoading(false);
        }
    }, [role, backendURL, setPersist, setAuth, setFirstName, setLastName, setUserName, setIsTeacher, setIsStudent, navigate, showToast]);

    useEffect(() => {
        let googleBtnTimeout;
        const initGoogleSignupBtn = () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    process.env.GOOGLE_CLIENT_ID: '812674900898-fakeclientid.apps.googleusercontent.com',
                    callback: handleGoogleSignupResponse
                });
                const btnElem = document.getElementById("googleSignupBtn");
                if (btnElem) {
                    window.google.accounts.id.renderButton(
                        btnElem,
                        { theme: "outline", size: "large", width: "100%", text: "signup_with" }
                    );
                }
            } else {
                googleBtnTimeout = setTimeout(initGoogleSignupBtn, 200);
            }
        };
        if (!isLoading) {
            googleBtnTimeout = setTimeout(initGoogleSignupBtn, 100);
        }
        return () => clearTimeout(googleBtnTimeout);
    }, [isLoading, role, handleGoogleSignupResponse]);

    useEffect(() => {
        manageKeyboard('fieldGrid'); // consistent with Opening.jsx
    }, [manageKeyboard]);

    const changeFirstName = e => setTempFirstName(e.target.value);
    const changeLastName = e => setTempLastName(e.target.value);

    const changeUserName = e => {
        const newName = e.target.value;
        setTempUserName(newName);

        if (newName.length === 0) {
            setUsernameError('');
            setUsernameSuccess('');
            return;
        }

        if (newName.length < 5) {
            setUsernameError('Username must be at least 5 characters.');
            setUsernameSuccess('');
            return;
        }

        setUsernameError('');
        setUsernameSuccess('');

        fetch(`${backendURL}user/isUserNameUnique/${newName}`)
            .then(res => res.json())
            .then(data => {
                if (data.isAvailable) {
                    setUsernameSuccess('Username is available!');
                    setUsernameError('');
                } else {
                    setUsernameError('Username is already taken.');
                    setUsernameSuccess('');
                }
            })
            .catch(err => {
                console.error('Error checking if username is unique:\n', err);
            });
    };

    const changeEmail = e => setTempEmail(e.target.value);
    const changePassword = e => setTempPassword(e.target.value);
    const changeRepeatedPassword = e => setRepeatedTempPassword(e.target.value);

    const handleUserRegistration = async (e) => {
        e.preventDefault();

        if (!role) {
            showToast("Please select if you are an Artist or a Guest.", "warning");
            return;
        }

        if (tempPassword !== repeatedTempPassword) {
            showToast("Passwords do not match. Please verify.", "error");
            return;
        }

        if (usernameError) {
            showToast("Please select an available username.", "error");
            return;
        }

        const userObj = {
            firstName: tempFirstName,
            lastName: tempLastName,
            userName: tempUserName,
            email: tempEmail,
            password: tempPassword,
            isTeacher: role === 'artist',
            isStudent: role === 'guest'
        };

        setIsLoading(true);
        try {
            const response = await fetch(`${backendURL}user/registerUser`, {
                body: JSON.stringify(userObj),
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (data?.message?.startsWith('Unsuccessful')) {
                setIsLoading(false);
                showToast(data.message, "error");
                return;
            }

            setFirstName(userObj.firstName);
            setLastName(userObj.lastName);
            setUserName(userObj.userName);
            setIsTeacher(userObj.isTeacher);
            setIsStudent(userObj.isStudent);

            setIsLoading(false);
            showToast('Successfully registered! Redirecting to login...', 'success');

            setTimeout(() => {
                navigate('/');
            }, 1800);
        } catch (error) {
            showToast('Registration failed, please try again later', 'error');
            console.error('Error registering user:\n', error);
            setIsLoading(false);
        }
    };

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
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: "center", alignItems: 'center', height: '300px' }}>
                            <CircularProgress color="primary" />
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleUserRegistration} id="fieldGrid">
                            <Stack spacing={3}>
                                <Box sx={{ textAlign: 'center', mb: 1 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontFamily: 'Outfit' }}>
                                        Join Studio Time
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Create your account to start booking experiences
                                    </Typography>
                                </Box>

                                {/* Modern Graphic Role Selection Cards */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                                        How will you use Studio Time?
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Box
                                                onClick={() => setRole('artist')}
                                                sx={{
                                                    p: 2,
                                                    border: '2px solid',
                                                    borderColor: role === 'artist' ? 'primary.main' : 'divider',
                                                    borderRadius: '16px',
                                                    bgcolor: role === 'artist' ? 'rgba(10, 10, 10, 0.04)' : 'background.paper',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        borderColor: role === 'artist' ? 'primary.main' : 'text.disabled',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                                    }
                                                }}
                                            >
                                                <BrushIcon sx={{ fontSize: 28, color: role === 'artist' ? 'primary.main' : 'text.secondary', mb: 1 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, display: 'block', fontSize: '0.9rem' }}>
                                                    Artist
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2, fontSize: '0.7rem' }}>
                                                    Host creative studio experiences
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box
                                                onClick={() => setRole('guest')}
                                                sx={{
                                                    p: 2,
                                                    border: '2px solid',
                                                    borderColor: role === 'guest' ? 'primary.main' : 'divider',
                                                    borderRadius: '16px',
                                                    bgcolor: role === 'guest' ? 'rgba(10, 10, 10, 0.04)' : 'background.paper',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        borderColor: role === 'guest' ? 'primary.main' : 'text.disabled',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                                    }
                                                }}
                                            >
                                                <EventIcon sx={{ fontSize: 28, color: role === 'guest' ? 'primary.main' : 'text.secondary', mb: 1 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, display: 'block', fontSize: '0.9rem' }}>
                                                    Guest
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2, fontSize: '0.7rem' }}>
                                                    Explore & book art sessions
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Form Fields */}
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="First Name"
                                        placeholder="Enter first name"
                                        fullWidth
                                        value={tempFirstName}
                                        onChange={changeFirstName}
                                        required
                                    />
                                    <TextField
                                        label="Last Name"
                                        placeholder="Enter last name"
                                        fullWidth
                                        value={tempLastName}
                                        onChange={changeLastName}
                                        required
                                    />
                                </Stack>

                                <TextField
                                    id="userNameInput"
                                    label="Username"
                                    placeholder="Choose username"
                                    fullWidth
                                    value={tempUserName}
                                    onChange={changeUserName}
                                    required
                                    inputProps={{ autoCapitalize: 'none' }}
                                    error={!!usernameError}
                                    helperText={usernameError || usernameSuccess}
                                    FormHelperTextProps={{
                                        sx: {
                                            color: usernameSuccess ? 'success.main' : usernameError ? 'error.main' : 'inherit',
                                            fontWeight: usernameSuccess || usernameError ? 600 : 400
                                        }
                                    }}
                                />

                                <TextField
                                    label="Email Address"
                                    placeholder="Enter your email"
                                    fullWidth
                                    value={tempEmail}
                                    onChange={changeEmail}
                                    required
                                    type="email"
                                    inputProps={{ autoCapitalize: 'none' }}
                                />

                                <Stack spacing={2}>
                                    <TextField
                                        label="Password"
                                        placeholder="Min 6 characters"
                                        fullWidth
                                        type={showPassword ? "text" : "password"}
                                        value={tempPassword}
                                        onChange={changePassword}
                                        required
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} size="small" edge="end">
                                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    <TextField
                                        label="Repeat Password"
                                        placeholder="Confirm your password"
                                        fullWidth
                                        type={showRepeatedPassword ? "text" : "password"}
                                        value={repeatedTempPassword}
                                        onChange={changeRepeatedPassword}
                                        required
                                        error={repeatedTempPassword !== "" && repeatedTempPassword !== tempPassword}
                                        helperText={repeatedTempPassword !== "" && repeatedTempPassword !== tempPassword ? "Passwords do not match." : ""}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowRepeatedPassword(!showRepeatedPassword)} size="small" edge="end">
                                                        {showRepeatedPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Stack>

                                {/* Actions */}
                                <Box sx={{ pt: 1 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        sx={{ py: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '1rem', borderRadius: '12px' }}
                                    >
                                        Create Account
                                    </Button>

                                    {/* Google Sign-Up */}
                                    <Box sx={{ my: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">or</Typography>
                                    </Box>
                                    <div id="googleSignupBtn" style={{ width: '100%', minHeight: '40px', marginBottom: '8px' }}></div>

                                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                                            By signing up, you agree to our{' '}
                                            <LinkRouter to='/termsofservice' style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</LinkRouter>
                                            {' '}and{' '}
                                            <LinkRouter to='/privacy' style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</LinkRouter>.
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            Already have an account?{' '}
                                            <LinkRouter to='/' style={{ color: '#0A0A0A', fontWeight: 700, textDecoration: 'none' }}>
                                                Log In
                                            </LinkRouter>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Container>
            </Box>

            {/* Snackbar feedback */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ ...toast, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast({ ...toast, open: false })}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: '12px', fontWeight: 600, boxShadow: 3 }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Signup;
