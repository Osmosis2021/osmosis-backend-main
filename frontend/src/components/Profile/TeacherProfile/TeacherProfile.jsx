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
import axios from '../../../actions/axios'
import useAxiosPrivate from "../../../hooks/useAxiosPrivate"
import useLogout from '../../../hooks/useLogout'


const TeacherProfile = (props) => {
    const axiosPrivate = useAxiosPrivate()
    const logout = useLogout()
    const [teacherInfo, setTeacherInfo] = useState({ profileImage:{} });
    const [sessionCard, setSessionCard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [unratedAndUnreviewedBooking, setUnratedAndUnreviewedBooking] = useState([]);
    // TODO: setBookingsTakenAsStudent is never actually set
    const [bookingsTakenAsStudent, setBookingsTakenAsStudent] = useState([])  // TODO: why is this setter never used?
    const [classHappened, setClassHappened] = useState([]);
    const {backendURL, userID, userName, isStudent} = useStore()
    const pageUserName = useParams()?.userName

    useEffect(() => {
        let isMounted = true
        const controller = new AbortController()

        const getPageInfo = async () => {
            try {
                const resp = await axiosPrivate.get(`booking/teacherBookings/${pageUserName}`,
                                                    {signal: controller.signal})
                const _today = new Date();
                const teacherClassHappened = resp.data.filter(booking => {
                    const slotDate = new Date(booking.date);
                    return slotDate <= _today;
                });
                if (isMounted) {
                    setBookings(resp.data)
                    setClassHappened(teacherClassHappened)
                }

                if (isStudent) {
                    const studentResp = axios.get(`booking/bookings/${pageUserName}`, {signal: controller.signal})
                    if (studentResp.data) {
                        const bookingHappenedAndNotReviewed = studentResp.data.filter(booking => {
                            const slotDate = new Date(booking.date);
                            return slotDate <= _today && !booking.ratedAndReviewed;
                        })
                        const studentClassHappened = studentResp.data.filter(booking => {
                            const slotDate = new Date(booking.date);
                            return slotDate <= _today;
                        })
                        if (isMounted) {
                            setUnratedAndUnreviewedBooking(bookingHappenedAndNotReviewed)
                            setClassHappened(studentClassHappened)
                            console.log('student classes that happened.....', studentClassHappened)
                        }
                    }
                }
            } catch (err) {
                console.error(err)
            }
        }
        getPageInfo()

        // axios.get(`booking/teacherBookings/${pageUserName}`).then(response => {
        //     setBookings(response.data);
        //     const _today = new Date();
        //     const _classHappened = response.data.filter(booking => {
        //         const slotDate = new Date(booking.date);
        //         return slotDate <= _today;
        //     });
        //     setClassHappened(_classHappened);
        // })

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [pageUserName, isStudent]);
    
	useEffect(() => {
        const _controller = new AbortController()
		fetch(`${backendURL}course/getCourses/${pageUserName}`, {signal: _controller.signal})
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

        fetch (`${backendURL}user/getUserInfo/${pageUserName}`)
        .then((res) => {
            return res.json();
        }).then((data) => {
            setTeacherInfo(data)
            setIsLoading(false)
        }).catch((err) => {
            console.log('Error getting teacher info:\n', err)
        });
        return () => {
            _controller.abort()
        }
    }, [pageUserName]);

    const handleWrittenReview = (event, booking) => {
        const writtenReview = event.target.value;
        setUnratedAndUnreviewedBooking((prevBookings) => {
            const updatedBookings = prevBookings.map((prevBooking) => {
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
                    feedback: { rating, writtenReview, userID }
                }),
            }).then(() => {
                setUnratedAndUnreviewedBooking(prevBookings => prevBookings.filter(prevBooking => prevBooking._id !== booking._id));
            });
        } else {
            alert('please both rate and review your class')
        }
    };
    
        const [isOnboarded, setIsOnboarded] = useState(false);
      
        useEffect(() => {
          fetch(`${backendURL}user/getUserInfo/${userName}`)
            .then(res => res.json())
            .then(data => {
                fetch (`${backendURL}stripe/retrieveStripeAccount/${data.stripeID}`)
                    .then(res => res.json())
                    .then(data => {
                        console.log('In teacherprofile', {data})
                        setIsOnboarded(data?.retrieveAccount?.payouts_enabled || false)
                    })
                })
            .catch((error) => {
                console.error(error);
            });
        }, []);
            
    return (
        <>
            <TopProfileBar userName={userName} />
            <div>  
                <Grid container rowspacing={2} style={{ margin: '2%', alignItems: 'center', justifyContent:'left' }}>
                    {isLoading
                        ? <Skeleton/>
                        : <Grid item xs={3} style={{display:'flex', justifyContent:'center'}}>
                            <Prof
                                name={`${teacherInfo.firstName} ${teacherInfo.lastName}`}
                                avatar={teacherInfo?.profileImage?.url}
                            />
                        </Grid>
                    }
                    
                    {teacherInfo.description
                        ? <Grid item xs={8} textAlign='left' fullWidth style={{padding:'2%'}}>
                            {teacherInfo.description}
                        </Grid> 
                        : <Typography style={{textAlign:'left'}}>Bio goes here...</Typography>
                    }

                    {teacherInfo.userName === userName &&
                        <Grid item xs={3} style={{display:'flex', justifyContent:'center'}}>
                            <Link to='/edit' style={{ textDecoration: 'none' }}>
                                <Button variant='contained' style={{color:'white'}}>Edit Profile</Button>
                            </Link>
                        </Grid>
                    }

                    <Grid item xs={8}>
                        <UserInfo taught={bookings.length} taken={isStudent ? bookingsTakenAsStudent.length : null}/>
                    </Grid>
                </Grid>
            </div>

            <hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
            <br />

            {/* VVV UPCOMING CLASSES VVV */}
            <Container>

                { 
                    isOnboarded === false && userID === teacherInfo?.id ? ( 
                        <>
                        <Card style={{padding:'5%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <Grid container justifyContent='center' alignItems='center' direction="column">
                            <Grid item fullWidth>
                                <Typography>Onboard to Stripe to process payments and get paid!</Typography>
                            </Grid>
                            <br/>
                            <Grid item>
                                <Link to={`/stripeonboarding/${userName}`}> 
                                    <Button style={{color:'white'}} variant='contained'>Setup Stripe</Button>
                                </Link>
                            </Grid>
                            </Grid>
                        </Card>
                        </> 
                        ) : 
                    (
                        <></>
                    )
                }

                {bookings?.length > 0 && userID === teacherInfo?.id && bookings.filter((booking) => !classHappened.some(
                        (classBooking) => classBooking._id === booking._id)).map((booking) => (
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
                ))}

                {/* VVV RATING AND REVIEW PROMPT FOR BOTH STUDENT AND TEACHER CLASS TAKEN BUT NOT REVIEWED VVV */}
                {userID === teacherInfo?._id && unratedAndUnreviewedBooking.length > 0 &&
                    <Typography variant="h4">Rate your session:</Typography>
                }

                {userID === teacherInfo?._id && unratedAndUnreviewedBooking.map(booking => {
                    return (
                        <React.Fragment key={booking._id}>
                            <br />
                            <Card style={{ padding: '2%' }} >
                                <Typography variant='h4'>{booking?.courseID?.courseTitle}</Typography>
                                <Grid fullWidth item alignItems='left'>
                                    <Typography className='tags'>
                                        <Grid container direction='row' alignItems='center'>
                                            {booking?.courseID?.tags.map((tag, index) => (
                                                <Typography variant='body' align='left' key={index} id={index}>
                                                    #{tag}&nbsp;
                                                </Typography>
                                            ))}
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
                                        {booking.rating !== null &&
                                            <Box sx={{ ml: 2 }}>
                                                <Typography variant='h6'>{booking.rating}/5</Typography>
                                            </Box>
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
                    )
                })}

                <br/>
                {<>
                    {userID === teacherInfo._id && sessionCard.length > 0
                        ? <Typography variant="h4" style={{justifyContent:'left', marginBottom:'-35px'}}>Classes:</Typography>
                        : <Typography variant="h4" style={{justifyContent:'left', marginBottom:'7px'}}>Classes:</Typography>
                    }
                    <Grid container spacing={0} justifyContent='center'>
                        {sessionCard?.length > 0 &&
                            <>
                                {sessionCard.map((course) => {
                                    return (
                                        <Grid item xs={12} md={6} lg={4}>
                                            <Link to={(userID === teacherInfo?.id) ? `/editcourse/${course._id}` : `/teachers/${course.userName}/${course._id}`} style={{textDecoration:'none'}}>
                                            {userID === teacherInfo?.id &&
                                                <Button className='editCourseButton' style={{height:'50px', width:'75px', color:'white', fontSize: '20px', position: 'relative', top:'50px', zIndex:10, borderRadius:'5% 0 0 0'}} variant="contained" startIcon={<EditIcon />}> Edit </Button> 
                                            }
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
                                            </Link> 
                                        </Grid>
                                    )})
                                }
                            </>
                        }
                        {sessionCard?.length === 0 && userID === teacherInfo?.id &&
                            <LinkRouter to='/flow' style={{textDecoration:'none'}}>
                                <Button type='submit' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                                    Create Course
                                </Button>
                            </LinkRouter>
                        }
                    </Grid>
                </>}
                <br/>
                <br/>
            </Container>

            <Container>
                <br />
                {bookingsTakenAsStudent.length > 0 && bookingsTakenAsStudent.filter((booking) => !classHappened.some((classBooking) => classBooking > 0)) &&
                    <Typography variant="h4">Upcoming:</Typography>
                }
                <br />
                {
                    bookingsTakenAsStudent.length > 0 &&
                    userID === teacherInfo?._id &&
                    bookingsTakenAsStudent.filter((booking) =>
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

                {/* {
                    userID === teacherInfo._id ? <Typography variant="h4">History of Classes Taken:</Typography>
                    : <></>
                } */}

                <br/>

                {/* {   
                    isStudent && bookingsTakenAsStudent.length > 0 && userID === teacherInfo?._id && bookingsTakenAsStudent.map(booking => (
                        <React.Fragment key={booking._id}>
                            <Link to={`/student/bookings/${booking._id}`} style={{ textDecoration: 'none' }}>
                                <SessionCard
                                    industry={booking?.courseID?.industry}
                                    capacity={booking?.numberOfGuests}
                                    price={booking?.total}
                                    courseTitle={booking?.courseID?.courseTitle}
                                    profileImage={booking?.teacherID?.profileImage?.url}
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
                } */}

                {userID === teacherInfo._id &&
                    <Typography variant="h4">History of Classes:</Typography>
                }

                {classHappened.length > 0 && userID === teacherInfo?._id && classHappened.map(booking => (
                    <React.Fragment key={booking._id}>
                        <Link to={`/teacher/bookings/${booking._id}`} style={{ textDecoration: 'none' }}>
                            <SessionCard
                                industry={booking?.courseID?.industry}
                                capacity={booking?.numberOfGuests}
                                price={booking?.total}
                                courseTitle={booking?.courseID?.courseTitle}
                                profileImage={booking?.studentID?.profileImage?.url}
                                firstName={booking?.studentID?.userName}
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
                    </React.Fragment>))
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

export default TeacherProfile;
