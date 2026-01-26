import React, { useState, useEffect } from "react";
import {
    TextField,
    Container,
    Button,
    Typography,
    Box,
    Stack,
    CircularProgress,
    Link as MuiLink
} from '@mui/material';
import { useNavigate, Link as LinkRouter } from 'react-router-dom';
import TopNavBar from '../../TopNavBar/TopNavBar';
import logo from '../../../assets/studio_time_logo.png'
import './ForgotPassword.css'
import useStore from "../../../store"
import useKeyboard from '../../../hooks/useKeyboard'

const Forgot = () => {
    const navigate = useNavigate()
    const manageKeyboard = useKeyboard()
    const [email, setEmail] = useState('')
    const [stage, setStage] = useState('email') // email, success, resetCode, newPassword
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Hidden fields for existing multi-step flow (preserved for logic)
    const [resetCode, setResetCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')

    const { backendURL } = useStore()

    useEffect(() => {
        manageKeyboard('fieldGrid')
    }, [])

    const validateEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
    }

    const requestResetCode = async (e) => {
        if (e) e.preventDefault();
        if (!email || !validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${backendURL}email/sendResetCode/${email}`);
            const resp = await response.json();

            if (resp.result === 'Email not found') {
                setError('No account found with this email address.');
                setIsLoading(false);
                return;
            }

            setStage('success');
        } catch (err) {
            console.log('Error sending reset code:\n', err);
            setError('Something went wrong. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }

    // Preserving secondary flow logic just in case the link takes them here
    const verifyResetCode = () => {
        fetch(`${backendURL}email/verifyResetCode/${email}/${resetCode}`)
            .then(res => res.json())
            .then(resp => {
                if (resp.result === 'Incorrect reset code') {
                    alert('Incorrect reset code')
                    return
                }
                setStage('newPassword')
            }).catch(err => {
                console.log('Error verifying reset code:\n', err)
            })
    }

    const updatePassword = () => {
        if (newPassword !== repeatPassword) {
            alert('Passwords do not match')
            return
        } else if (newPassword.length < 8) {
            alert('Password must be at least 8 characters')
            return
        }
        const userInfo = { email, password: newPassword, resetCode }
        fetch(`${backendURL}email/updatePassword/${email}/${resetCode}`, {
            body: JSON.stringify(userInfo),
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(resp => {
                if (resp.result === 'Password not updated') {
                    alert('Password not updated')
                } else {
                    alert('Password reset successfully, now please log in')
                    setStage('email')
                }
                navigate('/')
            }).catch(err => {
                console.log('Error resetting password:\n', err)
            })
    }

    const isButtonDisabled = !email || !validateEmail(email) || isLoading;

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            bgcolor: 'background.default'
        }}>
            <TopNavBar back='/' next='empty' />

            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 3,
                pb: 10 // Pushes content up slightly to feel balanced
            }}>
                <Container maxWidth="xs" sx={{ p: 0 }}>
                    {stage === 'success' ? (
                        <Stack spacing={3} sx={{ textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                    Check your email
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    If an account exists for {email}, you’ll receive a reset link shortly.
                                </Typography>
                            </Box>

                            <Box sx={{ pt: 2 }}>
                                <LinkRouter to="/" style={{ textDecoration: 'none' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'text.primary',
                                            fontWeight: 600,
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Back to login
                                    </Typography>
                                </LinkRouter>
                            </Box>
                        </Stack>
                    ) : (
                        <Box component="form" onSubmit={requestResetCode} id="fieldGrid">
                            <Stack spacing={3}>
                                <Box sx={{ textAlign: 'center', mb: 1 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                        Reset your password
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Enter the email associated with your account and we’ll send a reset link.
                                    </Typography>
                                </Box>

                                <Box>
                                    <TextField
                                        variant='outlined'
                                        label='Email'
                                        fullWidth
                                        value={email}
                                        onChange={e => {
                                            setEmail(e.target.value);
                                            if (error) setError('');
                                        }}
                                        error={!!error}
                                        helperText={error}
                                        inputProps={{ autoCapitalize: 'none' }}
                                        disabled={isLoading}
                                    />
                                </Box>

                                <Box>
                                    <Button
                                        variant='contained'
                                        size='large'
                                        fullWidth
                                        type="submit"
                                        disabled={isButtonDisabled}
                                        sx={{
                                            py: 1.5,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            height: '56px'
                                        }}
                                    >
                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : "Send reset link"}
                                    </Button>

                                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                                        <LinkRouter to="/" style={{ textDecoration: 'none' }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'text.secondary',
                                                    '&:hover': { color: 'text.primary' },
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                Back to login
                                            </Typography>
                                        </LinkRouter>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {/* Hidden legacy stages - kept for structural compatibility if needed */}
                    {stage === 'resetCode' && (
                        <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary">Verify Code Flow (Legacy)</Typography>
                            <TextField fullWidth size="small" value={resetCode} onChange={e => setResetCode(e.target.value)} sx={{ mt: 1 }} />
                            <Button fullWidth onClick={verifyResetCode} sx={{ mt: 1 }}>Verify</Button>
                        </Box>
                    )}
                    {stage === 'newPassword' && (
                        <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary">New Password Flow (Legacy)</Typography>
                            <TextField fullWidth size="small" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} sx={{ mt: 1 }} />
                            <TextField fullWidth size="small" type="password" value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)} sx={{ mt: 1 }} />
                            <Button fullWidth onClick={updatePassword} sx={{ mt: 1 }}>Update</Button>
                        </Box>
                    )}
                </Container>
            </Box>
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
