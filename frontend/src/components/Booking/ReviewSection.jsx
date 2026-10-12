import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Rating, Stack, TextField, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useToast } from '../../ui/feedback';
import Mascot from '../../ui/Mascot';
import { BookingSection, fullName } from './BookingParts';

const MAX_LENGTH = 1000;
const LABELS = { 1: 'Not great', 2: 'Okay', 3: 'Good', 4: 'Great', 5: 'Amazing' };

/**
 * On a past booking: the guest's review, or a short form to leave one (stars required,
 * words optional). Opened with #review (from the list and the review email) it scrolls into view.
 */
const ReviewSection = ({ booking, onReviewed }) => {
    const axiosPrivate = useAxiosPrivate();
    const toast = useToast();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(-1);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const ref = useRef(null);
    const artist = booking?.teacherID?.firstName || fullName(booking?.teacherID) || 'the artist';

    useEffect(() => {
        if (window.location.hash === '#review') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    if (booking.ratedAndReviewed) {
        return (
            <BookingSection title="Your review">
                <Rating value={booking.rating || 0} readOnly emptyIcon={<StarIcon fontSize="inherit" sx={{ opacity: 0.35 }} />} />
                {booking.review && <Typography color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>{booking.review}</Typography>}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Thanks for helping other guests find great studios.</Typography>
            </BookingSection>
        );
    }

    const submit = async (e) => {
        e.preventDefault();
        if (!rating) {
            setError('Tap a star to rate your session.');
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            const { data } = await axiosPrivate.post(`booking/${booking._id}/review`, { rating, text });
            onReviewed?.(data.booking);
            toast.success('Thanks for your review!');
        } catch (err) {
            const status = err.response?.status;
            setError((status && status !== 404 && status < 500 && err.response?.data?.message)
                || "We couldn't save your review. Please try again.");
            setIsSaving(false);
        }
    };

    return (
        <Box ref={ref} id="review" sx={{ scrollMarginTop: 80 }}>
            <BookingSection title="How was it?">
                <Box component="form" onSubmit={submit} noValidate>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Mascot size={48} motion="none" />
                        <Typography color="text.secondary">
                            Rate your session with {artist}. It helps them and other guests.
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Rating
                            name="session-rating"
                            value={rating}
                            onChange={(_, value) => { setRating(value || 0); setError(''); }}
                            onChangeActive={(_, value) => setHover(value)}
                            size="large"
                            emptyIcon={<StarIcon fontSize="inherit" sx={{ opacity: 0.35 }} />}
                            getLabelText={(value) => `${value} star${value === 1 ? '' : 's'}, ${LABELS[value]}`}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 72 }} aria-live="polite">
                            {LABELS[hover !== -1 ? hover : rating] || ''}
                        </Typography>
                    </Stack>
                    <TextField
                        label="Tell others about it (optional)"
                        multiline
                        minRows={3}
                        fullWidth
                        value={text}
                        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                        helperText={text.length > MAX_LENGTH - 100 ? `${MAX_LENGTH - text.length} characters left` : ' '}
                    />
                    {error && <Typography color="error" variant="body2" role="alert" sx={{ mb: 1 }}>{error}</Typography>}
                    <Button type="submit" variant="contained" disabled={isSaving}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '12px', px: 3, width: { xs: '100%', sm: 'auto' } }}>
                        {isSaving ? 'Saving…' : 'Post review'}
                    </Button>
                </Box>
            </BookingSection>
        </Box>
    );
};

export default ReviewSection;
