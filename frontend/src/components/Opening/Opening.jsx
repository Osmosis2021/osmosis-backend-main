import React, { useState, useEffect } from 'react';
import { Link as LinkRouter, useNavigate, useLocation } from 'react-router-dom';
import useStore from "../../store";
import logo from '../../assets/studio_time_logo.png';
import './Opening.css';
import { TextField, Container, Grid, Button, Typography, CircularProgress, Box, Stack } from '@mui/material';
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Bubbles from '../Bubbles/Bubbles'
import useAuth from '../../hooks/useAuth'
import useKeyboard from '../../hooks/useKeyboard'
import axios from '../../actions/axios'


const Opening = () => {
	const { auth, setAuth, setPersist } = useAuth()
	const manageKeyboard = useKeyboard()
	const navigate = useNavigate()
	const location = useLocation()
	const [email_, setEmail_] = useState('')  // underscore to distinguish from those in the store
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState('')
	const [isWrong, setIsWrong] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [thisPersist, setThisPersist] = useState(true)
	const { setUserID, setUserName, setIsTeacher, setIsStudent, setFirstName, setLastName,
		setIsRegistered, setRoles, setEmail, setDescription, setCustomerStripeID, setPaymentMethodID } = useStore()

	const handleGoogleLoginResponse = async (response) => {
		setIsLoading(true);
		try {
			const res = await axios.post(`user/google-login`, {
				credential: response.credential,
				role: 'student'
			});
			const userDoc = res.data;
			if (userDoc._id) {
				localStorage.setItem("persist", true);
				setPersist(true);
				const accessToken = userDoc?.accessToken;
				const roles = userDoc?.roles;
				setAuth({ userName: userDoc.userName, accessToken, roles, isEmailVerified: userDoc.isEmailVerified });
				setRoles(roles);
				setUserID(userDoc._id);
				setUserName(userDoc.userName);
				setIsTeacher(userDoc.isTeacher);
				setIsStudent(userDoc.isStudent);
				setFirstName(userDoc.firstName);
				setLastName(userDoc.lastName);
				setEmail(userDoc.email);
				setIsRegistered(true);
				setCustomerStripeID(userDoc.customerStripeID);
				setPaymentMethodID(userDoc.paymentMethodID);

				const from = location.state?.from?.pathname;
				if (from) {
					navigate(from, { replace: true });
				} else if (userDoc.isTeacher) {
					navigate(`/teachers/${userDoc.userName}`);
				} else {
					navigate(`/explore`);
				}
			} else {
				setIsLoading(false);
				setIsWrong(true);
			}
		} catch (err) {
			console.error('Error logging in user via Google:', err);
			setIsLoading(false);
		}
	};

	useEffect(() => {
		let googleBtnTimeout;
		const initGoogleBtn = () => {
			if (window.google?.accounts?.id) {
				window.google.accounts.id.initialize({
					client_id: '812674900898-fakeclientid.apps.googleusercontent.com',
					callback: handleGoogleLoginResponse
				});
				const btnElem = document.getElementById("googleBtn");
				if (btnElem) {
					window.google.accounts.id.renderButton(
						btnElem,
						{ theme: "outline", size: "large", width: "100%" }
					);
				}
			} else {
				googleBtnTimeout = setTimeout(initGoogleBtn, 200);
			}
		};
		googleBtnTimeout = setTimeout(initGoogleBtn, 100);

		manageKeyboard('fieldGrid') // hide bottomnav when mobile keyboard showing and scroll fieldGrid into view
		if (auth?.accessToken) {
			if (auth.roles?.includes(205)) {
				navigate(`/teachers/${auth.userName}`)
			} else {
				navigate('/explore')
			}
		}
		return () => clearTimeout(googleBtnTimeout);
	}, [auth, navigate]);

	const handleChangeEmail = (event) => {
		event.preventDefault()
		setEmail_(event.target.value)
	}

	const toggleThisPersist = e => setThisPersist(!thisPersist)

	const handleChangePassword = (event) => {
		event.preventDefault()
		setPassword(event.target.value)
	}

	const handleLogin = async (e) => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const response = await axios.post(`user/login`,
				JSON.stringify({ email: email_, password, persist: thisPersist }),
				{ headers: { 'Content-Type': 'application/json' }, withCredentials: true }
			)
			const userDoc = response.data
			if (userDoc._id) {
				localStorage.setItem("persist", thisPersist)
				setPersist(thisPersist)
				const accessToken = userDoc?.accessToken
				const roles = userDoc?.roles
				setAuth({ userName: userDoc.userName, accessToken, roles, isEmailVerified: userDoc.isEmailVerified })
				setRoles(roles)
				setUserID(userDoc._id)
				setUserName(userDoc.userName)
				setIsTeacher(userDoc.isTeacher)
				setIsStudent(userDoc.isStudent)
				setFirstName(userDoc.firstName)
				setLastName(userDoc.lastName)
				setEmail(userDoc.email)
				setDescription(userDoc.description)
				setIsRegistered(true);
				setCustomerStripeID(userDoc.customerStripeID)
				setPaymentMethodID(userDoc.paymentMethodID)

				const from = location.state?.from?.pathname
				if (from) {
					navigate(from, { replace: true })
				} else if (userDoc.isTeacher) {
					navigate(`/teachers/${userDoc.userName}`)
				} else {
					navigate(`/explore`)
				}
			} else {
				setIsLoading(false)
				setIsWrong(true)
				console.log('Login failed right here')
			}
		} catch (err) {
			console.log('Error logging in user:\n', err)
			setIsLoading(false)
		}
	}

	return (
		<Box sx={{
			flexGrow: 1,
			width: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			px: 3,
			bgcolor: 'background.default',
			minHeight: 0 // allow shrinking
		}}>
			<Container maxWidth="xs" sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{/* Hero / Logo Section */}
				<Box sx={{ mb: 6, textAlign: 'center' }}>
					<img
						src={logo}
						alt='Studio Time Logo'
						style={{ width: '260px', height: 'auto', display: 'block' }}
					/>
				</Box>

				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: "center", alignItems: 'center', height: '300px' }}>
						<CircularProgress color="primary" />
					</Box>
				) : (
					<Box id='fieldGrid' sx={{ width: '100%' }}>
						<Stack spacing={2}>
							{/* Email Field */}
							<TextField
								autoComplete='email'
								variant='outlined'
								label="Email or Username"
								fullWidth
								onChange={handleChangeEmail}
								value={email_}
								inputProps={{ autoCapitalize: 'none' }}
								error={isWrong}
							/>

							{/* Password Field & Forgot Password */}
							<Box>
								<TextField
									variant='outlined'
									type={showPassword ? "text" : "password"}
									label="Password"
									onChange={handleChangePassword}
									value={password}
									autoCapitalize='none'
									fullWidth
									error={isWrong}
									helperText={isWrong ? "Incorrect email or password." : ""}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
													{showPassword ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										)
									}}
								/>
								<Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
									<LinkRouter to='/forgot' style={{ textDecoration: 'none' }}>
										<Typography
											variant="caption"
											sx={{
												color: 'text.secondary',
												cursor: 'pointer',
												'&:hover': { color: 'text.primary', textDecoration: 'underline' }
											}}
										>
											Forgot password?
										</Typography>
									</LinkRouter>
								</Box>
							</Box>

							{/* Primary Action: Login */}
							<Button
								variant='contained'
								size='large'
								fullWidth
								onClick={handleLogin}
								sx={{
									mt: 2,
									py: 1.5,
									fontSize: '1rem',
									textTransform: 'none'
								}}
							>
								Login
							</Button>

							{/* Google Sign-In */}
							<Box sx={{ my: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<Typography variant="body2" color="text.secondary">or</Typography>
							</Box>
							<div id="googleBtn" style={{ width: '100%', minHeight: '40px' }}></div>

							{/* Secondary Action: Sign Up */}
							<Box sx={{ mt: 4, textAlign: 'center' }}>
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
				)}
			</Container>
		</Box>
	);
};

export default Opening;
