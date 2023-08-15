import React, { useState } from "react";
import { TextField, Container, Grid, Button, Avatar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
// import { Link as LinkRouter } from 'react-router-dom';
import axios from 'axios';
import TopNavBar from '../../TopNavBar/TopNavBar';
import logo from '../../../assets/Osmosis_Logo.png'
import './ForgotPassword.css'
import useStore from '../../../store'
const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'

const Forgot = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
	const [stage, setStage] = useState('email')
    const [resetCode, setResetCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
	// const {backendURL} = useStore();

    // const sendEmail = async(e) => {
    //     e.preventDefault()
    //     console.log(email)
    //     const data = {email}
    //     const response = await axios.post(`${backendURL}email/sendEmail`, data)
    //     console.log(response.data)
    // }

    const requestResetCode = () => {
        fetch(`${backendURL}email/sendResetCode/${email}`)
        .then(res => res.json())
        .then(resp => {
            if(resp.result === 'Email not found') {
                alert('Email not found')
                return
            }
            setStage('resetCode')
        }).catch(err => {
            console.log('Error sending reset code:\n', err)
        })
    }

    const verifyResetCode = () => {
        fetch(`${backendURL}email/verifyResetCode/${email}/${resetCode}`)
        .then(res => res.json())
        .then(resp => {
            if(resp.result === 'Incorrect reset code') {
                alert('Incorrect reset code')
                return
            }
            setStage('newPassword')
        }).catch(err => {
            console.log('Error verifying reset code:\n', err)
        })
    }

    const updatePassword = () => {
        if(newPassword !== repeatPassword) {
            alert('Passwords do not match')
            return
        } else if (newPassword.length < 8) {
            alert('Password must be at least 8 characters')
            return
        }
        const userInfo = {email, password: newPassword, resetCode}
        fetch(`${backendURL}email/updatePassword/${email}/${resetCode}`, {body: JSON.stringify(userInfo),
            method: 'PATCH', headers: {'Content-Type': 'application/json'}})
        .then(res => res.json())
        .then(resp => {
            if(resp.result === 'Password not updated') {
                alert('Password not updated')
            } else {
                alert('Password reset successfully, now please log in')
                setStage('email')
                setEmail('')
                setResetCode('')
                setNewPassword('')
                setRepeatPassword('')
            }
            navigate('/')
        }).catch(err => {
            console.log('Error resetting password:\n', err)
        })
    }

    return (
        <>
            <TopNavBar back='/' next='empty' />
            <Container maxWidth="sm" style={{alignItems:'center'}}>
                <Grid container align='center' direction="column" style={{ marginTop: '2rem', }} >

                    <Grid item>
                        <Avatar src={logo} alt='Osmosis Logo' variant="square" sx={{width: 150, height: 150}} align='center' />
                    </Grid>

                    <Grid item className={`display-${stage === 'email'}`}>
                        <Typography align='center' variant='h5' mt={6} mb={0}> Enter the email address <br/> associated with your account. </Typography> 
                        <Typography  align='center' variant='body1' mt={2} mb={4}>We'll send you a link to reset your password.</Typography>
                    </Grid>
                    <Grid item className={`display-${stage === 'email'}`}>
                        <TextField variant='outlined' label='Email' placeholder='Email' fullWidth size='large' value={email} onChange={e => setEmail(e.target.value)}/>
                        <Button variant='contained' size='large' fullWidth sx={{marginTop: 2}} 
                            onClick={requestResetCode} style={{fontSize:18, color:'white', fontFamily:'Poppins'}}>
                            Send Password Reset Code
                        </Button>
                    </Grid>

                    <Grid item className={`display-${stage === 'resetCode'}`}>
                        <Typography align='center' variant='h5' mt={6} mb={0}> Enter the password reset code <br/> you received by email. </Typography> 
                    </Grid>
                    <Grid item className={`display-${stage === 'resetCode'}`}>
                        <TextField variant='outlined' label='Reset Code' placeholder='Code' fullWidth size='large'
                            value={resetCode} onChange={e => {setResetCode(e.target.value)}}/>
                        <Button variant='contained' size='large' fullWidth sx={{marginTop: 2}} 
                            onClick={verifyResetCode} style={{fontSize:18, color:'white', fontFamily:'Poppins'}}>
                            Verify Password Reset Code
                        </Button>
                    </Grid>

                    <Grid item className={`display-${stage === 'newPassword'}`}>
                        <Typography align='center' variant='h5' mt={6} mb={0}> Enter a new password <br/> at least 8 letters long </Typography> 
                        <Typography  align='center' variant='body1' mt={2} mb={4}>We'll send you a link to reset your password.</Typography>
                    </Grid>
                    <Grid item className={`display-${stage === 'newPassword'}`}>
                        <TextField variant='outlined' label='New Password' placeholder='Password' value={newPassword}
                            onChange={e => {setNewPassword(e.target.value)}} fullWidth size='large' />
                        <TextField variant='outlined' label='Repeat Password' placeholder='Repeat Password' value={repeatPassword}
                            onChange={e => {setRepeatPassword(e.target.value)}} fullWidth size='large' />
                        <Button variant='contained' size='large' fullWidth sx={{marginTop: 2}} 
                            onClick={updatePassword} style={{fontSize:18, color:'white', fontFamily:'Poppins'}}>
                            Save New Password
                        </Button>
                    </Grid>

                </Grid>
            </Container>
        </>
    )
}


export default Forgot;
