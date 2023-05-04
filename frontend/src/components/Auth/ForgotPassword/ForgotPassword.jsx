import React from "react";
import { TextField, Container, Grid, Button, Avatar, Typography } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import TopNavBar from '../../TopNavBar/TopNavBar';
import logo from '../../../assets/Osmosis_Logo.png'

const Forgot = () => {
    return (
        <>
            <TopNavBar back='/' next='empty' />
            <Container maxWidth="sm" style={{alignItems:'center'}}>
                <Grid container align='center' direction="column" style={{ marginTop: '2rem', }} >

                    <Grid item>
                        <Avatar src={logo} alt='Osmosis Logo' variant="square" sx={{width: 150, height: 150}} align='center' />
                    </Grid>

                    <Grid item >
                        <Typography align='center' variant='h5' mt={6} mb={0}> Enter the email address <br/> associated with your account </Typography> 
                        <Typography  align='center' variant='body1' mt={2} mb={4}>We'll send you a link to reset your password.</Typography>
                    </Grid>
                    
                    <Grid item>
                        <TextField variant='outlined' label='Email' placeholder='Email' fullWidth size='large' />
                        <LinkRouter style={{textDecoration:'none'}} to=''>
                            <Button variant='contained' size='large' fullWidth sx={{marginTop: 2}} style={{fontSize:18, color:'white', fontFamily:'Poppins'}}>
                                Reset Password
                            </Button>
                        </LinkRouter>
                    </Grid>

                </Grid>
            </Container>
        </>
    )
}


export default Forgot;
