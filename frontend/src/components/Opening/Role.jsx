import React from 'react';
import { Box, Container, Button, Typography, Stack } from '@mui/material';
import { Link } from 'react-router-dom';

import Receiving from '../../assets/SVG/Receiving/Receiving';
import Sharing from '../../assets/SVG/Sharing/Sharing';
import './Role.css';
import TopNavBar from '../TopNavBar/TopNavBar';

const Role = () => {

    return (
      <>
        <TopNavBar back='/' next='empty' activeStep='empty'/>

      <Container maxWidth="sm" align='center'>
      <Stack mb={4} mt={6} style={{alignItems:'center'}}>
          <Typography variant='h3'>Select your <span style={{color:'#000000'}}>role:</span></Typography>
      </Stack>

      <br/>


          
          <Link to='/industry' style={{ textDecoration: 'none' }}>
            <Box textAlign='center'>
              <Button variant='contained' style={{alignItems:'center', width:175, height:175, borderRadius:'50%'}}>
                <Container style={{alignItems:'center'}}>
                  <Sharing style={{alignItems:'center', width: 100, height: 100 }}/>
                  <Typography gutterBottom variant='h4' mt={1} color="white" fontWeight='medium' >
                    Teach
                  </Typography>
                </Container>
              </Button>
            </Box>
          </Link>

          <Typography variant='h3' mt={6} mb={6} align='center'>OR</Typography>
          
          <Link to='/MapOpen' style={{ textDecoration: 'none' }}>
            <Box textAlign='center'>
              <Button variant="contained" style={{alignItems:'center', width:175, height:175, borderRadius:'50%'}}>
                <Container align='center'>
                  <Receiving style={{ alignItems:'center', width: 100, height: 100 }} />
                  <Typography gutterBottom variant='h4' mt={1} color="white" fontWeight='medium' >
                    Learn
                  </Typography>
                </Container>
              </Button>
            </Box>
          </Link>  

        </Container>
      </>
    );
};

export default Role;