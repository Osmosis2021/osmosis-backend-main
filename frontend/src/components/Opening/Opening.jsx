import React, { useState, useEffect } from 'react';
import { Link as LinkRouter, useNavigate, useLocation } from 'react-router-dom';
import useStore from "../../store";
import logo from '../../assets/studio_time_logo.png';
import './Opening.css';
import { TextField, Container, Grid, Button, Typography, CircularProgress } from '@mui/material';
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

	useEffect(() => {
		manageKeyboard('fieldGrid') // hide bottomnav when mobile keyboard showing and scroll fieldGrid into view
		if (auth?.accessToken) {
			if (auth.roles?.includes(205)) {
				navigate(`/teachers/${auth.userName}`)
			} else {
				navigate('/MapOpen')
			}
		}
	}, [auth, navigate])

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
				setAuth({ userName: userDoc.userName, accessToken, roles })
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
					navigate(`/MapOpen`)
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
		<Container style={{ width: '90vw', backgroundColor: 'white' }}>
			{/* <Bubbles /> */}
			<Grid container style={{ marginTop: '2rem', flexDirection: 'column', alignItems: 'center' }}>

				<Grid item>
					<img src={logo} alt='Studio Time Logo' style={{ width: '280px', height: 'auto', marginBottom: '1rem' }} align='center' />
				</Grid>
				<Typography variant='h4' mt={2} mb={2} align='center'>Inside the studios <br />of real artists 🎨</Typography>

				{
					isLoading ?
						(
							<CircularProgress
								size="xl"
								w={20}
								h={20}
								style={{ display: 'flex', justifyContent: "center", alignItems: 'center', height: '70vh' }}
								margin="auto"
							/>
						) :
						<>
							<Typography variant='subtitle1' mt={2} mb={2}>Already have an account:</Typography>

							<Grid id='fieldGrid' item>
								{
									isWrong ? <TextField variant='outlined' label="Email or Username" inputProps={{ autoCapitalize: 'none' }}
										error fullWidth onChange={handleChangeEmail} style={{ marginBottom: '12px' }} /> :
										<TextField autoComplete='off' variant='outlined' label="Email or Username"
											fullWidth onChange={handleChangeEmail} inputProps={{ autoCapitalize: 'none' }} />
								}
								{
									isWrong ? <TextField variant='outlined' type={showPassword ? "text" : "password"} label="Password" error
										fullWidth inputProps={{ autoCapitalize: 'none' }} onChange={handleChangePassword} helperText="Incorrect entry."
										InputProps={{ // <-- This is where the toggle button is added
											endAdornment: (
												<InputAdornment position="end">
													<IconButton onClick={() => setShowPassword(!showPassword)} >
														{showPassword ? <VisibilityOff /> : <Visibility />}
													</IconButton>
												</InputAdornment>
											)
										}}
									/>
										: <TextField variant='outlined' type={showPassword ? "text" : "password"} label="Password" onChange={handleChangePassword}
											autoCapitalize='none' fullWidth size='large' style={{ marginTop: 8, marginBottom: 3 }} inputProps={{ autoCapitalize: 'none' }}
											InputProps={{ // <-- This is where the toggle button is added
												endAdornment: (
													<InputAdornment position="end">
														<IconButton onClick={() => setShowPassword(!showPassword)} >
															{showPassword ? <VisibilityOff /> : <Visibility />}
														</IconButton>
													</InputAdornment>
												)
											}}
										/>
								}
								<LinkRouter to='/forgot' style={{ textDecoration: 'none' }}>
									<Button size='small' fontSize='extra-small' style={{ marginBottom: 8, marginTop: 6 }}> Forgot Password?</Button>
								</LinkRouter>

								<div className="persistCheck" onChange={toggleThisPersist}>
									<input style={{ zIndex: 3, position: 'relative' }} type="checkbox" id="persists" checked={thisPersist} />
									<label style={{ zIndex: 3, position: 'relative' }} htmlFor="persists">Remember me</label>
								</div>
								<Button variant='contained' size='large' fullWidth style={{ fontSize: 14, fontFamily: 'Poppins', color: 'white', marginTop: '16px' }} onClick={handleLogin}>Login</Button>

								<Typography variant='h5' mt={2} mb={2} align='center'>OR</Typography>

								<LinkRouter to='/sign-up' align='center' style={{ textDecoration: 'none' }}>
									<Button variant="contained" size="large" align='center' style={{ fontSize: 26, fontFamily: 'Poppins', color: 'white' }} fullWidth>
										Signup Today
									</Button>
								</LinkRouter>
							</Grid>
						</>
				}
			</Grid>
		</Container>
	);
};

export default Opening;
