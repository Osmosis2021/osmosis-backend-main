import SimpleBottomNavigation from '../../SimpleBottomNavigation/SimpleBottomNavigation';
import { Container, Grid, Typography } from '@mui/material';
import TopProfileBar from '../../TopNavBar/TopProfileBar';
import SessionCard from '../../SessionCard/SessionCard';
import React, {useState, useEffect} from 'react';
import { Link, useParams } from "react-router-dom";
import './StudentProfile.css';
import Prof from '../Prof';
import axios from 'axios';
// import UserInfo from '../UserInfo';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://osmosis.herokuapp.com/' : 'http://localhost:8126/'


const StudentProfile = (props) => {
    
    const [userInfo, setUserInfo] = useState({});
    const User = useParams();
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        axios.get(`${backendURL}booking/bookings`).then(response => {
        setBookings(response.data);
        console.log(bookings)
        })

    }, [])

    const getUser = (User) => {
        for (let i = 0; i < User.length; i++) {
            if (User[i].userName === User) {
                setUserInfo(User[i]);
            }
        }
    }

    useEffect(() => {
		getUser(User);
		fetch(`${backendURL}user/getUserInfo/${User.userName}`)
		.then((res) => {
			return res.json();
		}).then((data) => {
			setUserInfo(data);
		}).catch((err) => {
			console.log('Error getting users info:\n', err);
		});
	}, [User]);
    
    return (
        <>
            <TopProfileBar userName={userInfo.userName}/>
            <div>
                <Grid container rowSpacing={2} style={{ margin: '2%', alignItems: 'center', justifyContent:'center' }}>
                    
                        <Prof
                            avatar={userInfo?.profileImage?.url}
                            name={`${userInfo.firstName} ${userInfo.lastName}`}
                        />
                                
                    
                    <Grid item xs={8} style={{ paddingBottom: 5 }}>
                        {/* <UserInfo /> */}
                    </Grid>

                    <Grid item fullWidth>
                        <Typography style={{ padding: '0 5%' }}>
                            {userInfo?.description}
                        </Typography>
                    </Grid>

                </Grid>
		    </div>

            <br />
            <hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
            <br />
        
            <Container>
                <Typography variant="h4">Upcoming Sessions You're Attending:</Typography>
                <br/>
                {/* Pull from array in DB of upcoming classes and taken classes */}

                {/* {
                    userInfo.map((upcomingCoure) => {
                        return (
                            <>
                                <SessionCard 
                                    industry = {upcomingCourse.industry} 
                                    
                                />
                            </>
                        )
                    })
                } */}

                {/* {
                    userInfo.courseTaken ? 
                    <>
                    <Typography variant="h4">Sessions You've Attended:</Typography>
                        {
                            userInfo.courseTaken.map((courseTaken) => {
                                return(
                                        <SessionCard 
                                            industry = {courseTaken.industry}
                                        />
                                )
                            })
                        }
                    </> : <Typography>Take one today!</Typography>
                } */}

                {
                    bookings?.length > 0 && bookings.map(booking => (
                    <>
                        <Link to={`/student/bookings/${booking._id}`} style={{textDecoration:'none'}}>
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

                        <br/>
                    </>
                    ))
                }




            </Container>

            <SimpleBottomNavigation />
        </>
    );
};

export default StudentProfile;