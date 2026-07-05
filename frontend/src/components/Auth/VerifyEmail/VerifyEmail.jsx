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
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import useLogout from '../../../hooks/useLogout';
import useStore from "../../../store";
import axios from "../../../actions/axios";

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const logout = useLogout();
    const { auth, setAuth } = useAuth();
    const { email } = useStore();

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const userEmail = email || auth?.email || '';

    useEffect(() => {
        if (auth?.isEmailVerified) {
            const from = location.state?.from?.pathname || '/explore';
            navigate(from, { replace: true });
        }
    }, [auth, navigate, location]);

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        if (!code || code.length !== 6) {
            setError('Please enter a 6-digit verification code.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('user/verify-email', {
                email: userEmail,
                code: code
            });

            if (response.data.success) {
                setSuccess('Email verified successfully! Redirecting...');
                setAuth(prev => ({ ...prev, isEmailVerified: true }));
                
                setTimeout(() => {
                    const from = location.state?.from?.pathname || '/explore';
                    navigate(from, { replace: true });
                }, 1500);
            } else {
                setError(response.data.message || 'Verification failed. Please check the code.');
            }
        } catch (err) {
            console.error('Error verifying email:', err);
            setError(err.response?.data?.message || 'Something went wrong. Please check your code and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('user/resend-verification', {
                email: userEmail
            });

            if (response.data.success) {
                setSuccess('A new verification code has been sent to your email.');
            } else {
                setError(response.data.message || 'Failed to resend verification code.');
            }
        } catch (err) {
            console.error('Error resending code:', err);
            setError(err.response?.data?.message || 'Failed to resend code. Please try again later.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            bgcolor: 'background.default',
            px: 3
        }}>
            <Container maxWidth="xs" sx={{ p: 0 }}>
                <Stack spacing={4} sx={{ textAlign: 'center', bgcolor: 'background.paper', p: 4, borderRadius: '24px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.05)' }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1 }}>
                            Verify your email
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
                            We sent a 6-digit verification code to
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main', fontFamily: 'Inter' }}>
                            {userEmail}
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ textAlign: 'left', borderRadius: '12px' }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ textAlign: 'left', borderRadius: '12px' }}>{success}</Alert>}

                    <Box component="form" onSubmit={handleVerify}>
                        <Stack spacing={3}>
                            <TextField
                                variant='outlined'
                                label='6-Digit Verification Code'
                                fullWidth
                                value={code}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    if (val.length <= 6) {
                                        setCode(val);
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
                                disabled={isLoading || code.length !== 6}
                                sx={{
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    height: '56px',
                                    borderRadius: '12px'
                                }}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Verify Account"}
                            </Button>
                        </Stack>
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
                        <Button
                            variant="text"
                            onClick={handleResend}
                            disabled={isResending || isLoading}
                            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                        >
                            {isResending ? "Resending..." : "Resend Code"}
                        </Button>
                        
                        <Button
                            variant="text"
                            onClick={() => logout('/')}
                            sx={{ textTransform: 'none', fontWeight: 600, color: 'error.main' }}
                        >
                            Sign Out
                        </Button>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default VerifyEmail;
