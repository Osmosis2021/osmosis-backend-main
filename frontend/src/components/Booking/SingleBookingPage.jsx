import { Card, Stack, Typography, Grid, Avatar, AvatarGroup, Container, Rating } from '@mui/material'
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TopNavBar from '../TopNavBar/TopNavBar';
import axios from 'axios';
import useStore from '../../store';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'


function SingleBookingPage() {

    const {id} = useParams()
    const {userName} = useStore();
    const [booking, setBooking] = useState([]);

    const formatCurrency = (value) => {
        const formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);
        return formattedValue;
    };


    useEffect(() => {
      axios.get(`${backendURL}booking/teacherBookingInfo/${id}`).then(response => {
        const data = response.data;
        setBooking(...data);
        console.log(id)
        console.log(data)
      })

    }, [])

    function convertTimestampToDate (timestamp) {
      const date = new Date (timestamp)
      const suffix = date.getHours() >= 12 ? "PM" : "AM"; 
      const dateFormat = date.getHours() + ":" + date.getMinutes() + suffix + ", " + "on " + date.toDateString();
      return (dateFormat);
    }
    
    return (
        <Container maxWidth='80%' style={{marginTop:'5%'}}>

        <TopNavBar back={`/teachers/${userName}`} />
            
            <Typography variant='h4' mt={8} mb={2}>
                Booking Number:&nbsp;
                    <span style={{color:'#00aeef', fontSize:'12px'}}>
                        {id}
                    </span>
            </Typography>

            <Card style={{padding:'2%'}}>
                
            
                <Typography variant='h4'>{booking?.courseID?.courseTitle}</Typography>

                <Grid fullWidth item alignItems='left'>
                                <Typography className='tags'>
                                    <Grid container direction='row' alignItems='center'>
                                        {/* WHEN NEWLY CREATED USER, THERE IS NO TAGS TO MAP THROUGH */}
                                        { booking?.courseID?.tags.map((tag, index) => {
                                            return (
                                                <Typography 
                                                    variant='body' 
                                                    align='left'
                                                    key={index} 
                                                    id={index}
                                                >
                                                    #{tag}&nbsp;
                                                </Typography>
                                                )
                                            })
                                        }
                                    </Grid>
                                </Typography>
                            </Grid>

                
                <Grid container alignItems='center'>
                    <Grid item xs={6}>
                    <AvatarGroup style={{justifyContent: 'left'}} total={booking?.numberOfGuests}>
                        <Avatar src={booking?.studentID?.profileImage?.url}/>
                    </AvatarGroup>
                    
                    {/* <Avatar src={booking?.teacherID?.profileImage?.url}/> */}
                    
                    <Typography variant='h6'>{booking?.studentID?.firstName} {booking?.studentID?.lastName}</Typography> 
                    </Grid>
                    
                    <Grid item xs={6} textAlign='center'>
                        {/* <Typography variant='h5'>{booking.date.substr(5).split('', 5)}</Typography> */}
                        <Typography variant='h5'>{booking?.time} at </Typography>
                        <Typography variant='h6'>{booking?.courseID?.address?.line1}</Typography>
                    </Grid>
                </Grid>

            </Card>
                    <br/>

                    <Typography variant='h5'>Purchased at {convertTimestampToDate(booking.timestamp)} </Typography>
                    

                    <Grid container pt={1} pr={4} justifyContent='right' direction='row' columnSpacing={2}>
                  
                        <Stack direction='row' columnGap={2} rowGap={1} alignItems='flex-end'>
                            <Typography variant='h5'>
                                Cost per guest:
                            </Typography>

                            <Typography variant='h4'>
                            {formatCurrency(booking?.courseID?.pricePerStudent)}
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
                                    {booking?.numberOfGuests} x
                                </Typography>
                            </Grid>
                    
                            <Grid container pt={2} justifyContent='right' columnSpacing={2}>

                                <Grid item>
                                    <Typography variant='h3' style={{color:'#00aeef'}}>
                                        {formatCurrency(booking?.total)}
                                    </Typography>
                                </Grid>

                            </Grid>
                        </Grid>


                    <Grid>
                        <Stack direction='row' >
                            <Typography variant='h4' style={{color:'#00aeef'}}>
                                - {formatCurrency((booking?.total)*.099 +.3)}
                            </Typography>
                        </Stack>
                        <Stack>
                            <Typography>Total: {formatCurrency((booking?.total)-((booking?.total)*.099 +.3))}</Typography>
                        </Stack>
                    </Grid>

                    </Grid>

                    <br/>
                        { booking?.ratedAndReviewed ? 
                            <Container alignItems='center'>
                                <Grid container spacing={2} alignItems='center'>
                                    <Grid item>
                                        <Typography variant='h5'>{booking?.studentID?.firstName}'s rating and review:</Typography>
                                        <br/>
                                        <Stack direction='row'>
                                            <Rating name="read-only" value={booking?.rating} readOnly />
                                            &nbsp;<Typography>{booking?.rating}</Typography>
                                        </Stack>
                                        <br/>
                                        <Typography>{booking?.review}</Typography>
                                    </Grid>
                                </Grid>
                            </Container>
                            : <></>
                        }

                </Container>




  )
}

export default SingleBookingPage