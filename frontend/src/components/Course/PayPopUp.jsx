import React, {useState} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';


import Slide from '@mui/material/Slide';
import { Alert, Grid } from '@mui/material';
import axios from 'axios';
import useStore from '../../store';
import Payment from './Payment';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PayPopUp(props) {
  const [open, setOpen] = React.useState(false);
  const {userID, userName, isTeacher} = useStore();
  const paymentMetadata = {
    teacherUserName: props.teacherUserName,
    time: props.selectedDateAndTime.startTime,
    date: String(props.selectedDateAndTime.startDate).split('T')[0]
  }


  async function bookThisCourse() {

    const bookingObj = {
      timestamp: Date.now(),
      numberOfGuests: props.guests,
      total: props.total,
      courseTimeslotID: props.selectedTimeslotID,
      courseID: props.courseID,
      teacherID: props.teacherID,
      teacherUserName: props.teacherUserName,
      time: props.selectedDateAndTime.startTime,
      date: props.selectedDateAndTime.startDate
    }


    const bookingResponse = await axios.post(`${backendURL}booking/createBooking`, bookingObj);
    console.log({bookingResponse});
    return bookingResponse;
    // navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
  }

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // async function convertTime (time) {
  //   console.log('time', time)
  //   const hours = time?.split(':')
  //   const suffix = hours[0] >= 12 ? "PM" : "AM"; 
  //   return(time + suffix)
  // }

  // async function convertDate (date) {
  //   const _date = await new Date (date)
  //   const dateFormat = _date.toDateString();
  //   return (dateFormat);
  // }

  return (
    <Container>
        {/* {!(props.isRegistered) &&
        <Link to='/student-sign-up' style={{textDecoration: 'none'}}>
          <Button variant="outlined">Register to sign up</Button>
        </Link>} */}
        <Button 
          // disabled={!(props.isRegistered)} 
          variant="contained" 
          style={{color:'white'}}
          onClick={handleClickOpen}
          // require timeslot to be selected and user to be signed in to be able to pay
          disabled={((!props.selectedDateAndTime.hasOwnProperty('startDate')) || (!userID))}>

          {
            !props.selectedDateAndTime.hasOwnProperty('startDate') ? <Typography>Select Availability</Typography> :
            
            !userID ? <Typography>Must be a user to Pay</Typography> :
            
            !userID || !props.selectedDateAndTime.hasOwnProperty('startDate') ? <></> : <Typography>Pay</Typography>
          }

        </Button>
        <Dialog
          fullScreen
          open={open}
          onClose={handleClose}
          TransitionComponent={Transition}
        >
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <Typography sx={{ ml: 2, flex: 1, color:'white'}} variant="h5" component="div">
                Price Breakdown
              </Typography>
              <IconButton
                edge="start"
                style={{color:"white"}}
                onClick={handleClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
                
                <Grid container p={2} justifyContent='left' direction='column'>
                    
                    <Grid item>
                        <Typography variant='h3' style={{color:'#00aeef'}}>
                        {props.courseTitle}
                        </Typography>
                    </Grid>

                    <br/>

                    <Grid item>
                        <Typography variant='h4'>
                        {`By: ${props.teacherFullName}`}
                        </Typography>
                    </Grid>

                    <br/>
                  
                    <Grid item>
                        <Typography variant='h5'>
                        {props.selectedDateAndTime.startDate}
                        </Typography>
                    </Grid>

                    <Grid item>
                        <Typography variant='h6'>
                        {props.selectedDateAndTime.startTime}
                        </Typography>
                    </Grid>

                </Grid>

                <hr style={{width:'90%', color:'black', border: 'solid .5px'}} />

                <Grid container pt={1} pr={4} justifyContent='right' direction='row' columnSpacing={2}>
                  
                    <Stack direction='row' columnGap={2} rowGap={1} alignItems='flex-end'>
                        <Typography variant='h5'>
                            Cost per guest:
                        </Typography>

                        <Typography variant='h4'>
                        ${props.pricePerStudent}
                        </Typography>
                    </Stack>


                    <Grid container pt={2} justifyContent='right' alignItems='flex-end' columnSpacing={2}>
                        <Stack direction='row' >
                            <Typography variant='h5'>
                                No. of guests:
                            </Typography>
                        </Stack>
                    
                        <Grid item>
                            <Typography variant='h4'>
                                x {props.guests}
                            </Typography>
                        </Grid>
                    
                        <Grid container pt={2} justifyContent='right' columnSpacing={2}>

                            <Grid item>
                                <Typography variant='h3' style={{color:'#00aeef'}}>
                                    ${props.total}
                                </Typography>
                            </Grid>

                        </Grid>
                    </Grid>

                </Grid>

                <hr style={{width:'90%', color:'black', border: 'solid .5px'}} />

                <Grid container p={2} justifyContent='center'>
                    <Payment item={props} paymentMetadata={paymentMetadata} bookThisCourse={bookThisCourse} />
                </Grid>

            </Dialog>

        </Container>
    );
}
