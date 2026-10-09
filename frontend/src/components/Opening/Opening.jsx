import React, { useState, useEffect } from 'react';
import { Link as LinkRouter, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/studio_time_logo.png';
import './Opening.css';
import { Alert, TextField, Container, Button, Typography, CircularProgress, Box, Stack, Divider } from '@mui/material';
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import useAuth from '../../hooks/useAuth'
import useKeyboard from '../../hooks/useKeyboard'
import useSession, { getLandingPath } from '../../hooks/useSession'
import useGoogleSignIn from '../../hooks/useGoogleSignIn'
import { getAuthErrorMessage } from '../../utils/authErrors'
import axios from '../../actions/axios'
import GoogleSignInButton, { useGoogleSignInAvailable } from '../Auth/GoogleSignInButton'
import RolePickerDialog from '../Auth/RolePickerDialog'


const Opening = () => {
	const { auth } = useAuth()
	const manageKeyboard = useKeyboard()
	const navigate = useNavigate()
	const location = useLocation()
	const startSession = useSession()
	// Where to return after logging in (keeps any query, e.g. a chosen session).
	const from = location.state?.from ? `${location.state.from.pathname}${location.state.from.search || ''}` : undefined
	const [identifier, setIdentifier] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const google = useGoogleSignIn({ from })
	const isGoogleAvailable = useGoogleSignInAvailable()

	useEffect(() => {
		manageKeyboard('fieldGrid') // hide bottomnav when mobile keyboard showing and scroll fieldGrid into view
	}, [manageKeyboard])

	// Already signed in: skip the login page.
	useEffect(() => {
		if (auth?.accessToken) {
			navigate(auth.roles?.includes(205) ? `/teachers/${auth.userName}` : '/explore', { replace: true })
		}
	}, [auth, navigate])

	const handleLogin = async (e) => {
		e.preventDefault()
		if (!identifier.trim() || !password) {
			setError('Enter your email (or username) and password.')
			return
		}
		setIsLoading(true)
		setError('')
		google.setError('')
		try {
			const { data: user } = await axios.post('user/login', { email: identifier.trim(), password, persist: true })
			startSession(user)
			navigate(getLandingPath(user, from), { replace: true })
		} catch (err) {
			setError(getAuthErrorMessage(err))
			setIsLoading(false)
		}
	}

	const visibleError = error || google.error
	const isBusy = isLoading || google.isSubmitting

	return (
		<Box sx={{
			flexGrow: 1,
			width: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			px: 3,
			py: 4,
			bgcolor: 'background.default',
			minHeight: 0 // allow shrinking
		}}>
			<Container maxWidth="xs" sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{/* Hero / Logo Section */}
				<Box sx={{ mb: 5, textAlign: 'center' }}>
					<Box component="img"
						src={logo}
						alt='Studio Time'
						sx={{ width: { xs: 200, sm: 260 }, height: 'auto', display: 'block', mx: 'auto' }}
					/>
				</Box>

				<Box id='fieldGrid' component="form" onSubmit={handleLogin} noValidate sx={{ width: '100%' }}>
					<Stack spacing={2}>
						<Typography component="h1" variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', textAlign: 'center' }}>
							Welcome back
						</Typography>

						{visibleError && (
							<Alert severity="error" role="alert" sx={{ borderRadius: '12px' }}>
								{visibleError}
							</Alert>
						)}

						<TextField
							id="login-identifier"
							autoComplete='username'
							variant='outlined'
							label="Email or username"
							fullWidth
							onChange={(event) => setIdentifier(event.target.value)}
							value={identifier}
							inputProps={{ autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false }}
							error={Boolean(error)}
							disabled={isBusy}
						/>

						{/* Password Field & Forgot Password */}
						<Box>
							<TextField
								id="login-password"
								variant='outlined'
								type={showPassword ? "text" : "password"}
								label="Password"
								autoComplete='current-password'
								onChange={(event) => setPassword(event.target.value)}
								value={password}
								fullWidth
								error={Boolean(error)}
								disabled={isBusy}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												onClick={() => setShowPassword(!showPassword)}
												edge="end"
												aria-label={showPassword ? 'Hide password' : 'Show password'}
											>
												{showPassword ? <VisibilityOff /> : <Visibility />}
											</IconButton>
										</InputAdornment>
									)
								}}
							/>
							<Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
								<Typography
									component={LinkRouter}
									to='/forgot'
									variant="body2"
									sx={{
										color: 'text.secondary',
										textDecoration: 'none',
										'&:hover, &:focus-visible': { color: 'text.primary', textDecoration: 'underline' }
									}}
								>
									Forgot password?
								</Typography>
							</Box>
						</Box>

						{/* Primary Action: Login */}
						<Button
							type="submit"
							variant='contained'
							size='large'
							fullWidth
							disabled={isBusy}
							sx={{
								mt: 1,
								py: 1.5,
								fontSize: '1rem',
								textTransform: 'none',
								fontWeight: 700,
							}}
						>
							{isLoading ? <CircularProgress size={22} color="inherit" aria-label="Signing in" /> : 'Log in'}
						</Button>

						{/* Google Sign-In */}
						{isGoogleAvailable && (
							<>
								<Divider sx={{ my: 1, color: 'text.secondary', typography: 'body2' }}>or</Divider>
								<GoogleSignInButton onCredential={google.handleCredential} text="continue_with" />
							</>
						)}
						{google.isSubmitting && !google.rolePrompt.open && (
							<Box sx={{ display: 'flex', justifyContent: 'center' }} role="status">
								<CircularProgress size={22} aria-label="Signing in with Google" />
							</Box>
						)}

						{/* Secondary Action: Sign Up */}
						<Box sx={{ mt: 3, textAlign: 'center' }}>
							<Typography variant="body2" sx={{ color: 'text.secondary' }}>
								New here?{' '}
								<LinkRouter
									to='/sign-up'
									style={{
										color: 'inherit',
										fontWeight: 600,
										textDecoration: 'underline'
									}}
								>
									Create an account
								</LinkRouter>
							</Typography>
						</Box>
					</Stack>
				</Box>
			</Container>

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

export default Opening;
