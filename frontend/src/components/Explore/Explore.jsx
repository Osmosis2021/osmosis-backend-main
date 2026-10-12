import { Alert, Box, Button, Container, Grid, Skeleton, Stack, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import SessionCard from '../SessionCard/SessionCard';
import axios from '../../actions/axios';
import useStore from '../../store';
import { PremiumSectionHeader } from '../../ui/PremiumSectionHeader';
import OpeningMap from '../OpeningMap/openingMap';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import { sessionStart } from '../../utils/sessionTime';
import Mascot from '../../ui/Mascot';

const isBookable = (course) => Boolean(course.nextSession && course.paymentsReady);

const CardSkeleton = () => (
    <Box aria-hidden>
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: '16px 16px 0 0' }} />
        <Box sx={{ p: 2.5 }}>
            <Skeleton width="80%" height={28} />
            <Skeleton width="45%" />
            <Skeleton width="65%" sx={{ mt: 1 }} />
        </Box>
    </Box>
);

export default function Explore() {
    const { isTeacher, userName } = useStore();
    const [classes, setClasses] = useState([]);
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [view, setView] = useState('list'); // 'list' or 'map'
    const location = useLocation();

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const { data } = await axios.get('course/getClasses');
            setClasses(Array.isArray(data) ? data : []);
            setStatus('ready');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Check query param for initial view
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('view') === 'map') setView('map');
    }, [location.search]);

    // Listings you can book now first (soonest date first), then ones waiting for dates or payouts.
    const sorted = useMemo(() => [...classes].sort((a, b) => {
        if (isBookable(a) !== isBookable(b)) return isBookable(a) ? -1 : 1;
        if (!a.nextSession || !b.nextSession) return a.nextSession ? -1 : b.nextSession ? 1 : 0;
        return sessionStart(a.nextSession) - sessionStart(b.nextSession);
    }), [classes]);

    const renderList = () => {
        if (status === 'loading') {
            return (
                <Grid container spacing={3} aria-busy="true" aria-label="Loading studio times">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={i}><CardSkeleton /></Grid>
                    ))}
                </Grid>
            );
        }
        if (status === 'error') {
            return (
                <Alert
                    severity="error"
                    sx={{ borderRadius: '12px', maxWidth: 560, mx: 'auto' }}
                    action={<Button color="inherit" size="small" onClick={load}>Try again</Button>}
                >
                    We couldn't load studio times. Check your connection and try again.
                </Alert>
            );
        }
        if (sorted.length === 0) {
            return (
                <Stack alignItems="center" spacing={1.5} sx={{ py: 8, px: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '16px' }}>
                    <Mascot size={88} />
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>No studio times yet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
                        Artists are getting their studios ready. Check back soon, or follow us on Instagram to hear when new sessions open.
                    </Typography>
                    {isTeacher && userName && (
                        <Button component={RouterLink} to="/flow" variant="contained" sx={{ mt: 1, textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
                            List the first studio time
                        </Button>
                    )}
                </Stack>
            );
        }
        return (
            <Grid container spacing={3}>
                {sorted.map(course => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={course?._id}>
                        <Box
                            component={RouterLink}
                            to={`/teachers/${course?.teacherID?.userName || course?.userName}/${course?._id}`}
                            aria-label={`${course?.courseTitle} with ${course?.teacherID?.firstName || 'artist'}, $${course?.pricePerStudent} per guest`}
                            sx={{
                                display: 'block',
                                height: '100%',
                                color: 'inherit',
                                textDecoration: 'none',
                                borderRadius: '16px',
                                '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 3 },
                            }}
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
                                nextSession={course?.nextSession ?? null}
                                paymentsReady={course?.paymentsReady !== false}
                            />
                        </Box>
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Box sx={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            {view === 'list' ? (
                <Container sx={{ py: { xs: 4, md: 6 }, pb: 16, flexGrow: 1 }}>
                    <PremiumSectionHeader
                        title="Book Studio Time"
                        subtitle="Step inside real artists' studios and make something with them."
                        align="center"
                    />
                    {renderList()}
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
                    bottom: { xs: 'calc(100px + env(safe-area-inset-bottom))', md: 32 },
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1400,
                    pointerEvents: 'none'
                }}
            >
                <Button
                    onClick={() => setView(view === 'list' ? 'map' : 'list')}
                    variant="contained"
                    aria-label={view === 'list' ? 'Show studio times on a map' : 'Show studio times as a list'}
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
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
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
