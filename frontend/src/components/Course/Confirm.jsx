import { Container, Typography } from '@mui/material';
import React from 'react';
import Bubbles from '../Bubbles/Bubbles';

// PUSH COURSE TO STUDENTS PROFILE 


function Confirm() {
  return (
    <>
        <Typography variant='h3' mb={4} mt={4} align='center'>Congratulations!</Typography>
        <Container sx={{ py: 2, }}>
            <Bubbles/>
                
            <Typography variant="h4">
                You're all set to join xyz's class for
            </Typography>
            <br/>
            <Typography variant="h5">
                Friday March 28th from 7:30AM - 9:00AM
            </Typography>

        </Container>
    </>
  )
}

export default Confirm;