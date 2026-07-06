import React, { useState, useEffect } from "react";
import {
    TextField,
    Container,
    Button,
    Typography,
    Box,
    Stack,
    CircularProgress,
    Alert
} from '@mui/material';
import { useNavigate, Link as LinkRouter } from 'react-router-dom';
import './ForgotPassword.css';
import useKeyboard from '../../../hooks/useKeyboard';
import axios from "../../../actions/axios";

const Forgot = () => {
    const navigate = useNavigate();
    const manageKeyboard = useKeyboard();

    const [email, setEmail] = useState('');
    const [stage, setStage] = useState('email'); // email, resetCode, newPassword, success
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    useEffect(() => {
        manageKeyboard('fieldGrid');
    }, [manageKeyboard]);

    const validateEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSendCode = async (e) => {
        if (e) e.preventDefault();
        if (!email || !validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.get(`email/sendResetCode/${email}`);
            if (response.data.result === 'Email not found') {
                setError('No account found with this email address.');
            } else if (response.data.success) {
                setSuccessMessage('Verification code sent to your email.');
                setStage('resetCode');
            } else {
                setError('Failed to send reset code. Please try again.');
            }
        } catch (err) {
            console.error('Error sending reset code:', err);
            setError('Something went wrong. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        if (e) e.preventDefault();
        if (!resetCode || resetCode.length !== 6) {
            setError('Please enter the 6-digit reset code.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.get(`email/verifyResetCode/${email}/${resetCode}`);
            if (response.data.result === 'Incorrect reset code') {
                setError('Incorrect reset code. Please try again.');
            } else if (response.data.result === 'success') {
                setStage('newPassword');
                setSuccessMessage('Code verified successfully. Enter your new password.');
            } else {
                setError('Verification failed. Please check the code.');
            }
        } catch (err) {
            console.error('Error verifying code:', err);
            setError('Error verifying reset code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        if (newPassword !== repeatPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.patch(`email/updatePassword/${email}/${resetCode}`, {
                email,
                password: newPassword,
                resetCode
            });

            if (response.data.result === 'success') {
                setStage('success');
                setSuccessMessage('');
            } else {
                setError('Password not updated. Please try again.');
            }
        } catch (err) {
            console.error('Error updating password:', err);
            setError('Failed to update password. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '85vh',
            bgcolor: 'background.default',
            justifyContent: 'center',
            alignItems: 'center',
            px: 3
        }}>
            <Container maxWidth="xs" sx={{ p: 0 }}>
                <Stack spacing={4} sx={{ bgcolor: 'background.paper', p: 4, borderRadius: '24px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.05)', animation: 'fadeIn 0.4s ease-out' }}>

                    {stage === 'email' && (
                        <Box component="form" onSubmit={handleSendCode}>
                            <Stack spacing={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1 }}>
                                        Forgot Password
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
                                        Enter your email and we'll send a 6-digit reset code.
                                    </Typography>
                                </Box>

                                {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

                                <TextField
                                    variant='outlined'
                                    label='Email Address'
                                    fullWidth
                                    type="email"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        if (error) setError('');
                                    }}
                                    inputProps={{ autoCapitalize: 'none' }}
                                    disabled={isLoading}
                                    required
                                />

                                <Button
                                    variant='contained'
                                    size='large'
                                    fullWidth
                                    type="submit"
                                    disabled={isLoading || !email || !validateEmail(email)}
                                    sx={{
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        height: '56px',
                                        borderRadius: '12px'
                                    }}
                                >
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Send Reset Code"}
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {stage === 'resetCode' && (
                        <Box component="form" onSubmit={handleVerifyCode}>
                            <Stack spacing={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1 }}>
                                        Enter Reset Code
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
                                        Enter the 6-digit code sent to <strong>{email}</strong>.
                                    </Typography>
                                </Box>

                                {successMessage && <Alert severity="success" sx={{ borderRadius: '12px' }}>{successMessage}</Alert>}
                                {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

                                <TextField
                                    variant='outlined'
                                    label='6-Digit Reset Code'
                                    fullWidth
                                    value={resetCode}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        if (val.length <= 6) {
                                            setResetCode(val);
                                        }
                                    }}
                                    inputProps={{
                                        style: { textAlign: 'center', fontSize: '20px', letterSpacing: '4px', fontWeight: 'bold' },
                                        maxLength: 6,
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*'
                                    }}
                                    disabled={isLoading}
                                    placeholder="000000"
                                    required
                                />

                                <Button
                                    variant='contained'
                                    size='large'
                                    fullWidth
                                    type="submit"
                                    disabled={isLoading || resetCode.length !== 6}
                                    sx={{
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        height: '56px',
                                        borderRadius: '12px'
                                    }}
                                >
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {stage === 'newPassword' && (
                        <Box component="form" onSubmit={handleResetPassword}>
                            <Stack spacing={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1 }}>
                                        Set New Password
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
                                        Choose a secure password (minimum 8 characters).
                                    </Typography>
                                </Box>

                                {successMessage && <Alert severity="success" sx={{ borderRadius: '12px' }}>{successMessage}</Alert>}
                                {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

                                <TextField
                                    variant='outlined'
                                    label='New Password'
                                    type="password"
                                    fullWidth
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />

                                <TextField
                                    variant='outlined'
                                    label='Repeat New Password'
                                    type="password"
                                    fullWidth
                                    value={repeatPassword}
                                    onChange={e => repeatPassword !== e.target.value ? setRepeatPassword(e.target.value) : setRepeatPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />

                                <Button
                                    variant='contained'
                                    size='large'
                                    fullWidth
                                    type="submit"
                                    disabled={isLoading || !newPassword || !repeatPassword}
                                    sx={{
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        height: '56px',
                                        borderRadius: '12px'
                                    }}
                                >
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {stage === 'success' && (
                        <Stack spacing={3} sx={{ textAlign: 'center' }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1, color: 'success.main' }}>
                                    Password Reset Complete
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
                                    Your password has been successfully updated. You can now log in with your new password.
                                </Typography>
                            </Box>

                            <Button
                                variant='contained'
                                size='large'
                                fullWidth
                                onClick={() => navigate('/')}
                                sx={{
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    height: '56px',
                                    borderRadius: '12px'
                                }}
                            >
                                Back to Login
                            </Button>
                        </Stack>
                    )}

                    {stage !== 'success' && (
                        <Box sx={{ textAlign: 'center' }}>
                            <LinkRouter to="/" style={{ textDecoration: 'none' }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { color: 'primary.main' },
                                        textDecoration: 'underline',
                                        fontFamily: 'Inter',
                                        fontWeight: 500
                                    }}
                                >
                                    Back to login
                                </Typography>
                            </LinkRouter>
                        </Box>
                    )}
                </Stack>
            </Container>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </Box>
    );
};

export default Forgot;
