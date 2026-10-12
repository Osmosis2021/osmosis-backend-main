import { Alert, Box, Container, Divider, Grid, Rating, Stack, Typography } from '@mui/material'
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from '../../store';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { PremiumBackButton } from '../../ui/PremiumBackButton';
import Mascot from '../../ui/Mascot';
import useStartChat from '../../hooks/useStartChat';
import { isBookingCancelled } from '../../utils/bookingStatus';
import {
    BookingHeader, BookingSection, InfoRow, PersonRow, PriceRow,
    bookingWhen, formatMoney, guestsLabel, studioAddress,
} from './BookingParts';

/** A booking as the artist sees it. */
function SingleBookingPage() {
    const axiosPrivate = useAxiosPrivate();
    const { id } = useParams()
    const { backendURL } = useStore();
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const startChat = useStartChat();

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        axiosPrivate.get(`booking/studentBookingInfo/${id}`)
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

    const handleMessageStudent = () => startChat(booking?.studentID?._id, { personLabel: 'this guest' });

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }} role="status" aria-label="Loading booking">
            <Mascot size={72} />
        </Box>
    );

    if (error || !booking) return (
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
            <Stack spacing={2} alignItems="center">
                <Mascot size={80} motion="rock" />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>We couldn't open this booking</Typography>
                <Typography color="text.secondary">{error || "We couldn't find this booking."}</Typography>
                <PremiumBackButton fallback="/bookings" />
            </Stack>
        </Container>
    );

    const course = booking.courseID || {};
    const address = studioAddress(course);
    const cancelled = isBookingCancelled(booking);

    return (
        <>
        <TopNavBar />
        <Container maxWidth="md" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 2 }}>
                <PremiumBackButton fallback="/bookings" />
            </Box>

            <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={7}>
                    <Stack spacing={2}>
                        {cancelled && (
                            <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                                {booking.status === 'cancelled by guest'
                                    ? 'Your guest cancelled this booking and was refunded. Their spots are open again.'
                                    : 'You cancelled this session. Your guest was refunded and emailed.'}
                            </Alert>
                        )}

                        <BookingHeader booking={booking} perspective="host" />

                        <BookingSection title="Details">
                            <Stack spacing={2}>
                                <InfoRow icon={<CalendarTodayIcon fontSize="small" />} primary={bookingWhen(booking, { long: true })} />
                                <InfoRow icon={<GroupIcon fontSize="small" />} primary={guestsLabel(booking.numberOfGuests)} />
                                <InfoRow icon={<LocationOnIcon fontSize="small" />} primary={address.line1} secondary={address.line2} />
                            </Stack>
                        </BookingSection>

                        <BookingSection title="Your guest">
                            <PersonRow person={booking.studentID} messageLabel="Message" onMessage={handleMessageStudent} />
                        </BookingSection>

                        {booking.ratedAndReviewed && (
                            <BookingSection title="Their review">
                                <Rating value={booking.rating || 0} readOnly size="small" />
                                {booking.review && <Typography color="text.secondary" sx={{ mt: 1 }}>{booking.review}</Typography>}
                            </BookingSection>
                        )}
                    </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Stack spacing={2} sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
                        <BookingSection title="Payment">
                            <Stack spacing={1}>
                                <PriceRow label={`${guestsLabel(booking.numberOfGuests)} × ${formatMoney(course.pricePerStudent)}`} value={formatMoney((course.pricePerStudent || 0) * (booking.numberOfGuests || 1))} />
                                <Divider sx={{ my: 0.5 }} />
                                <PriceRow label="Guest paid" value={formatMoney(booking.total)} strong />
                            </Stack>
                        </BookingSection>
                        <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                            Booking reference {String(booking._id).slice(-8).toUpperCase()}
                            {booking.timestamp ? ` · booked ${new Date(booking.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                        </Typography>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
        </>
    )
}

export default SingleBookingPage
