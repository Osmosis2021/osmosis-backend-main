import { Container, Grid, Stack, Typography } from '@mui/material';
import React, {useState, useEffect} from 'react';
import SessionCard from '../SessionCard/SessionCard';
import axios from 'axios';
import useStore from "../../store"
import { useNavigate } from 'react-router-dom';

export default function Explore() {
    const {backendURL} = useStore()
    const [classes, setClasses] = useState([]);
    const navigate = useNavigate()

    useEffect(()=>{
        axios.get(`${backendURL}course/getClasses`).then(response => {
            setClasses(response.data)
            console.log(response.data)
        })
    }, []);

    return (
        <>
            <Container align='center'>
                <Stack mb={4} mt={6} style={{ alignItems: 'center' }}>
                    <Typography variant='h3'>
                        <span style={{ color: '#00aeef' }}>Explore </span>
                        your area:
                    </Typography>
                </Stack>
                <Grid container direction='row' spacing={2}>
                    {classes?.length > 0 && classes?.map(course => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={course?._id}>
                            <div onClick={() => navigate(`/teachers/${course?.teacherID?.userName}/${course?._id}`)}>
                                <SessionCard 
                                    images={course?.images[0]?.url} 
                                    industry={course?.industry}
                                    courseTitle={course?.courseTitle}
                                    firstName={course?.teacherID?.firstName}
                                    lastName={course?.teacherID?.lastName}
                                    tags={course?.tags}
                                    price={course?.pricePerStudent}
                                    icon={course?.industry}
                                    profileImage={course?.teacherID?.profileImage?.url}
                                    capacity={course?.capacity}
                                />
                            </div>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </>
    );
}