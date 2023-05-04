import SimpleBottomNavigation from '../../SimpleBottomNavigation/SimpleBottomNavigation';
import { Avatar, AvatarGroup, Button, Card, Container, Grid, Skeleton, Typography } from '@mui/material';
import TopProfileBar from '../../TopNavBar/TopProfileBar';
import SessionCard from '../../SessionCard/SessionCard';
import { Link, Link as LinkRouter } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import './TeacherProfile.css';
import Prof from '../Prof';
import upload from '../../../assets/upload.png'
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import useStore from '../../../store';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://osmosis.herokuapp.com/' : 'http://localhost:8126/'


const TeacherProfile = (props) => {
    
    const [teacherInfo, setTeacherInfo] = useState({ profileImage:{} });
    const [sessionCard, setSessionCard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const {userID, userName} = useStore();
    const Teacher = useParams();
    const [bookings, setBookings] = useState([]);

    const isMyProfile = userID === teacherInfo?.id;

    useEffect(() => {
        axios.get(`${backendURL}booking/teacherBookings`).then(response => {
        setBookings(response.data);
        })

    }, [])

    const getTeacher = (Teacher) => {
        for (let i = 0; i < Teacher.length; i++) {
            if (Teacher[i].userName === Teacher) {
                setTeacherInfo(Teacher[i])
            }
        }
    }
    
	useEffect(() => {
        const controller = new AbortController()
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
        return () => {
            controller.abort()
        }
	}, [Teacher.userName]);

    useEffect(() => {
        const controller = new AbortController()
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
        
            <div>  
                <TopProfileBar userName={userName} />
                <Grid container rowSpacing={2} style={{ margin: '2%', alignItems: 'center', justifyContent:'center' }}>
                    {isLoading ? <Skeleton/> : 
                    <Prof
                        name={`${teacherInfo.firstName} ${teacherInfo.lastName}`}
                        // avatar={teacherInfo.profileImage.url}
                        avatar={teacherInfo?.profileImage?.url || upload}
                    />}
                    
                    <Grid item xs={8} style={{ paddingBottom: 5 }}>
                        {/* <UserInfo /> */}
                    </Grid>

                    { 
                        teacherInfo.description 
                        ? 
                        <Grid item textAlign='left' fullWidth style={{padding:'2%'}}>
                            {teacherInfo.description} 
                        </Grid> 
                        :
                        <Typography style={{textAlign:'left'}}>Bio goes here...</Typography>
                    }


                </Grid>
            </div>

        
            <hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
            <br />
            
            <Container>

            {
                bookings?.length > 0 && isMyProfile && bookings.map(booking => (
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
                                <LinkRouter to={isMyProfile ? `/editcourse/${course._id}` : `/teachers/${course.userName}/${course._id}`} style={{textDecoration:'none'}}>
                                { isMyProfile ? 
                                <Button style={{height:'50px', width:'75px', color:'white', backgroundColor: 'transparent', fontSize: '20px', position: 'absolute', right:'25px', zIndex:10}} variant="contained" startIcon={<EditIcon />}> Edit </Button> 
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
            <SimpleBottomNavigation />
        </>
    );
};

export default TeacherProfile;
