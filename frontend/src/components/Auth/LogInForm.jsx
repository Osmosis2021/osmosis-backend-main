import React from 'react';
import { FormGroup, OutlinedInput, Button, Grid } from '@mui/material';
import './LogInForm.css'

const LogInForm = () => {
    return (
        <div>
            <form className='loginForm'>
				<Grid className="gap-2 text-center">
					<FormGroup className="d-grid gap-2">
						<OutlinedInput type='text' placeholder='Username' />
						<OutlinedInput type='password' placeholder='Password' />
					</FormGroup>
					<Button type='submit' varient='primary' className='text-center' style={{ maxWidth: '6rem'}} >
						Submit
					</Button>
				</Grid>
			</form>
        </div>
    );
};

export default LogInForm;