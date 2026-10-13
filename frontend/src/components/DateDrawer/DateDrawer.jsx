import React, { useEffect, useState, useCallback } from 'react';
import { Button, Box, ButtonBase, Drawer, Grid, styled, Typography, IconButton, Stack, Skeleton } from '@mui/material/';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { formatSessionDate, isUpcomingSession, sessionStart } from '../../utils/sessionTime';

export const timeConverter = (rawTime) => {
    if (!rawTime) return '';
    const array = rawTime.split(':');
    const parsedInput = parseInt(array[0])
    const suffix = parsedInput >= 12 ? "PM" : "AM";
    const newTime = ((parsedInput + 11) % 12 + 1);
    return (newTime + ':' + array[1] + suffix);
}

// One session in the picker. A real button, so it works with keyboards and screen readers.
const Item = styled(ButtonBase)(({ theme }) => ({
    width: '100%',
    position: 'relative',
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#FFFFFF',
    padding: theme.spacing(2, 1.5),
    textAlign: 'center',
    color: theme.palette.text.primary,
    borderRadius: 16,
    border: '2px solid #F0F0F0',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontFamily: 'inherit',
    '&:hover': {
        borderColor: '#000000',
        boxShadow: '0 8px 24px rgba(10, 10, 10, 0.05)'
    },
    '&.Mui-focusVisible': {
        outline: `3px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
    },
    '&.Mui-disabled': {
        opacity: 0.5,
    },
}));

export default function DateDrawer(props) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isScheduleLoading, setIsScheduleLoading] = useState(true)
    const [schedule, setSchedule] = useState(props.schedule || [])

    const fetchSchedule = useCallback(() => {
        if (!props.schedule) return;
        const presentAndFutureCourses = props.schedule
            .filter((slot) => isUpcomingSession(slot))
            .sort((a, b) => sessionStart(a) - sessionStart(b))
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
                    `${formatSessionDate(props.selectedDateAndTime.startDate, { month: 'short', day: 'numeric' })} at ${timeConverter(props.selectedDateAndTime.startTime)}` :
                    'See all dates'}
            </Button>

            <Drawer
                anchor='bottom'
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                // Above the phone's bottom navigation and Reserve bar, which otherwise cover the last dates.
                sx={{ zIndex: 200000 }}
                PaperProps={{
                    sx: {
                        borderRadius: '24px 24px 0 0',
                        maxHeight: '85dvh',
                        bgcolor: '#FAFAFA'
                    }
                }}
            >
                <Box sx={{ p: { xs: 2.5, md: 5 }, pb: { xs: 'calc(24px + env(safe-area-inset-bottom))', md: 5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 2.5, md: 4 } }}>
                        <Box>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Select a date</Typography>
                            <Typography variant="body2" color="text.secondary">Choose a time that works for you.</Typography>
                        </Box>
                        <IconButton
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label="Close dates"
                            sx={{ bgcolor: '#F0F0F0', '&:hover': { bgcolor: '#E0E0E0' } }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>

                    <Grid container spacing={1.5}>
                        {isScheduleLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <Grid item xs={6} sm={4} md={3} key={i}>
                                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4 }} />
                                </Grid>
                            ))
                        ) : schedule.length > 0 ? (
                            schedule.map((availability) => (
                                <Grid item xs={6} sm={4} md={3} key={availability._id}>
                                    {(() => {
                                        const isSelected = props.selectedTimeslotID === availability._id;
                                        const isFull = availability.enrollment >= availability.capacity;
                                        const spotsLeft = availability.capacity - availability.enrollment;
                                        return (
                                            <Item
                                                onClick={() => selectionHandler(availability.startDate, availability.startTime, availability._id, availability.enrolledStudents, availability.enrollment, availability.capacity)}
                                                disabled={isFull}
                                                aria-pressed={isSelected}
                                                aria-label={`${formatSessionDate(availability)} at ${timeConverter(availability.startTime)}, ${isFull ? 'full' : `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`}${isSelected ? ', selected' : ''}`}
                                                sx={{
                                                    bgcolor: isSelected ? 'primary.main' : 'background.paper',
                                                    borderColor: isSelected ? 'primary.main' : '#F0F0F0',
                                                    color: isSelected ? '#FFFFFF' : 'text.primary',
                                                    '&:hover': isSelected ? { borderColor: 'primary.main' } : undefined,
                                                }}
                                            >
                                                {isSelected && (
                                                    <CheckCircleIcon sx={{ position: 'absolute', top: 8, right: 8, fontSize: 18, color: '#FFFFFF' }} aria-hidden />
                                                )}
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, opacity: 0.8, color: 'inherit' }}>
                                                    {formatSessionDate(availability)}
                                                </Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'inherit', fontSize: { xs: '1.3rem', md: '1.5rem' }, whiteSpace: 'nowrap' }}>
                                                    {timeConverter(availability.startTime)}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: isSelected ? '#FFFFFF' : 'primary.main',
                                                        bgcolor: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(10, 10, 10, 0.04)',
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 10
                                                    }}
                                                >
                                                    {isFull ? 'Full' : `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`}
                                                </Typography>
                                            </Item>
                                        );
                                    })()}
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

