import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MessageIcon from '@mui/icons-material/Message';
import { PremiumCard } from '../../ui/PremiumCard';
import Mascot from '../../ui/Mascot';
import { isBookingCancelled, isBookingUpcoming } from '../../utils/bookingStatus';
import { formatClockTime, formatSessionDate } from '../../utils/sessionTime';

// Shared building blocks for booking lists and booking pages (guest and artist views).

export const fullName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(' ');

export const guestsLabel = (count) => `${count || 1} ${count === 1 ? 'guest' : 'guests'}`;

/** "Sat, Oct 17 · 2:00 PM" (or the long form for booking pages). */
export const bookingWhen = (booking, { long = false } = {}) => {
    const date = formatSessionDate(booking?.date || '', long
        ? { weekday: 'long', month: 'long', day: 'numeric' }
        : { weekday: 'short', month: 'short', day: 'numeric' });
    const time = formatClockTime(booking?.time) || booking?.time;
    return [date, time].filter(Boolean).join(' · ');
};

/** Status for a booking, from the point of view of the guest or the artist. */
export const bookingStatus = (booking, perspective = 'guest') => {
    if (isBookingCancelled(booking)) {
        const byGuest = booking.status === 'cancelled by guest';
        if (perspective === 'guest') return { label: byGuest ? 'You cancelled' : 'Cancelled by artist', color: 'error' };
        return { label: byGuest ? 'Guest cancelled' : 'You cancelled', color: 'error' };
    }
    if (isBookingUpcoming(booking)) return { label: 'Confirmed', color: 'success' };
    return { label: 'Completed', color: 'default' };
};

/** Listing photo, or the mascot when there isn't one. */
export const BookingThumb = ({ booking, size = 64 }) => {
    const image = booking?.courseID?.images?.[0]?.url;
    return (
        <Box
            sx={{
                width: size, height: size, flexShrink: 0, borderRadius: '10px', overflow: 'hidden',
                bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            {image
                ? <Box component="img" src={image} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Mascot size={size * 0.62} motion="none" blink={false} />}
        </Box>
    );
};

/**
 * One booking in a list. The whole row opens the booking; `footer` (e.g. a review button)
 * sits underneath, outside the link.
 */
export const BookingListItem = ({ booking, perspective = 'guest', footer }) => {
    const isGuestView = perspective === 'guest';
    const to = isGuestView ? `/student/bookings/${booking._id}` : `/teacher/bookings/${booking._id}`;
    const status = bookingStatus(booking, perspective);
    const subline = isGuestView
        ? `with ${fullName(booking?.teacherID) || 'your artist'}`
        : `${fullName(booking?.studentID) || 'Guest'} · ${guestsLabel(booking.numberOfGuests)} · $${booking.total ?? 0}`;

    return (
        <PremiumCard nohover sx={{ p: 0, overflow: 'hidden' }}>
            <Box
                component={RouterLink}
                to={to}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: 2,
                    color: 'inherit', textDecoration: 'none',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: -3 },
                }}
            >
                <BookingThumb booking={booking} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, lineHeight: 1.3 }} noWrap>
                        {booking?.courseID?.courseTitle || 'Studio time'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{bookingWhen(booking)}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{subline}</Typography>
                    {status.color === 'error' && (
                        <Chip label={status.label} size="small" color="error" variant="outlined" sx={{ fontWeight: 700, mt: 0.75, height: 22 }} />
                    )}
                </Box>
                <ChevronRightIcon sx={{ color: 'text.disabled', flexShrink: 0 }} aria-hidden />
            </Box>
            {footer && (
                <Box sx={{ px: 2, pb: 2, pt: 0 }}>{footer}</Box>
            )}
        </PremiumCard>
    );
};

/** A titled section on a booking page. */
export const BookingSection = ({ title, children, sx = {} }) => (
    <PremiumCard nohover sx={{ p: { xs: 2.5, md: 3 }, ...sx }}>
        {title && (
            <Typography variant="overline" component="h2" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary', letterSpacing: 1, lineHeight: 1.5, mb: 1.5 }}>
                {title}
            </Typography>
        )}
        {children}
    </PremiumCard>
);

/** Icon + main line + optional second line. */
export const InfoRow = ({ icon, primary, secondary }) => (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: 'text.secondary', display: 'flex', pt: 0.25 }} aria-hidden>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{primary}</Typography>
            {secondary && <Typography variant="body2" color="text.secondary">{secondary}</Typography>}
        </Box>
    </Stack>
);

/** The other person on the booking, with a message button. */
export const PersonRow = ({ person, caption, messageLabel, onMessage }) => (
    <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={person?.profileImage?.url} alt="" sx={{ width: 48, height: 48 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }} noWrap>{fullName(person) || '—'}</Typography>
            {caption && <Typography variant="body2" color="text.secondary">{caption}</Typography>}
        </Box>
        {onMessage && (
            <Button variant="outlined" size="small" startIcon={<MessageIcon />} onClick={onMessage}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', flexShrink: 0 }}>
                {messageLabel || 'Message'}
            </Button>
        )}
    </Stack>
);

/** Photo banner, status and title at the top of a booking page. */
export const BookingHeader = ({ booking, perspective = 'guest' }) => {
    const image = booking?.courseID?.images?.[0]?.url;
    const status = bookingStatus(booking, perspective);
    return (
        <Box>
            {image && (
                <Box component="img" src={image} alt=""
                    sx={{ width: '100%', aspectRatio: '16 / 9', maxHeight: 260, objectFit: 'cover', borderRadius: '14px', display: 'block', mb: 2 }} />
            )}
            <Chip label={status.label} size="small" color={status.color} variant={status.color === 'default' ? 'filled' : 'outlined'} sx={{ fontWeight: 700, mb: 1 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 900, fontSize: { xs: '1.6rem', md: '2.1rem' }, lineHeight: 1.2 }}>
                {booking?.courseID?.courseTitle || 'Studio time'}
            </Typography>
        </Box>
    );
};

/** Address lines for the booking's studio. */
export const studioAddress = (course) => {
    const details = course?.addressDetails || {};
    const line1 = details.line1 || course?.address;
    const cityLine = [details.city || course?.city, [details.state || course?.state, details.zipCode || course?.zipCode].filter(Boolean).join(' ')]
        .filter(Boolean).join(', ');
    return { line1: line1 || cityLine || 'Address shared by the artist', line2: line1 ? cityLine : '' };
};

export const PriceRow = ({ label, value, strong = false }) => (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color={strong ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: strong ? 800 : 400 }}>{label}</Typography>
        <Typography sx={{ fontWeight: strong ? 900 : 700 }}>{value}</Typography>
    </Stack>
);

export const formatMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
