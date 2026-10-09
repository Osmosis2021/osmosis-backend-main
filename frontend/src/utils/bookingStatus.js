import { sessionLocalDay } from './sessionTime';

export const isBookingCancelled = (booking) => /^cancelled/.test(booking?.status || '');

/** Whether the booked session's day is still ahead (today counts as upcoming). */
export const isBookingUpcoming = (booking) => {
    if (isBookingCancelled(booking)) return false;
    const day = sessionLocalDay(booking?.date || '');
    if (!day) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day >= today;
};

/** Label and chip color for a booking. */
export const bookingStatusChip = (booking) => {
    if (isBookingCancelled(booking)) return { label: 'Cancelled', color: 'error' };
    if (isBookingUpcoming(booking)) return { label: 'Confirmed', color: 'success' };
    return { label: 'Completed', color: 'default' };
};

/** What a guest should know about the refund for a cancelled booking. */
export const refundMessage = (booking) => {
    if (!isBookingCancelled(booking)) return '';
    if (booking.refundStatus === 'refunded') return 'Your payment has been refunded to your original payment method. It usually appears within 5–10 business days.';
    if (booking.refundStatus === 'not_needed') return '';
    return "Your refund is being processed by the Studio Time team. If you don't see it within 10 business days, contact support.";
};
