import { Avatar, AvatarGroup, Box, Button, Card, Container, Grid, Rating, TextField, Typography } from '@mui/material';
import TopProfileBar from '../../TopNavBar/TopProfileBar';
import SessionCard from '../../SessionCard/SessionCard';
import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import useStore from '../../../store';
import UserInfo from '../UserInfo';
import './StudentProfile.css';
import Prof from '../Prof';
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import useLogout from '../../../hooks/useLogout'
const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/';

const StudentProfile = () => {
    const logout = useLogout()
    const axiosPrivate = useAxiosPrivate();
    const [classHappened, setClassHappened] = useState([]);
    const [userInfo, setUserInfo] = useState({});
    const [bookings, setBookings] = useState([]);
    const [unratedAndUnreviewedBooking, setUnratedAndUnreviewedBooking] = useState([])
    const { userID, userName } = useStore();
    const pageUserName = useParams()?.userName

    useEffect(() => {
        axiosPrivate.get(`booking/bookings/${pageUserName}`)
        .then(response => {
            console.log({pageUserName, 'booking/bookings/userName response': response.data})
            setBookings(response.data);
            const _today = new Date();
            _today.setHours(0, 0, 0, 0);
            const bookingHappenedAndNotReviewed = response.data.filter(booking => {
                const slotDate = new Date(booking.date);
                return slotDate <= _today && !booking.ratedAndReviewed;
            });
            const classHappened = response.data.filter(booking => {
                const slotDate = new Date(booking.date);
                return slotDate <= _today;
            });
            setUnratedAndUnreviewedBooking(bookingHappenedAndNotReviewed);
            setClassHappened(classHappened)
        });
    }, [pageUserName]);

    const handleWrittenReview = (event, booking) => {
        const writtenReview = event.target.value;
        setUnratedAndUnreviewedBooking(prevBookings => {
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
                body: JSON.stringify({ 
                    feedback: {rating, writtenReview, userID }
                }),
            }).then(() => {
                setUnratedAndUnreviewedBooking(prevBookings => prevBookings.filter(prevBooking => prevBooking._id !== booking._id));
            });
        } else {
            alert('Please both rate and review your class');
        }
    };

    const getUser = () => {
        axiosPrivate.get(`${backendURL}user/getUserInfo/${pageUserName}`)
        .then(res => {
            const data = res.data;
            setUserInfo(data);
        }).catch(err => {
            console.log('Error getting user info:\n', err);
        });
    };

    useEffect(() => {
        getUser();
    }, [pageUserName]);

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

            {/* VVV SHOW RATING/REVIEW PROMPT FOR UNRATED AND UNREVIEWED BOOKINGS VVV */}

            <Container>

                {
                    userID === userInfo?.id && unratedAndUnreviewedBooking.length > 0 ? <Typography variant="h4">Rate your session:</Typography>
                    : <></>
                }

                { 
                    userID === userInfo?.id && unratedAndUnreviewedBooking.map(booking => { 

                        return (

                            <React.Fragment key={booking._id}>
                                <>
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
                                                        setUnratedAndUnreviewedBooking(prevBookings => {
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
                                </>
                            </React.Fragment>
                        )
                    })
                }

                <br />

                {
                    userID === userInfo?.id && bookings.length > 0 || unratedAndUnreviewedBooking.length > 0 ? (
                        <Typography variant="h4">Upcoming:</Typography>
                    ) : (
                        <Typography variant="h4">Start Learning Today</Typography>
                    )
                }

                <br />

                {
                    bookings.length > 0 &&
                    userID === userInfo?.id &&
                    bookings
                        .filter(
                        (booking) =>
                            !classHappened.some(
                            (classBooking) => classBooking._id === booking._id
                            )
                        )
                        .map((booking) => (
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

            <br />

            {/* SHOW HISTORY OF COMPLETED CLASSES TAKEN */}

            <Container>

                {
                    bookings.length > 0 ? <Typography variant="h4">History of Classes:</Typography> 
                    : <></>
                }

                <br/>

                {
                    classHappened.length > 0 && userID === userInfo?.id && classHappened.map(booking => (
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
            {userID &&
                <Grid item xs={3} style={{display:'flex', justifyContent:'center', marginTop: '15px'}}>
                    <Button onClick={() => logout('/')} variant='contained' style={{color:'white'}}>Logout</Button>
                </Grid>
            }
        </>
    );
};

export default StudentProfile;