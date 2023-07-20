import { Avatar, AvatarGroup, Box, Button, Card, Container, Grid, Rating, TextField, Typography } from '@mui/material';
import TopProfileBar from '../../TopNavBar/TopProfileBar';
import SessionCard from '../../SessionCard/SessionCard';
import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import useStore from '../../../store';
import UserInfo from '../UserInfo';
import './StudentProfile.css';
import Prof from '../Prof';
import axios from 'axios';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/';

const StudentProfile = () => {
    const [isRatingComplete, setIsRatingComplete] = useState(false);
    const [classHappened, setClassHappened] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [bookings, setBookings] = useState([]);
    const { userID, userName } = useStore();
    const User = useParams();

    useEffect(() => {
        axios.get(`${backendURL}booking/bookings/${User.userName}`)
            .then(response => {
                setBookings(response.data);
                const _today = new Date();
                _today.setHours(0, 0, 0, 0);
                const classHappened = response.data.some(booking => {
                const slotDate = new Date(booking.date);
                return slotDate <= _today && !booking.ratedAndReviewed;
            });
            setClassHappened(classHappened);
        });
    }, [User.userName]);

    const handleWrittenReview = (event, booking) => {
        const writtenReview = event.target.value;
        setBookings(prevBookings => {
            const updatedBookings = prevBookings.map(prevBooking => {
                if (prevBooking._id === booking._id) {
                    return { ...prevBooking, writtenReview };
                }
            return prevBooking;
            });
            return updatedBookings;
        });
    };

    const sendRating = (event, booking) => {
        event.preventDefault();
        const { rating, writtenReview } = booking;
        if (rating && writtenReview) {

            fetch(`${backendURL}course/sendReview/${booking._id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, writtenReview, userID }),
            }).then(() => {
                // console.log('rating', rating);
                // console.log('writtenReview', writtenReview);
                setIsRatingComplete(true);
            });
        } else {
            alert('please both rate and review your class')
        }
    };

    const getUser = () => {
        axios.get(`${backendURL}user/getUserInfo/${User.userName}`)
        .then(res => {
            const data = res.data;
            setUserInfo(data);
        }).catch(err => {
            console.log('Error getting user info:\n', err);
        });
    };

    useEffect(() => {
        getUser();
    }, [User.userName]);

    return (
        <>
            <TopProfileBar userName={userInfo.userName} />
            <div>
                <Grid container rowSpacing={2} style={{ margin: '2%', alignItems: 'center', justifyContent: 'left' }}>
                    
                    <Grid item xs={3} style={{ display: 'flex', justifyContent: 'center' }}>
                        <Prof
                            avatar={userInfo?.profileImage?.url}
                            name={`${userInfo.firstName} ${userInfo.lastName}`}
                        />
                    </Grid>

                    {
                        userInfo?.description ?
                        <Grid item xs={8} textAlign='left' fullWidth style={{ padding: '2%' }}>
                            {userInfo?.description}
                        </Grid>
                        : <Typography style={{ textAlign: 'left' }}>Bio goes here...</Typography>
                    }

                    { 
                        userInfo.userName === userName ?
                            <Grid item xs={3} style={{ display: 'flex', justifyContent: 'center' }}>
                                <Link to='/edit' style={{ textDecoration: 'none' }}>
                                    <Button variant='contained' style={{ color: 'white' }}>Edit Profile</Button>
                                </Link>
                            </Grid>
                        : null
                    }

                    <Grid item xs={8}>
                        <UserInfo taken={bookings.length} />
                    </Grid>
                </Grid>
            </div>

            <br />
            <hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
            <br />
      
            <Container>
                {
                    classHappened && !isRatingComplete && userID === userInfo?.id && bookings.map(booking => (
                        booking.ratedAndReviewed ? null : 
                        <React.Fragment key={booking._id}>
                            <Typography variant="h4">Rate your session:</Typography>
                            <br />
                    
                            <Card style={{ padding: '2%' }} >
                                <Typography variant='h4'>{booking?.courseID?.courseTitle}</Typography>
                                
                                <Grid fullWidth item alignItems='left'>
                                    <Typography className='tags'>
                                    
                                        <Grid container direction='row' alignItems='center'>
                                            {
                                                booking?.courseID?.tags.map((tag, index) => (
                                                    <Typography variant='body' align='left' key={index} id={index}>
                                                        #{tag}&nbsp;
                                                    </Typography>
                                                ))
                                            }
                                        </Grid>

                                    </Typography>
                                </Grid>
                                
                                <Grid container alignItems='center'>
                                    
                                    <Grid item xs={6}>
                                        <AvatarGroup style={{ justifyContent: 'left' }} total={booking?.numberOfGuests}>
                                            <Avatar src={booking?.teacherID?.profileImage?.url} />
                                        </AvatarGroup>
                                        <Typography variant='h6'>{booking?.teacherID?.firstName} {booking?.teacherID?.lastName}</Typography>
                                    </Grid>
                    
                                    <Grid item xs={6} textAlign='center'>
                                        <Typography variant='h5'>{booking?.time} at </Typography>
                                        <Typography variant='h6'>{booking?.courseID?.address?.line1}</Typography>
                                    </Grid>

                                </Grid>

                                <Grid continer direction='row' align='center'>
                                    
                                    <Grid item>
                                        <Rating
                                            size='large'
                                            name="simple-controlled"
                                            value={booking.rating}
                                            defaultValue={null}
                                            precision={0.5}
                                            onChange={(event, newValue) => {
                                                setBookings(prevBookings => {
                                                    const updatedBookings = prevBookings.map(prevBooking => {
                                                        if (prevBooking._id === booking._id) {
                                                            return { ...prevBooking, rating: newValue };
                                                        }
                                                        return prevBooking;
                                                    });
                                                    return updatedBookings;
                                                });
                                            }}
                                        />
                                        {
                                            booking.rating !== null && (
                                                <Box sx={{ ml: 2 }}>
                                                    <Typography variant='h6'>{booking.rating}/5</Typography>
                                                </Box>
                                            )
                                        }
                                    </Grid>

                                    <TextField
                                        onChange={(event) => handleWrittenReview(event, booking)}
                                        fullWidth
                                        multiline
                                        label='Written Review'
                                        placeholder='You MUST take this class if interested in learning more about...'
                                        name='Written Review'
                                        value={booking.writtenReview || ''}
                                    />

                                    <Grid>
                                        <br />
                                        <Button
                                            style={{ color: "white" }}
                                            variant='contained'
                                            onClick={(event) => sendRating(event, booking)}
                                        >
                                            Confirm Rating
                                        </Button>
                                    </Grid>

                                </Grid>

                            </Card>
                        </React.Fragment>
                    ))
                }

                <br />

                {
                    bookings.length > 0 ? (
                        <Typography variant="h4">Upcoming:</Typography>
                    ) : (
                        <Typography variant="h4">Start Learning Today</Typography>
                    )
                }

                <br />

                {
                    bookings.length > 0 && userID === userInfo?.id && bookings.map(booking => (
                        <React.Fragment key={booking._id}>
                            <Link to={`/student/bookings/${booking._id}`} style={{ textDecoration: 'none' }}>
                                <SessionCard
                                    industry={booking?.courseID?.industry}
                                    capacity={booking?.numberOfGuests}
                                    price={booking?.total}
                                    courseTitle={booking?.courseID?.courseTitle}
                                    profileImage={booking?.teacherID?.profileImage.url}
                                    firstName={booking?.courseID?.userName}
                                    tags={booking?.courseID?.tags}
                                    icon={booking?.courseID?.industry}
                                    images={booking?.courseID?.images[0]?.url}
                                    date={booking?.date}
                                    time={booking?.time}
                                    address={booking?.courseID?.address?.line1}
                                    city={booking?.courseID?.address?.city}
                                    zipCode={booking?.courseID?.address?.zipCode}
                                />
                            </Link>
                            <br />
                        </React.Fragment>
                    ))
                }
            </Container>
        </>
    );
};

export default StudentProfile;