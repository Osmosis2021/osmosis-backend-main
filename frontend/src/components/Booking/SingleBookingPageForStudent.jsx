import { Alert, Box, Button, Container, Divider, Grid, Stack, Typography } from '@mui/material'
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from '../../store';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { PremiumBackButton } from '../../ui/PremiumBackButton';
import Mascot from '../../ui/Mascot';
import useStartChat from '../../hooks/useStartChat';
import { isBookingCancelled, isBookingUpcoming, refundMessage } from '../../utils/bookingStatus';
import { useConfirm, useToast } from '../../ui/feedback';
import {
    BookingHeader, BookingSection, InfoRow, PersonRow, PriceRow,
    bookingWhen, formatMoney, guestsLabel, studioAddress,
} from './BookingParts';
import ReviewSection from './ReviewSection';

// "Friday, November 13 at 11:59 PM": the last moment a guest can cancel for a refund.
const formatDeadline = (deadline) => {
    if (!deadline) return '';
    const lastMinute = new Date(new Date(deadline).getTime() - 60000);
    return `${lastMinute.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${lastMinute.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

function SingleBookingPageForStudent() {
    const axiosPrivate = useAxiosPrivate();
    const { id } = useParams()
    const { backendURL, userName } = useStore();
    const startChat = useStartChat();
    const [booking, setBooking] = useState(null);
    const confirm = useConfirm();
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const handleMessageHost = () => startChat(booking?.teacherID?._id, { personLabel: 'this artist' });

    const handleCancelBooking = async () => {
        let cancelled = null;
        const confirmed = await confirm({
            title: 'Cancel this booking?',
            description: `You'll get a full refund of ${formatMoney(booking.total || 0)} to your original payment method, and your ${booking.numberOfGuests === 1 ? 'spot' : 'spots'} will open up for someone else. This can't be undone.`,
            confirmLabel: 'Cancel booking',
            cancelLabel: 'Keep booking',
            destructive: true,
            errorMessage: "We couldn't cancel your booking. Please try again, or contact support.",
            onConfirm: async () => {
                const { data } = await axiosPrivate.post(`booking/${booking._id}/cancel`);
                cancelled = data.booking;
            },
        });
        if (confirmed && cancelled) {
            // The server returns the bare booking; keep the artist, listing and session details we already have.
            const { status, refundStatus, cancelledAt } = cancelled;
            setBooking((prev) => ({ ...prev, status, refundStatus, cancelledAt, canCancel: false }));
            toast.success(cancelled.refundStatus === 'refunded' ? 'Booking cancelled. Your refund is on its way.' : 'Booking cancelled. Our team will process your refund shortly.');
        }
    };

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
                <PremiumBackButton fallback={`/students/${userName}`} />
            </Stack>
        </Container>
    );

    const course = booking.courseID || {};
    const address = studioAddress(course);
    const cancelled = isBookingCancelled(booking);
    const upcoming = isBookingUpcoming(booking);
    const isOwnBooking = booking.studentUserName === userName;

    return (
        <>
        <TopNavBar />
        <Container maxWidth="md" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 2 }}>
                <PremiumBackButton fallback={`/students/${userName}`} />
            </Box>

            <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={7}>
                    <Stack spacing={2}>
                        {cancelled && (
                            <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                                <strong>{booking.status === 'cancelled by guest' ? 'You cancelled this booking.' : 'The artist cancelled this session.'}</strong> {refundMessage(booking)}
                            </Alert>
                        )}

                        <BookingHeader booking={booking} perspective="guest" />

                        <BookingSection title="Details">
                            <Stack spacing={2}>
                                <InfoRow icon={<CalendarTodayIcon fontSize="small" />} primary={bookingWhen(booking, { long: true })} />
                                <InfoRow icon={<LocationOnIcon fontSize="small" />} primary={address.line1} secondary={address.line2} />
                                <InfoRow icon={<GroupIcon fontSize="small" />} primary={guestsLabel(booking.numberOfGuests)} />
                            </Stack>
                        </BookingSection>

                        <BookingSection title="Your artist">
                            <PersonRow
                                person={booking.teacherID}
                                messageLabel="Message"
                                onMessage={isOwnBooking ? handleMessageHost : undefined}
                            />
                        </BookingSection>

                        {isOwnBooking && !cancelled && !upcoming && (
                            <ReviewSection
                                booking={booking}
                                onReviewed={({ rating, review, ratedAndReviewed, reviewedAt }) => setBooking((prev) => ({ ...prev, rating, review, ratedAndReviewed, reviewedAt }))}
                            />
                        )}

                        {upcoming && (
                            <BookingSection title="What to bring">
                                <Typography color="text.secondary">
                                    {course.whatToBring || "Nothing special: just yourself and a creative spirit."}
                                </Typography>
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
                                <PriceRow label="Total paid" value={formatMoney(booking.total)} strong />
                            </Stack>
                        </BookingSection>

                        {upcoming && booking.freeCancellationUntil && (
                            <BookingSection title="Cancellation">
                                {booking.canCancel ? (
                                    <>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Free cancellation until {formatDeadline(booking.freeCancellationUntil)}. You'll get a full refund.
                                        </Typography>
                                        <Button variant="outlined" color="error" fullWidth onClick={handleCancelBooking}
                                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '12px' }}>
                                            Cancel booking
                                        </Button>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Free cancellation ended {formatDeadline(booking.freeCancellationUntil)}. If something came up, message the artist.
                                    </Typography>
                                )}
                            </BookingSection>
                        )}

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

export default SingleBookingPageForStudent;
