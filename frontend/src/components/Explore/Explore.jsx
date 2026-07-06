import { Container, Grid, Box, Button } from '@mui/material';
import React, { useState, useEffect } from 'react';
import SessionCard from '../SessionCard/SessionCard';
import axios from 'axios';
import useStore from "../../store"
import { useNavigate, useLocation } from 'react-router-dom';
import { PremiumSectionHeader } from '../../ui/PremiumSectionHeader';
import { PremiumSkeleton, PremiumEmptyState } from '../../ui/PremiumFeedback';
import OpeningMap from '../OpeningMap/openingMap';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';

export default function Explore() {
    const { backendURL } = useStore()
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'map'
    const navigate = useNavigate()
    const location = useLocation()

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

    // Check query param for initial view
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const viewParam = params.get('view');
        if (viewParam === 'map') setView('map');
    }, [location.search]);

    const handleToggleView = () => {
        const nextView = view === 'list' ? 'map' : 'list';
        setView(nextView);
        // Optionally update URL without full navigate if wanted, but simpler to just toggle local state
    };

    return (
        <Box sx={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            {view === 'list' ? (
                <Container sx={{ py: 6, flexGrow: 1 }}>
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
            ) : (
                <Box sx={{ flexGrow: 1, position: 'relative', height: '100%' }}>
                    <OpeningMap />
                </Box>
            )}

            {/* View Toggle Pill */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: { xs: 'calc(80px + env(safe-area-inset-bottom))', md: 32 },
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1400,
                    pointerEvents: 'none'
                }}
            >
                <Button
                    onClick={handleToggleView}
                    variant="contained"
                    sx={{
                        pointerEvents: 'auto',
                        bgcolor: 'text.primary',
                        color: 'background.paper',
                        borderRadius: '24px',
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.85)',
                            transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    {view === 'list' ? (
                        <>
                            <MapIcon sx={{ fontSize: 20 }} />
                            Map
                        </>
                    ) : (
                        <>
                            <ViewListIcon sx={{ fontSize: 20 }} />
                            List
                        </>
                    )}
                </Button>
            </Box>
        </Box>
    );
}