import { Container, Grid, Stack, Typography } from '@mui/material';
import React, {useState, useEffect} from 'react';
import SessionCard from '../SessionCard/SessionCard';
import axios from 'axios';
import useStore from "../../store"


export default function Explore() {
    const {backendURL} = useStore()
    const [classes, setClasses] = useState([]);
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
                        <Grid item xs={12} sm={6} md={4} lg={3}>
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
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </>
    );
}