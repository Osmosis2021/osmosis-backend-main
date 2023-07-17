import { Avatar, AvatarGroup, Button, Card, Container, Grid, Skeleton, Typography } from '@mui/material';
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
    const {userID, userName} = useStore();
    const Teacher = useParams();

    useEffect(() => {
        console.log('called short useEffect');
        axios.get(`${backendURL}booking/teacherBookings/${Teacher.userName}`).then(response => {
            console.log('response from booking/teacherBookings call', {response});
            setBookings(response.data);
        })

    }, [])

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
		fetch(`${backendURL}course/getCourses/${Teacher.userName}`, {signal: controller.signal})
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
        fetch (`${backendURL}user/getUserInfo/${Teacher.userName}`)
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
                        <UserInfo taught={bookings.length}/>
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
                 {/* sessionCard === undefined ? */}
                 {/* SHOULD BE SIGNED IN TO SEE CREATE COURSE */}
                { 
                <div className='courseContainer'>
                   <Grid container spacing={2} justifyContent='center'>
                        {sessionCard.length > 0 ? 
                        <>
                        <Typography variant="h4" style={{justifyContent:'left'}}>Classes</Typography>  
                        {sessionCard.map((course) => {
                            return(
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
                            })}
                            </>
                            :
                    <LinkRouter to='/flow' style={{textDecoration:'none'}}>
                        <Button type='submit' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                            Create Course
                        </Button>
                    </LinkRouter>
                    }
                    </Grid>
                    </div>
                }
                <br/>
                <br/>
            </Container>
            
        </>
    );
};

export default TeacherProfile;
