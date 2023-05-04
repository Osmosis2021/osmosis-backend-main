import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Container, Typography, Stack, TextField, Grid, Button, AlertTitle, Card, Backdrop } from '@mui/material';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import { Link as LinkRouter} from 'react-router-dom';
import './Signup.css';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from "../../store";
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';


const backendURL = 'http://localhost:8126/';

const Signup = props => {		
    const {setFirstName, setLastName, setUserName, setIsTeacher, setIsStudent} = useStore()
    const [tempFirstName, setTempFirstName] = useState('')
    const [tempLastName, setTempLastName] = useState('')
    const [tempUserName, setTempUserName] = useState('')
    const [tempEmail, setTempEmail] = useState('')
    const [tempPassword, setTempPassword] = useState('')
    const [isTempTeacher, setIsTempTeacher] = useState(false)
    const [isTempStudent, setIsTempStudent] = useState(false)
    // const [open, setOpen] = useState(false)
    // const handleClose = () => {
    //     setOpen(false);
    //   };

    const navigate = useNavigate();
    

    const changeFirstName = e => {
        setTempFirstName(e.target.value)
    }
    
    const changeLastName = e => {
        setTempLastName(e.target.value)
    }
    
    const changeUserName = e => {
        const newName = e.target.value
        const userNameInput = document.getElementById('userNameInput')
        userNameInput.classList.remove('available-false')
        setTempUserName(newName)
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
    
    const changeEmail = e => {
        setTempEmail(e.target.value)
    }
    
    const changePassword = e => {
        setTempPassword(e.target.value)
    }

    const changeUserType = e => {
        const val = e.target.value
        if(val === 'student') {
            setIsTempStudent(true)
            setIsTempTeacher(false)
        } else if(val === 'teacher') {
            setIsTempStudent(false)
            setIsTempTeacher(true)
        } else { // "Both" is selected in the user type radio button
            setIsTempStudent(true)
            setIsTempTeacher(true)
        }
    }
    
    const handleUserRegistration = async (e) => {
		e.preventDefault();
		const userObj = {
			firstName: tempFirstName,
			lastName: tempLastName,
			userName: tempUserName,
			email: tempEmail,
			password: tempPassword,
            isTeacher: isTempTeacher,
            isStudent: isTempStudent
        }

		try {
			await fetch(`${backendURL}user/registerUser`, {
				body: JSON.stringify(userObj),
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			}).then(() => {
                console.log('successfully registered a new user');
                // update store with user data
                setFirstName(userObj.firstName)
                setLastName(userObj.lastName)
                setUserName(userObj.userName)
                setIsTeacher(userObj.isTeacher)
                setIsStudent(userObj.isStudent)
                // go to profile page (use userObj values in case isTeacher and isStudent haven't updated yet)
                // if (userObj.isTeacher) {
                //     navigate(`/teachers/${userObj.userName}`)
                // } else if (userObj.isStudent) {
                //     navigate(`/students/${userObj.userName}`)
                // }
                alert('Successfully registered, you can now login')
                // setOpen(true)

                navigate('/')
            })
        } catch (error) {
            alert('Registration failed, please try again later')
			console.log('Error registering user:\n', error);
		}
	};
    
    return (
    <>
        <TopNavBar back='/'/>
        
        {/* <Backdrop onClick={handleClose} open={open} sx={{ color: '#00aeef', zIndex:100}} >
            <Alert>
                <Typography>
                    Successfully Registered: You may now login to your account.
                </Typography>
            </Alert>
        </Backdrop> */}

        <form>
            <Typography variant='h6' mt={8} mb={6} align='center' fontSize={21}>Sign up Today!</Typography>
            <Stack >
            <Container align='center' style={{width:"80vw"}} sx={{ py: 2, }}>
                <Grid container direction='row' spacing={2}>
                    <Grid item xs={6}>
                        <Grid item>
                            <Typography style={{textAlign:'left'}} variant="body1">First Name</Typography>
                        </Grid>
                        <Grid item>
                            <TextField onChange={changeFirstName} value={tempFirstName}
                            fullWidth
                            required
                            placeholder='John'
                            id="outlined-required"
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={6}>
                        <Grid item>
                            <Typography style={{textAlign:'left'}} variant="body1">Last Name</Typography>
                        </Grid>
                        <Grid item>
                            <TextField onChange={changeLastName} value={tempLastName}
                            fullWidth
                            required
                            placeholder='Smith'
                            id="outlined-required"
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container py={2}>
                    <Grid item xs={12}>
                        <Typography style={{textAlign:'left'}} variant="body1">Username</Typography>
                        <TextField id='userNameInput' onChange={changeUserName} value={tempUserName} fullWidth placeholder='Unique Username'></TextField>
                    </Grid>
                </Grid>
                <Grid container >
                    <Grid item xs={12}>
                    <Typography style={{textAlign:'left'}} variant="body1">Email</Typography>
                        <TextField  onChange={changeEmail} value={tempEmail} fullWidth placeholder='Email'></TextField>
                    </Grid>
                </Grid>
                <Grid container py={2}>
                    <Grid item xs={12}>
                    <Typography style={{textAlign:'left'}} variant="body1">Password</Typography>
                        <TextField onChange={changePassword} type="password" value={tempPassword} fullWidth placeholder='Your Password'></TextField>
                    </Grid>
                </Grid>
                <Grid container py={2}>
                    <FormLabel id="user-type">Do you want to learn or teach?</FormLabel>
                    <RadioGroup style={{flexDirection: 'row'}}
                        aria-labelledby="user-type"
                        name="radio-buttons-group"
                        onChange={changeUserType}
                    >
                        <Grid item xs={4}>
                            <FormControlLabel style={{padding:'18px'}} value="student" control={<Radio />} label="Learn" />
                        </Grid>
                        <Grid item xs={4}>
                            <FormControlLabel style={{padding:'18px'}} value="teacher" control={<Radio />} label="Teach" />
                        </Grid>
                        <Grid item xs={4}>
                            <FormControlLabel style={{padding:'18px'}} value="both" control={<Radio />} label="Both" />
                        </Grid>
                    </RadioGroup>
                </Grid>

            <LinkRouter to='/MapOpen' align='center' style={{textDecoration: 'none'}}>
                <Button onClick={handleUserRegistration} type='submit' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                    Sign up Today
                </Button>
            </LinkRouter>

            <Grid container py={2} justifyContent='center' alignItems='center'>
                    <Grid item fullWidth>
                        <Typography>By signing up you agree to our <span><a style={{color:'#00aeef'}} href='/termsofservice'>Terms of Service</a></span></Typography>
                    </Grid>
                </Grid>

            </Container>
        </Stack>
    </form>
    
</>
  )}

export default Signup;
