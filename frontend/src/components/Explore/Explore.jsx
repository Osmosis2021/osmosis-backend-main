import { Container, Grid, Box } from '@mui/material';
import React, { useState, useEffect } from 'react';
import SessionCard from '../SessionCard/SessionCard';
import axios from 'axios';
import useStore from "../../store"
import { useNavigate } from 'react-router-dom';
import { PremiumSectionHeader } from '../../ui/PremiumSectionHeader';
import { PremiumSkeleton, PremiumEmptyState } from '../../ui/PremiumFeedback';

export default function Explore() {
    const { backendURL } = useStore()
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate()

    useEffect(() => {
        setLoading(true);
        axios.get(`${backendURL}course/getClasses`)
            .then(response => {
                setClasses(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [backendURL]);

    return (
        <Container sx={{ py: 6 }}>
            <PremiumSectionHeader
                title="Book Studio Time"
                subtitle="Explore sessions hosted by local artists."
                align="center"
            />

            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                            <PremiumSkeleton height={320} />
                        </Grid>
                    ))}
                </Grid>
            ) : classes?.length > 0 ? (
                <Grid container spacing={3}>
                    {classes.map(course => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={course?._id}>
                            <Box
                                onClick={() => navigate(`/teachers/${course?.teacherID?.userName}/${course?._id}`)}
                                sx={{ cursor: 'pointer', height: '100%' }}
                            >
                                <SessionCard
                                    images={course?.images?.[0]?.url}
                                    industry={course?.industry}
                                    courseTitle={course?.courseTitle}
                                    firstName={course?.teacherID?.firstName}
                                    lastName={course?.teacherID?.lastName}
                                    tags={course?.tags}
                                    price={course?.pricePerStudent}
                                    icon={course?.industry}
                                    profileImage={course?.teacherID?.profileImage?.url}
                                    capacity={course?.capacity}
                                    duration={course?.duration}
                                    city={course?.addressDetails?.city || course?.city}
                                />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <PremiumEmptyState
                    title="No sessions found"
                    message="Check back later or try adjusting your filters."
                />
            )}
        </Container>
    );
}