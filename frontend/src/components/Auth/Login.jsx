import React, { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Button, Grid, TextField, Typography } from '@mui/material';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = e => {
        e.preventDefault();

        //login(email,password)
    };

    return (
        <Grid item >
			<TextField variant='outlined' placeholder='Username' fullWidth size='small' onChange={onChange}/>
			<TextField variant='outlined' type="password" placeholder='Password' onChange={onChange} fullWidth size='small' style={{marginTop: 8, marginBottom: 5}} />
			<Link href='#' color='primary' fontSize='extra-small'>Forgot Password?</Link>
            <br/>
			<Button variant='contained' size='large' fullWidth sx={{marginTop: 2}} onClick={onSubmit}>Login</Button>
			<Typography variant='h4' mt={6} mb={6} align='center'>OR</Typography>
			<Link to='/role' style={{textDecoration: 'none'}}>
					<Button variant="contained" size="large" style={{fontSize: 20, padding:20}} fullWidth>
									Get Started Today
					</Button>
			</Link>
		</Grid>
    )
};

export default Login;