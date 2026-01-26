import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Container, Typography, TextField, Grid, Button, CircularProgress, Box, Stack } from '@mui/material';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link as LinkRouter } from 'react-router-dom';
import './Signup.css';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from "../../store"
import useKeyboard from '../../hooks/useKeyboard'


const Signup = props => {
    const { backendURL, setFirstName, setLastName, setUserName, setIsTeacher, setIsStudent } = useStore()
    const [tempFirstName, setTempFirstName] = useState('')
    const [tempLastName, setTempLastName] = useState('')
    const [tempUserName, setTempUserName] = useState('')
    const [tempEmail, setTempEmail] = useState('')
    const [tempPassword, setTempPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [repeatedTempPassword, setRepeatedTempPassword] = useState('')
    const [showRepeatedPassword, setShowRepeatedPassword] = useState(false)
    const [role, setRole] = useState('') // Artist or Guest
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const manageKeyboard = useKeyboard()

    useEffect(() => {
        manageKeyboard('fieldGrid') // consistent with Opening.jsx
    }, [])

    const changeFirstName = e => setTempFirstName(e.target.value)
    const changeLastName = e => setTempLastName(e.target.value)

    const changeUserName = e => {
        const newName = e.target.value
        setTempUserName(newName)
        const userNameInput = document.getElementById('userNameInput')
        if (!userNameInput) return;
        userNameInput.classList.remove('available-false')
        if (newName.length >= 5) {
            fetch(`${backendURL}user/isUserNameUnique/${newName}`
            ).then(res => res.json()
            ).then(data => {
                userNameInput.classList.remove(`available-${!data.isAvailable}`)
                userNameInput.classList.add(`available-${data.isAvailable}`)
            }).catch(err => {
                console.log('Error checking if username is unique:\n', err)
            })
        }
    }

    const changeEmail = e => setTempEmail(e.target.value)
    const changePassword = e => setTempPassword(e.target.value)
    const changeRepeatedPassword = e => setRepeatedTempPassword(e.target.value)

    const changeUserType = e => setRole(e.target.value)

    const handleUserRegistration = async (e) => {
        e.preventDefault();
        if (!role) {
            alert("Please select if you are an Artist or a Guest.")
            return
        }
        if (tempPassword !== repeatedTempPassword) {
            alert("Passwords don't match, please fix.")
            return
        }
        const userObj = {
            firstName: tempFirstName,
            lastName: tempLastName,
            userName: tempUserName,
            email: tempEmail,
            password: tempPassword,
            isTeacher: role === 'artist',
            isStudent: role === 'guest'
        }
        setIsLoading(true)
        try {
            const response = await fetch(`${backendURL}user/registerUser`, {
                body: JSON.stringify(userObj),
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (data?.message?.startsWith('Unsuccessful')) {
                console.log('Unable to register this user. ' + data.message)
                setIsLoading(false)
                alert(data.message)
                return
            }

            setFirstName(userObj.firstName)
            setLastName(userObj.lastName)
            setUserName(userObj.userName)
            setIsTeacher(userObj.isTeacher)
            setIsStudent(userObj.isStudent)

            setIsLoading(false)
            alert('Successfully registered, you can now login')
            navigate('/')
        } catch (error) {
            alert('Registration failed, please try again later')
            console.log('Error registering user:\n', error);
            setIsLoading(false)
        }
    };

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            bgcolor: 'background.default'
        }}>
            <TopNavBar back='/' />

            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 3,
                py: 2
            }}>
                <Container maxWidth="xs" sx={{ p: 0 }}>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: "center", alignItems: 'center', height: '300px' }}>
                            <CircularProgress color="primary" />
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleUserRegistration} id="fieldGrid">
                            <Stack spacing={2.5}>
                                <Box sx={{ textAlign: 'center', mb: 1 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Join Studio Time
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Create your account to start exploring
                                    </Typography>
                                </Box>

                                {/* Role Selection */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                                        How will you use Studio Time?
                                    </Typography>
                                    <RadioGroup
                                        value={role}
                                        onChange={changeUserType}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            gap: 2,
                                            '& .MuiFormControlLabel-root': {
                                                flex: 1,
                                                margin: 0,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                px: 1,
                                                py: 0.5,
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                '&.Mui-selected': { borderColor: 'primary.main', bgcolor: 'action.selected' }
                                            }
                                        }}
                                    >
                                        <FormControlLabel
                                            value="artist"
                                            control={<Radio size="small" />}
                                            label={<Typography variant="body2">Artist <br /><Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.7 }}>Host sessions</Box></Typography>}
                                        />
                                        <FormControlLabel
                                            value="guest"
                                            control={<Radio size="small" />}
                                            label={<Typography variant="body2">Guest <br /><Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.7 }}>Book experiences</Box></Typography>}
                                        />
                                    </RadioGroup>
                                </Box>

                                {/* Fields */}
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="First Name"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        value={tempFirstName}
                                        onChange={changeFirstName}
                                        required
                                    />
                                    <TextField
                                        label="Last Name"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        value={tempLastName}
                                        onChange={changeLastName}
                                        required
                                    />
                                </Stack>

                                <TextField
                                    id="userNameInput"
                                    label="Username"
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={tempUserName}
                                    onChange={changeUserName}
                                    required
                                    inputProps={{ autoCapitalize: 'none' }}
                                />

                                <TextField
                                    label="Email"
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={tempEmail}
                                    onChange={changeEmail}
                                    required
                                    type="email"
                                    inputProps={{ autoCapitalize: 'none' }}
                                />

                                <Stack spacing={2}>
                                    <TextField
                                        label="Password"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
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
                                        label="Repeat"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        type={showRepeatedPassword ? "text" : "password"}
                                        value={repeatedTempPassword}
                                        onChange={changeRepeatedPassword}
                                        required
                                        error={repeatedTempPassword !== "" && repeatedTempPassword !== tempPassword}
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
                                        sx={{ py: 1.5, textTransform: 'none', fontWeight: 600 }}
                                    >
                                        Create your account
                                    </Button>

                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                            By signing up you agree to our{' '}
                                            <LinkRouter to='/termsofservice' style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</LinkRouter>
                                            {' '}and{' '}
                                            <LinkRouter to='/privacy' style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</LinkRouter>
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            Already have an account?{' '}
                                            <LinkRouter to='/' style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
                                                Login
                                            </LinkRouter>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Container>
            </Box>
        </Box>
    );
};

export default Signup;
