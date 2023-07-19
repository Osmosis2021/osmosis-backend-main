import { Avatar, AvatarGroup, Box, Button, Card, Container, Grid, Skeleton, Rating, TextField, Typography } from '@mui/material';
import { Link, Link as LinkRouter } from 'react-router-dom';
import TopProfileBar from '../../TopNavBar/TopProfileBar';
import SessionCard from '../../SessionCard/SessionCard';
import React, { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { useParams } from "react-router-dom";
import useStore from '../../../store';
import UserInfo from '../UserInfo';
import './TeacherProfile.css';
import Prof from '../Prof';
import axios from 'axios';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'

const TeacherProfile = (props) => {
    
    const [teacherInfo, setTeacherInfo] = useState({ profileImage:{} });
    const [sessionCard, setSessionCard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [bookingsTakenAsStudent, setBookingsTakenAsStudent] = useState([])
    const [classHappened, setClassHappened] = useState(false);
    const {userID, userName, isStudent, isRegistered} = useStore();
    const [isRatingComplete, setIsRatingComplete] = useState(false);
    const Teacher = useParams();

    useEffect(() => {
        console.log('called short useEffect');
        console.log('teacherInfo.userName...', teacherInfo?.userName)
        console.log('userName...', userName)
        // if (teacherInfo?.userName === userName) {

            axios.get(`${backendURL}booking/teacherBookings/${Teacher.userName}`).then(response => {
                console.log('response from booking/teacherBookings call', {response});
                setBookings(response.data);
            })
        // } else {return}

        if (isStudent) {
            axios.get(`${backendURL}booking/bookings/${Teacher?.userName}`).then(response => {
                setBookingsTakenAsStudent(response.data)
                console.log(response.data)
                const _today = new Date();
                _today.setHours(0, 0, 0, 0);
                const classHappened = response.data.some(booking => {
                    const slotDate = new Date(booking.date);
                    return slotDate <= _today && !booking.ratedAndReviewed;
                })
                setClassHappened(classHappened);
            });
        }
    }, [Teacher.userName, isStudent]);

    const getTeacher = (Teacher) => {
        console.log('in getTeacher', {Teacher})
        for (let i = 0; i < Teacher.length; i++) {
            if (Teacher[i].userName === Teacher) {
                setTeacherInfo(Teacher[i])
            }
        }
    }
    
	useEffect(() => {
        const controller = new AbortController()
        console.log({backendURL});
		fetch(`${backendURL}course/getCourses/${Teacher?.userName}`, {signal: controller.signal})
		.then((res) => {
			return res.json();
		}).then((data) => {
            let courses
            if (Array.isArray(data)) {
                courses = data
            } else {
                courses = [data]
            }
			setSessionCard(courses);
		}).catch((err) => {
			console.log('Error getting teacher info:\n', err);
		});

        getTeacher(Teacher);
        fetch (`${backendURL}user/getUserInfo/${Teacher?.userName}`)
        .then((res) => {
            return res.json();
        }).then((data) => {
            setTeacherInfo(data)
            setIsLoading(false)
        }).catch((err) => {
            console.log('Error getting teacher info:\n', err)
        });
        return () => {
            controller.abort()
        }
    }, [Teacher]);

    const handleWrittenReview = (event, booking) => {
        const writtenReview = event.target.value;
        setBookingsTakenAsStudent(prevBookings => {
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
                body: JSON.stringify({ rating, writtenReview }),
            }).then(() => {
                // console.log('rating', rating);
                // console.log('writtenReview', writtenReview);
                setIsRatingComplete(true);
            });
        } else {
            alert('please both rate and review your class')
        }
    };
    
    return (
        <>
            <TopProfileBar userName={userName} />
            <div>  
                <Grid container rowSpacing={2} style={{ margin: '2%', alignItems: 'center', justifyContent:'left' }}>
                    {
                        isLoading ? <Skeleton/> : 
                        <Grid item xs={3} style={{display:'flex', justifyContent:'center'}}>
                            <Prof
                                name={`${teacherInfo.firstName} ${teacherInfo.lastName}`}
                                avatar={teacherInfo?.profileImage?.url}
                            />
                        </Grid>
                    }
                    
                    { 
                        teacherInfo.description ? 
                        <Grid item xs={8} textAlign='left' fullWidth style={{padding:'2%'}}>
                            {teacherInfo.description}
                        </Grid> 
                        : <Typography style={{textAlign:'left'}}>Bio goes here...</Typography>
                    }

                    {
                        teacherInfo.userName === userName ? 
                            <Grid item xs={3} style={{display:'flex', justifyContent:'center'}}>
                                <Link to='/edit' style={{ textDecoration: 'none' }}>
                                    <Button variant='contained' style={{color:'white'}}>Edit Profile</Button>
                                </Link>
                            </Grid>
                        : <></>
                    }

                    <Grid item xs={8}>
                        <UserInfo taught={bookings.length} taken={isStudent ? bookingsTakenAsStudent.length : null}/>
                    </Grid>

                </Grid>
            </div>

            <hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
            <br />
            
            <Container>

                {
                    bookings?.length > 0 && (userID === teacherInfo?.id) && bookings.map(booking => (
                        <>
                            <Link to={`/teacher/bookings/${booking._id}`} style={{textDecoration: 'none'}}>
                            <Card style={{padding:'2%'}}>
                                <Typography variant='h5'>You have an upcoming class:</Typography>
                                <Typography variant='h4'>{booking?.courseID?.courseTitle}</Typography>
                                
                                <Grid container alignItems='center'>
                                    <Grid item xs={6}>
                                    <AvatarGroup style={{justifyContent: 'left'}} total={booking?.numberOfGuests}>
                                        <Avatar src={booking?.studentID?.profileImage.url}/>
                                    </AvatarGroup>
                                        <Typography variant='h6'>{booking?.studentID?.firstName} {booking?.studentID?.lastName}</Typography>
                                    </Grid>
                                    
                                    <Grid item xs={6} textAlign='center'>
                                        <Typography variant='h5'>{booking?.date.substr(5).split('', 5)}</Typography>
                                        <Typography variant='h5'>{booking?.time} at </Typography>
                                        <Typography variant='h6'>{booking?.courseID?.address?.line1}</Typography>
                                    </Grid>
                                </Grid>

                            </Card>
                            </Link>
                            <br/>
                        </>

                    ))
                }
                <br/>
                
                { 
                    <div className='courseContainer'>
                        <Grid container spacing={2} justifyContent='center'>
                            {
                                sessionCard?.length > 0 ? 
                                <>
                                    <Typography variant="h4" style={{justifyContent:'left'}}>Classes</Typography>  
                                    {
                                        sessionCard.map((course) => {
                                            return (
                                                <Grid item xs={12} md={6} lg={4}>
                                                <LinkRouter to={(userID === teacherInfo?.id) ? `/editcourse/${course._id}` : `/teachers/${course.userName}/${course._id}`} style={{textDecoration:'none'}}>
                                                { (userID === teacherInfo?.id) ? 
                                                <Button className='editCourseButton' style={{height:'50px', width:'75px', color:'white', fontSize: '20px', position: 'relative', top:'50px', zIndex:10, borderRadius:'5% 0 0 0'}} variant="contained" startIcon={<EditIcon />}> Edit </Button> 
                                                : <></>}
                                                    <SessionCard 
                                                        industry={course.industry}
                                                        tags={course.tags}
                                                        courseTitle={course.courseTitle}
                                                        price={course.pricePerStudent}
                                                        firstName={teacherInfo.firstName}
                                                        lastName={teacherInfo.lastName}
                                                        profileImage={teacherInfo.profileImage.url}
                                                        images={course?.images[0]?.url}
                                                        icon={course.industry}
                                                        capacity={course.capacity}
                                                        city={course.address.city}
                                                        zipCode={course.address.zipCode}
                                                        address={course.address.line1}
                                                    />
                                                </LinkRouter> 
                                                </Grid>
                                            )
                                        })
                                    }
                                </>
                                    : <></> 
                            }
                            { 
                                sessionCard?.length < 0 && userID === teacherInfo?.id ? 
                                    <LinkRouter to='/flow' style={{textDecoration:'none'}}>
                                        <Button type='submit' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                                            Create Course
                                        </Button>
                                    </LinkRouter>
                                : <></>
                            }
                        </Grid>
                    </div>
                }
                <br/>
                <br/>
            </Container>

            <Container>
                {   
                    classHappened && !isRatingComplete && userID === teacherInfo?._id && bookingsTakenAsStudent.map(booking => (
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
                                                setBookingsTakenAsStudent(prevBookings => {
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

                {
                    bookingsTakenAsStudent.length > 0 ? (
                        <Typography variant="h4">Upcoming:</Typography>
                    ) : (
                        <></>
                    )
                }

                <br />

                {
                    bookingsTakenAsStudent.length > 0 && userID === teacherInfo?._id && bookingsTakenAsStudent.map(booking => (
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

export default TeacherProfile;
