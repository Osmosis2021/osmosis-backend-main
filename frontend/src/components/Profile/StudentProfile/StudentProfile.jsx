import { Button, Container, Grid, Typography } from '@mui/material';
import TopProfileBar from '../../TopNavBar/TopProfileBar';
import SessionCard from '../../SessionCard/SessionCard';
import React, {useState, useEffect} from 'react';
import { Link, useParams } from "react-router-dom";
import useStore from '../../../store';
import './StudentProfile.css';
import Prof from '../Prof';
import axios from 'axios';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://osmosis.herokuapp.com/' : 'http://localhost:8126/'

const StudentProfile = (props) => {
    
    const [userInfo, setUserInfo] = useState({});
    const [bookings, setBookings] = useState([]);
    const {userName} = useStore();
    const User = useParams();

    useEffect(() => {
        axios.get(`${backendURL}booking/bookings`).then(response => {
        setBookings(response.data);
        console.log(response.data)
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
            console.log(data)
		}).catch((err) => {
			console.log('Error getting users info:\n', err);
		});
	}, [User]);
    
    return (
        <>
            <TopProfileBar userName={userInfo.userName}/>
            <div>
                <Grid container rowSpacing={2} style={{ margin: '2%', alignItems: 'center', justifyContent:'left' }}>
                   
                    <Grid item xs={3} style={{display:'flex', justifyContent:'center'}}>
                        <Prof
                            avatar={userInfo?.profileImage?.url}
                            name={`${userInfo.firstName} ${userInfo.lastName}`}
                        />
                    </Grid>

                    {
                        userInfo?.description ?
                        <Grid item xs={8} textAlign='left' fullWidth style={{padding:'2%'}}>
                            {userInfo?.description}
                        </Grid>
                        : <Typography style={{textAlign:'left'}}>Bio goes here...</Typography>
                    }

                    
                    {
                        userInfo.userName === userName ? 
                            <Grid item xs={3} style={{display:'flex', justifyContent:'center'}}>
                                <Link to='/edit' style={{ textDecoration: 'none' }}>
                                    <Button variant='contained' style={{color:'white'}}>Edit Profile</Button>
                                </Link>
                            </Grid>
                        : <></>
                    }

                </Grid>
		    </div>

            <br />
            <hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
            <br />
        
            <Container>
                {/* <Typography variant="h4">Start learning today</Typography> */}
                
                {/* {
                    bookings ? 
                    <>
                    <Typography variant="h4">Upcoming:</Typography>
                        {
                            userInfo.courseTaken.map((courseTaken) => {
                                return(
                                        <SessionCard 
                                            industry = {courseTaken.industry}
                                        />
                                )
                            })
                        }
                    </> : <Typography>Start learning today!</Typography>
                } */}

                {bookings?.length > 0 ? <Typography variant="h4">Upcoming:</Typography> : <Typography variant="h4">Start Learning Today</Typography>}
                <br/>
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
        </>
    );
};

export default StudentProfile;