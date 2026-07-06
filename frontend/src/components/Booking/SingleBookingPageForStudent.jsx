import {
    Box,
    Container,
    Typography,
    Stack,
    Grid,
    Avatar,
    Divider,
    Button,
    Chip,
    Rating
} from '@mui/material'
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopNavBar from '../TopNavBar/TopNavBar';
import MessageIcon from '@mui/icons-material/Message';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import useStore from '../../store';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { PremiumCard } from '../../ui/PremiumCard';
import { PremiumSectionHeader } from '../../ui/PremiumSectionHeader';
import { PremiumBackButton } from '../../ui/PremiumBackButton';

function SingleBookingPageForStudent() {
    const axiosPrivate = useAxiosPrivate();
    const { id } = useParams()
    const { backendURL, userName, chats, setChats, setSelectedChat, userID } = useStore();
    const [booking, setBooking] = useState(null);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);
    };

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        axiosPrivate.get(`${backendURL}booking/studentBookingInfo/${id}`)
            .then(response => {
                const data = response.data;
                // Backend returns a single object now, but handle array just in case
                setBooking(Array.isArray(data) ? data[0] : data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching booking info:", err);
                setError(err.response?.data?.message || "Could not load booking details.");
                setIsLoading(false);
            });
    }, [id, axiosPrivate, backendURL]);

    const handleMessageHost = async () => {
        if (!userID) {
            alert("Please log in to message.");
            navigate('/');
            return;
        }
        const targetUserId = booking?.teacherID?._id;
        if (!targetUserId) {
            alert("Could not identify host for this booking. Please try again.");
            return;
        };
        if (targetUserId === userID) return; // safety

        try {
            const { data } = await axiosPrivate.get(`${backendURL}chat/accessChats/${targetUserId}?userID=${userID}`);
            if (!chats.find((c) => c._id === data._id)) {
                setChats([data, ...chats]);
            }
            setSelectedChat(data);
            navigate('/chat');
        } catch (err) {
            console.error("Error accessing chat:", err);
            navigate('/chat');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#FAFAFA' }}>
            <Typography variant="h6" color="text.secondary">Loading booking details...</Typography>
        </Box>
    );

    if (error || !booking) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#FAFAFA', p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Oops!</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{error || "We couldn't find this booking."}</Typography>
            <PremiumBackButton fallback={`/students/${userName}`} />
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', pb: 10 }}>
            <TopNavBar />

            <Container maxWidth="md" sx={{ mt: { xs: 4, md: 8 } }}>
                <Box sx={{ mb: 4 }}>
                    <PremiumBackButton fallback={`/students/${userName}`} />
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                        <PremiumCard sx={{ p: 4, mb: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Chip
                                    label="Confirmed"
                                    color="success"
                                    sx={{ fontWeight: 800, borderRadius: 2 }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                    Booking ID: {id.toUpperCase()}
                                </Typography>
                            </Stack>

                            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
                                {booking?.courseID?.courseTitle}
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
                                {booking?.courseID?.tags?.map((tag, index) => (
                                    <Chip key={index} label={`#${tag}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                ))}
                            </Stack>

                            <Divider sx={{ mb: 4 }} />

                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <Stack spacing={3}>
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
                                                Date & Time
                                            </Typography>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <CalendarTodayIcon color="primary" />
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                                        {formatDate(booking.date)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        at {booking.time}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
                                                Location
                                            </Typography>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <LocationOnIcon color="primary" />
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                                        {booking?.courseID?.addressDetails?.line1 || booking?.courseID?.address || "Location details provided"}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {booking?.courseID?.addressDetails?.city || booking?.courseID?.city}, {booking?.courseID?.addressDetails?.state || booking?.courseID?.state} {booking?.courseID?.addressDetails?.zipCode || booking?.courseID?.zipCode}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
                                            Host Info
                                        </Typography>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar
                                                src={booking?.teacherID?.profileImage?.url}
                                                sx={{ width: 56, height: 56, border: '2px solid white', boxShadow: 1 }}
                                            />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                                    {booking?.teacherID?.firstName} {booking?.teacherID?.lastName}
                                                </Typography>
                                                {(userID && booking?.teacherID?._id !== userID) && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<MessageIcon />}
                                                        sx={{ fontWeight: 700, p: 0, textTransform: 'none' }}
                                                        onClick={handleMessageHost}
                                                    >
                                                        Message Host
                                                    </Button>
                                                )}
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Grid>
                            </Grid>
                        </PremiumCard>

                        <PremiumSectionHeader title="What to bring" />
                        <PremiumCard sx={{ p: 3, mb: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                {booking?.courseID?.whatToBring || "The host hasn't specified anything special to bring. Just yourself and a creative spirit!"}
                            </Typography>
                        </PremiumCard>

                        {booking?.ratedAndReviewed && (
                            <Box sx={{ mb: 4 }}>
                                <PremiumSectionHeader title="Your Review" />
                                <PremiumCard sx={{ p: 3 }}>
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Rating value={booking?.rating} readOnly />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{booking?.rating}</Typography>
                                        </Stack>
                                        <Typography variant="body1" color="text.secondary">
                                            {booking?.review}
                                        </Typography>
                                    </Stack>
                                </PremiumCard>
                            </Box>
                        )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Stack spacing={3} sx={{ position: 'sticky', top: 100 }}>
                            <PremiumCard sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Payment Summary</Typography>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Price per guest</Typography>
                                        <Typography sx={{ fontWeight: 700 }}>{formatCurrency(booking?.courseID?.pricePerStudent)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Guests</Typography>
                                        <Typography sx={{ fontWeight: 700 }}>{booking?.numberOfGuests}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Paid</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                            {formatCurrency(booking?.total)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                                        Purchased on {new Date(booking.timestamp).toLocaleDateString()}
                                    </Typography>
                                </Stack>
                            </PremiumCard>

                            {(userID && booking?.teacherID?._id !== userID) && (
                                <PremiumCard sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Need help?</Typography>
                                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                                        If you have questions about your booking, message the host directly.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 800, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                                        onClick={handleMessageHost}
                                    >
                                        Contact Host
                                    </Button>
                                </PremiumCard>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default SingleBookingPageForStudent;