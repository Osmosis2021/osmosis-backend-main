import React, { useMemo } from 'react';
import { Box, Typography, Stack, Divider, useMediaQuery, useTheme, Chip, Button } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { PremiumButton } from './PremiumButton';
import DateDrawer, { timeConverter } from '../components/DateDrawer/DateDrawer';
import PayPopUp from '../components/Course/PayPopUp';
import TERMS from '../constants/terms';
import { PremiumCard } from './PremiumCard';

export const ReserveModule = ({
    courseData,
    teacherInfo,
    selectedDateAndTime,
    setSelectedDateAndTime,
    setSelectedTimeslotID,
    setSelectedEnrolledStudents,
    setSelectedEnrollment,
    guestsEntered,
    increaseGuests,
    decreaseGuests,
    selectedTimeslotID,
    selectedEnrollment,
    userName,
    forceInline
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const formatDate = (inputDate) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const date = new Date(inputDate);
        return date.toLocaleDateString(undefined, options);
    };

    const nextAvailableSlots = useMemo(() => {
        if (!courseData?.schedule) return [];
        const today = new Date();
        return courseData.schedule
            .filter(slot => {
                const slotDate = new Date(slot.startDate);
                return slotDate >= today && slot.enrollment < slot.capacity;
            })
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 3);
    }, [courseData?.schedule]);

    const handleQuickSelect = (slot) => {
        setSelectedDateAndTime({ startDate: slot.startDate, startTime: slot.startTime });
        setSelectedTimeslotID(slot._id);
        setSelectedEnrolledStudents(slot.enrolledStudents);
        setSelectedEnrollment(slot.enrollment);
    };

    const ReserveContent = () => (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    ${courseData.pricePerStudent}
                    <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ ml: 1, fontWeight: 500 }}>
                        / {TERMS.STUDENT.toLowerCase()}
                    </Typography>
                </Typography>
            </Box>

            <Divider />

            <Stack spacing={3}>
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', mb: 1.5, display: 'block', letterSpacing: 1 }}>
                        Next Available
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: 'auto', pb: 1 }}>
                        {nextAvailableSlots.map((slot) => (
                            <Chip
                                key={slot._id}
                                label={`${formatDate(slot.startDate)} @ ${timeConverter(slot.startTime)}`}
                                onClick={() => handleQuickSelect(slot)}
                                variant={selectedTimeslotID === slot._id ? "filled" : "outlined"}
                                color={selectedTimeslotID === slot._id ? "primary" : "default"}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    py: 2,
                                    px: 1,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': { transform: 'translateY(-2px)' }
                                }}
                            />
                        ))}
                    </Stack>
                    <DateDrawer
                        schedule={courseData.schedule}
                        selectedDateAndTime={selectedDateAndTime}
                        setSelectedDateAndTime={setSelectedDateAndTime}
                        setSelectedTimeslotID={setSelectedTimeslotID}
                        setSelectedEnrolledStudents={setSelectedEnrolledStudents}
                        setSelectedEnrollment={setSelectedEnrollment}
                        selectedTimeslotID={selectedTimeslotID}
                        fullWidth
                    />
                </Box>

                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                            Guests
                        </Typography>
                        {selectedDateAndTime?.startDate && (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {courseData.capacity - selectedEnrollment} spots left
                            </Typography>
                        )}
                    </Stack>
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                            bgcolor: '#F8F9FA',
                            p: 1.5,
                            borderRadius: 3,
                            border: '1px solid #F0F0F0'
                        }}
                    >
                        <Button
                            onClick={decreaseGuests}
                            disabled={guestsEntered <= 1}
                            sx={{ minWidth: 44, height: 44, borderRadius: 2, bgcolor: 'white', border: '1px solid #E0E0E0', color: 'text.primary' }}
                        >
                            <RemoveIcon fontSize="small" />
                        </Button>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{guestsEntered}</Typography>
                        <Button
                            onClick={increaseGuests}
                            disabled={guestsEntered + selectedEnrollment >= courseData.capacity}
                            sx={{ minWidth: 44, height: 44, borderRadius: 2, bgcolor: 'white', border: '1px solid #E0E0E0', color: 'text.primary' }}
                        >
                            <AddIcon fontSize="small" />
                        </Button>
                    </Stack>
                </Box>
            </Stack>

            <PremiumCard sx={{ p: 2, bgcolor: '#F7F7F7', border: '1px dashed #E0E0E0' }}>
                <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                            ${courseData.pricePerStudent} x {guestsEntered} {guestsEntered === 1 ? TERMS.STUDENT.toLowerCase() : TERMS.STUDENTS.toLowerCase()}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ${courseData.pricePerStudent * guestsEntered}
                        </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ${courseData.pricePerStudent * guestsEntered}
                        </Typography>
                    </Stack>
                </Stack>
            </PremiumCard>

            <Box>
                <PayPopUp
                    selectedDateAndTime={selectedDateAndTime}
                    courseTitle={courseData.courseTitle}
                    courseID={courseData._id}
                    selectedTimeslotID={selectedTimeslotID}
                    pricePerStudent={courseData.pricePerStudent}
                    guests={guestsEntered}
                    profileImage={teacherInfo?.profileImage?.url}
                    total={courseData.pricePerStudent * guestsEntered}
                    teacherFullName={`${teacherInfo?.firstName} ${teacherInfo?.lastName}`}
                    teacherID={courseData.teacherID}
                    teacherUserName={courseData.userName}
                    studentUserName={userName}
                    stripeID={teacherInfo?.stripeID}
                    fullWidth
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', textAlign: 'center' }}>
                    You won't be charged yet
                </Typography>
            </Box>
        </Stack>
    );

    if (isMobile && !forceInline) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 'calc(80px + env(safe-area-inset-bottom))', // Stack above bottom nav
                    left: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    borderTop: '1px solid #E8E8E8',
                    p: 2,
                    zIndex: 200000, // Above bottom nav (100000)
                    boxShadow: '0 -2px 16px rgba(0,0,0,0.08)'
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            ${courseData.pricePerStudent}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {courseData.duration || 60} mins • {formatDate(selectedDateAndTime?.startDate) || 'Select date'}
                        </Typography>
                    </Box>
                    <PremiumButton
                        variant="contained"
                        onClick={() => {
                            const el = document.getElementById('booking-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        sx={{ px: 4 }}
                    >
                        Reserve
                    </PremiumButton>
                </Stack>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: 'sticky',
                top: 100,
                p: 3,
                borderRadius: 0,
                bgcolor: 'background.paper',
                border: '1px solid #F0F0F0',
                boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
            }}
        >
            <ReserveContent />
        </Box>
    );
};
