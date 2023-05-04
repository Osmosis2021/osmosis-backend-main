import React, {useState} from 'react';
import { useNavigate } from "react-router-dom";
import useStore from "../../store";
import logo from '../../assets/Osmosis_Logo.png';
import { Box, TextField, Container, Grid, Button, Avatar, Typography } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import Bubbles from '../Bubbles/Bubbles';
import CircularProgress from '@mui/material/CircularProgress';

// import './Opening.css';

const backendURL = 'http://localhost:8126/'

const Opening = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isWrong, setIsWrong] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
    const {setUserID, setUserName, setIsTeacher, setIsStudent, setFirstName, setLastName, setIsRegistered} = useStore()
    const navigate = useNavigate()

	const handleChangeEmail = (event) => {
		setEmail(event.target.value)
	}

	const handleChangePassword = (event) => {
		setPassword(event.target.value)
	}

	const handleChangeUsername = event => {
		return
	}

	const handleLogin = e => {
		e.preventDefault()
		setIsLoading(true)
		fetch(`${backendURL}user/login/${email}/${password}`, {method:'POST', credentials: 'include'}
		).then(res => res.json()
		).then(userDoc => {
			if (userDoc._id) {
				setUserID(userDoc._id)
				setUserName(userDoc.userName)
				setIsTeacher(userDoc.isTeacher)
				setIsStudent(userDoc.isStudent)
				setFirstName(userDoc.firstName)
				setLastName(userDoc.lastName)
				setIsRegistered(true);
                if (userDoc.isTeacher) {
                    navigate(`/teachers/${userDoc.userName}`)
                } else {
					navigate(`/MapOpen`)
				}
			} else {
				setIsLoading(false)
				setIsWrong(true)
				console.log('Login failed')
			}
		}).catch(err => {
			console.log('Error logging in user:\n', err)
		})
	}

	return (
		<Container style={{width:'90vw'}}>
		<Bubbles/>
				<Grid container style={{ marginTop: '2rem', flexDirection: 'column', alignItems: 'center' }}>
					
					<Grid item>
						<img src={logo} alt='Osmosis Logo' style={{width: 125, height: 135}} align='center' />
					</Grid>
					
					<Typography variant='h3' mt={2}> Welcome to <span style={{color:'#00aeef'}}>Osmosis</span> </Typography>
					<Typography variant='h4' mt={2} mb={2} align='center'>Learning through <br/>human connections 🤝</Typography>
					<Typography variant='subtitle1' mt={2} mb={2}>Already have an account:</Typography>
		
					<Grid item>
						{
							isWrong ? <TextField variant='outlined' label="Email" placeholder='Email' error fullWidth onChange={handleChangeEmail} style={{marginBottom:'12px'}}/> :
							<TextField variant='outlined' label="Email" placeholder='Email' fullWidth onChange={handleChangeEmail} />
						}
						{
							isWrong ? <TextField variant='outlined' type="password" label="Password" placeholder='Password' error fullWidth onChange={handleChangePassword} helperText="Incorrect entry."/> :
							<TextField variant='outlined' type="password" label="Password" placeholder='Password' onChange={handleChangePassword} fullWidth size='large' style={{marginTop: 8, marginBottom: 3}} />
						}
							<LinkRouter to='/forgot' style={{textDecoration:'none'}}>
								<Button size='small' fontSize='extra-small' style={{marginBottom:8, marginTop:6}}> Forgot Password?</Button>
							</LinkRouter>

							<Button variant='contained' size='large' fullWidth style={{fontSize: 14, fontFamily:'Poppins', color:'white', marginTop: '16px'}} onClick={handleLogin}>Login</Button>
							
							<Typography variant='h5' mt={2} mb={2} align='center'>OR</Typography>
											
							<LinkRouter to='/sign-up' align='center' style={{textDecoration: 'none'}}>
								<Button variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
									Signup Today
								</Button>
							</LinkRouter>
					</Grid>
				</Grid>
		</Container>
	);
};

export default Opening;
