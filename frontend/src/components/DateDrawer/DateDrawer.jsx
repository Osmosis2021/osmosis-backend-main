import React, { useEffect, useState, useCallback } from 'react';
import { Button, Box, Drawer, Grid, Paper, styled, Typography, IconButton, Stack, Skeleton } from '@mui/material/';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export const timeConverter = (rawTime) => {
    if (!rawTime) return '';
    const array = rawTime.split(':');
    const parsedInput = parseInt(array[0])
    const suffix = parsedInput >= 12 ? "PM" : "AM";
    const newTime = ((parsedInput + 11) % 12 + 1);
    return (newTime + ':' + array[1] + suffix);
}

export default function DateDrawer(props) {
    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#FFFFFF',
        padding: theme.spacing(2.5),
        textAlign: 'center',
        color: theme.palette.text.primary,
        borderRadius: 16,
        border: '2px solid #F0F0F0',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        '&:hover': {
            borderColor: '#000000',
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,174,239,0.1)'
        }
    }));

    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isScheduleLoading, setIsScheduleLoading] = useState(true)
    const [schedule, setSchedule] = useState(props.schedule || [])

    const fetchSchedule = useCallback(() => {
        if (!props.schedule) return;
        const today = new Date()
        today.setHours(0, 0, 0, 0);
        const presentAndFutureCourses = props?.schedule.filter((_course) => {
            const courseDate = new Date(_course.startDate)
            return courseDate >= today
        })
        presentAndFutureCourses.sort((a, b) => {
            const dateA = new Date(a.startDate.split('T')[0] + 'T' + a.startTime)
            const dateB = new Date(b.startDate.split('T')[0] + 'T' + b.startTime)
            return dateA - dateB
        })
        setSchedule(presentAndFutureCourses)
        setIsScheduleLoading(false)
    }, [props?.schedule]);

    useEffect(() => {
        fetchSchedule()
    }, [fetchSchedule])

    const openSchedule = () => {
        setIsDrawerOpen(true)
    }

    const selectionHandler = (startDate, startTime, timeslotID, enrolledStudents, enrollment, capacity) => {
        if (enrollment >= capacity) return;
        props.setSelectedDateAndTime({ startDate, startTime })
        props.setSelectedTimeslotID(timeslotID)
        props.setSelectedEnrolledStudents(enrolledStudents)
        props.setSelectedEnrollment(enrollment)
        setIsDrawerOpen(false)
    }

    return (
        <>
            <Button
                variant='outlined'
                onClick={openSchedule}
                fullWidth={props.fullWidth}
                startIcon={<CalendarMonthIcon />}
                sx={{
                    borderRadius: 3,
                    py: 1.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    borderWidth: 2,
                    fontSize: '1rem',
                    '&:hover': { borderWidth: 2 }
                }}
            >
                {props.selectedDateAndTime?.startDate ?
                    `${new Date(props.selectedDateAndTime.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${timeConverter(props.selectedDateAndTime.startTime)}` :
                    'See all dates'}
            </Button>

            <Drawer
                anchor='bottom'
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '32px 32px 0 0',
                        maxHeight: '85vh',
                        bgcolor: '#FAFAFA'
                    }
                }}
            >
                <Box sx={{ p: { xs: 3, md: 5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Select Date</Typography>
                            <Typography variant="body2" color="text.secondary">Choose a time that works for you.</Typography>
                        </Box>
                        <IconButton
                            onClick={() => setIsDrawerOpen(false)}
                            sx={{ bgcolor: '#F0F0F0', '&:hover': { bgcolor: '#E0E0E0' } }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>

                    <Grid container spacing={2}>
                        {isScheduleLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <Grid item xs={6} sm={4} md={3} key={i}>
                                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4 }} />
                                </Grid>
                            ))
                        ) : schedule.length > 0 ? (
                            schedule.map((availability) => (
                                <Grid item xs={6} sm={4} md={3} key={availability._id}>
                                    <Item
                                        onClick={() => selectionHandler(availability.startDate, availability.startTime, availability._id, availability.enrolledStudents, availability.enrollment, availability.capacity)}
                                        sx={{
                                            cursor: availability.enrollment >= availability.capacity ? 'not-allowed' : 'pointer',
                                            opacity: availability.enrollment >= availability.capacity ? 0.5 : 1,
                                            bgcolor: props.selectedTimeslotID === availability._id ? 'primary.main' : 'background.paper',
                                            borderColor: props.selectedTimeslotID === availability._id ? 'primary.main' : '#F0F0F0',
                                            color: props.selectedTimeslotID === availability._id ? 'white' : 'text.primary'
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, opacity: 0.8 }}>
                                            {new Date(availability.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                            {timeConverter(availability.startTime)}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                color: props.selectedTimeslotID === availability._id ? 'rgba(255,255,255,0.9)' : 'primary.main',
                                                bgcolor: props.selectedTimeslotID === availability._id ? 'rgba(255,255,255,0.2)' : 'rgba(0,174,239,0.05)',
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 10
                                            }}
                                        >
                                            {availability.capacity - availability.enrollment} spots left
                                        </Typography>
                                    </Item>
                                </Grid>
                            ))
                        ) : (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: 'center', py: 10 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No dates available</Typography>
                                    <Typography variant="body2" color="text.secondary">Check back later for new sessions.</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Drawer>
        </>
    )
}

