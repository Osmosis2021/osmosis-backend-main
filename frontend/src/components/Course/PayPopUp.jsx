import React, { useState } from 'react';
import {
  Alert,
  Button,
  TextField,
  Dialog,
  IconButton,
  Typography,
  Container,
  Stack,
  Box,
  Divider,
  Slide,
  Fade
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../../store';
import Payment from './Payment';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { PremiumButton } from '../../ui/PremiumButton';
import { useTheme, useMediaQuery, Grid } from '@mui/material';
import useStartChat from '../../hooks/useStartChat';
import { formatSessionDate } from '../../utils/sessionTime';
import Mascot from '../../ui/Mascot';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_GUEST = { firstName: '', lastName: '', email: '' };

const SummaryRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>{value}</Typography>
  </Stack>
);

/** Name and email for booking without an account. */
function GuestDetailsForm({ value, onSubmit, onLogIn }) {
  const [form, setForm] = useState(value || EMPTY_GUEST);
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const submit = (e) => {
    e.preventDefault();
    const trimmed = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() };
    const nextErrors = {};
    if (!trimmed.firstName) nextErrors.firstName = 'Please enter your first name.';
    if (!trimmed.lastName) nextErrors.lastName = 'Please enter your last name.';
    if (!EMAIL_PATTERN.test(trimmed.email)) nextErrors.email = 'Please enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(trimmed);
  };

  return (
    <Box component="form" noValidate onSubmit={submit}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          No account needed. We'll email your confirmation here.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="First name" autoComplete="given-name" value={form.firstName} onChange={update('firstName')}
            error={Boolean(errors.firstName)} helperText={errors.firstName} fullWidth required />
          <TextField label="Last name" autoComplete="family-name" value={form.lastName} onChange={update('lastName')}
            error={Boolean(errors.lastName)} helperText={errors.lastName} fullWidth required />
        </Stack>
        <TextField label="Email" type="email" autoComplete="email" inputProps={{ inputMode: 'email', autoCapitalize: 'none' }}
          value={form.email} onChange={update('email')} error={Boolean(errors.email)} helperText={errors.email} fullWidth required />
        <PremiumButton type="submit" variant="contained" fullWidth sx={{ py: 1.8 }}>
          Continue to payment
        </PremiumButton>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Have an account?{' '}
          <Button variant="text" onClick={onLogIn} sx={{ textTransform: 'none', fontWeight: 700, p: 0, minWidth: 0, verticalAlign: 'baseline' }}>
            Log in
          </Button>
        </Typography>
      </Stack>
    </Box>
  );
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PayPopUp(props) {
  const [open, setOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingID, setBookingID] = useState(null);
  // Booking without an account: name + email, then payment.
  const [guestDetails, setGuestDetails] = useState(null);
  const [guestResult, setGuestResult] = useState(null); // { email, needsPassword } after a guest booking
  const { userID, userName } = useStore();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const startChat = useStartChat();

  const paymentMetadata = {
    teacherUserName: props.teacherUserName,
    time: props.selectedDateAndTime?.startTime,
    date: props.selectedDateAndTime?.startDate ? String(props.selectedDateAndTime.startDate).split('T')[0] : null
  }

  const handleMessageHost = () => startChat(props.teacherID, { personLabel: 'this artist' });

  async function bookThisCourse(paymentIntentID) {
    const bookingObj = {
      timestamp: Date.now(),
      numberOfGuests: props.guests,
      total: props.total,
      courseTimeslotID: props.selectedTimeslotID,
      courseID: props.courseID,
      teacherID: props.teacherID,
      studentID: userID,
      studentUserName: props.studentUserName,
      teacherUserName: props.teacherUserName,
      time: props.selectedDateAndTime.startTime,
      date: props.selectedDateAndTime.startDate,
      paymentIntentID,
    }

    const bookingResponse = await axiosPrivate.post(`booking/createBooking`, bookingObj);
    return bookingResponse;
  }

  const handleBookingSuccess = (id, data) => {
    setBookingID(id);
    setGuestResult(data?.guestCheckout || null);
    setIsSuccess(true);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (isSuccess && userID) {
      navigate(`/students/${userName}`);
    }
    setOpen(false);
    setIsSuccess(false);
    setGuestResult(null);
  };

  const timeConverter = (rawTime) => {
    if (!rawTime) return '';
    const array = rawTime.split(':');
    const parsedInput = parseInt(array[0])
    const suffix = parsedInput >= 12 ? "PM" : "AM";
    const newTime = ((parsedInput + 11) % 12 + 1);
    return (newTime + ':' + array[1] + suffix);
  }

  function formatDate(inputDate) {
    return formatSessionDate(inputDate || '', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const location = useLocation();
  const hasDate = Boolean(props.selectedDateAndTime?.startDate);
  const isOwnListing = Boolean(userID) && props.teacherUserName === userName;
  // Signed-out guests can tap through to log in; everything else must be ready to pay.
  // Artists can only take bookings once Stripe can pay them out.
  const paymentsReady = Boolean(props.paymentsReady && props.stripeID);
  const isDisabled = !hasDate || isOwnListing || !paymentsReady;

  // Log in, then come back to this listing with the same session selected.
  const goToLogin = () => {
    const search = props.selectedTimeslotID ? `?session=${props.selectedTimeslotID}` : location.search;
    navigate('/', { state: { from: { pathname: location.pathname, search } } });
  };

  const handleReserveClick = () => handleClickOpen();
  const isGuestCheckout = !userID;

  return (
    <Box sx={{ width: props.fullWidth ? '100%' : 'auto' }}>
      <Button
        variant="contained"
        fullWidth={props.fullWidth}
        onClick={handleReserveClick}
        disabled={isDisabled}
        sx={{
          borderRadius: 3,
          py: 2,
          fontWeight: 800,
          fontSize: '1.1rem',
          textTransform: 'none',
          boxShadow: '0 8px 24px rgba(10, 10, 10, 0.125)',
          '&:hover': {
            boxShadow: '0 12px 32px rgba(10, 10, 10, 0.175)',
          },
          '&.Mui-disabled': {
            bgcolor: !paymentsReady ? 'action.disabledBackground' : undefined
          }
        }}
      >
        {isOwnListing ? "This is your studio time" :
          !paymentsReady ? "Bookings open soon" :
            !hasDate ? "Choose a date to continue" : "Reserve now"}
      </Button>
      {!paymentsReady && !isOwnListing && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          This artist is still setting up payments. Check back soon, or message them in the meantime.
        </Typography>
      )}

      <Dialog
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        aria-labelledby="checkout-title"
        // Above the phone's sticky Reserve bar and bottom navigation (which otherwise cover the
        // bottom of checkout). Toasts and confirmation dialogs still sit above this.
        sx={{ zIndex: 200000 }}
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            borderRadius: isMobile ? 0 : '16px',
            boxShadow: isMobile ? 'none' : '0 24px 64px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: isMobile ? '100dvh' : 'calc(100dvh - 64px)',
            minHeight: 0,
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}>
          <Typography id="checkout-title" sx={{ fontWeight: 800 }} variant="h6" component="h2">
            {isSuccess ? 'Booking confirmed' : 'Checkout'}
          </Typography>
          <IconButton onClick={handleClose} size="small" aria-label={isSuccess ? 'Close' : 'Close checkout'} sx={{ bgcolor: 'background.paper' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, pb: 'env(safe-area-inset-bottom)' }}>

          <Container maxWidth={isSuccess ? "sm" : "md"} sx={{ py: { xs: 2.5, md: 4 }, px: { xs: 2, md: 3 } }}>
            {isSuccess ? (
              <Fade in={true} timeout={400}>
                <Box sx={{ textAlign: 'center', mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', py: 4 }}>
                  {/* The cube hops for joy, with a check so the success is unmistakable. */}
                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <Mascot size={104} motion="hop" />
                    <CheckCircleIcon sx={{ position: 'absolute', right: -6, bottom: 4, fontSize: 34, color: 'success.main', bgcolor: 'background.default', borderRadius: '50%' }} aria-hidden />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>You're booked!</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: guestResult ? 2 : 4, maxWidth: 400 }}>
                    You're going to {props.courseTitle}. We've sent a confirmation email to {guestResult?.email || 'you'}.
                  </Typography>
                  {guestResult && (
                    <Alert severity="info" sx={{ mb: 4, maxWidth: 450, textAlign: 'left', borderRadius: 3 }}>
                      {guestResult.needsPassword
                        ? 'Open that email and tap "Set a password" to see your booking, message the artist or cancel if plans change.'
                        : 'You already have an account with this email. Log in to see your booking, message the artist or cancel if plans change.'}
                    </Alert>
                  )}

                  <Box sx={{ p: 2.5, textAlign: 'left', mb: 4, width: '100%', maxWidth: 450, bgcolor: 'background.paper', borderRadius: '12px' }}>
                    <Stack spacing={1.5}>
                      <SummaryRow label="Artist" value={props.teacherFullName} />
                      <SummaryRow label="Date" value={formatDate(props.selectedDateAndTime.startDate)} />
                      <SummaryRow label="Time" value={timeConverter(props.selectedDateAndTime.startTime)} />
                    </Stack>
                  </Box>

                  {guestResult ? (
                    <Stack spacing={2} sx={{ width: '100%', maxWidth: 450 }}>
                      {!guestResult.needsPassword && (
                        <PremiumButton variant="contained" fullWidth onClick={goToLogin} sx={{ py: 1.8, borderRadius: 3 }}>
                          Log in
                        </PremiumButton>
                      )}
                      <Button variant="outlined" fullWidth onClick={handleClose}
                        sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>
                        Done
                      </Button>
                    </Stack>
                  ) : (
                    <Stack spacing={2} sx={{ width: '100%', maxWidth: 450 }}>
                      <PremiumButton
                        variant="contained"
                        fullWidth
                        startIcon={<MessageIcon />}
                        onClick={handleMessageHost}
                        sx={{ py: 1.8, borderRadius: 3 }}
                      >
                        Message Artist
                      </PremiumButton>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<VisibilityIcon />}
                          component={Link}
                          to={`/student/bookings/${bookingID}`}
                          sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                        >
                          View Booking
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => navigate(`/students/${userName}`)}
                          sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                        >
                          My bookings
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
              </Fade>
            ) : (
              <Grid container spacing={{ xs: 3, md: 5 }}>
                {/* Summary: one soft panel, no nested borders */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ bgcolor: 'background.paper', borderRadius: '12px', p: { xs: 2.5, md: 3 } }}>
                    <Typography variant="h6" component="p" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                      {props.courseTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Hosted by {props.teacherFullName}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1.25}>
                      <SummaryRow label="Date" value={formatDate(props.selectedDateAndTime.startDate)} />
                      <SummaryRow label="Time" value={timeConverter(props.selectedDateAndTime.startTime)} />
                      <SummaryRow label="Guests" value={`${props.guests} × $${props.pricePerStudent}`} />
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                      <Typography sx={{ fontWeight: 800 }}>Total</Typography>
                      <Typography variant="h5" component="p" sx={{ fontWeight: 900 }}>${props.total}</Typography>
                    </Stack>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5, mt: 1.5, px: 0.5 }}>
                    <strong>Free cancellation until the day before your session</strong> for a full refund.
                    By booking, you agree to the Studio Time <Link to="/termsofservice">Terms of Service</Link>.
                  </Typography>
                </Grid>

                {/* Details and payment, straight on the page */}
                <Grid item xs={12} md={7}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 2 }}>
                    {isGuestCheckout && !guestDetails ? 'Your details' : 'Payment'}
                  </Typography>
                  {isGuestCheckout && !guestDetails ? (
                    <GuestDetailsForm value={guestDetails} onSubmit={setGuestDetails} onLogIn={goToLogin} />
                  ) : (
                    <Stack spacing={2}>
                      {isGuestCheckout && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}
                          sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderRadius: '10px' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                            Booking as <strong>{guestDetails.firstName} {guestDetails.lastName}</strong> · {guestDetails.email}
                          </Typography>
                          <Button size="small" onClick={() => setGuestDetails(null)} sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}>
                            Edit
                          </Button>
                        </Stack>
                      )}
                      <Payment
                        item={props}
                        guest={isGuestCheckout ? guestDetails : null}
                        paymentMetadata={paymentMetadata}
                        stripeID={props.stripeID}
                        bookThisCourse={bookThisCourse}
                        onBookingSuccess={handleBookingSuccess}
                      />
                    </Stack>
                  )}
                </Grid>
              </Grid>
            )}
          </Container>
        </Box>
      </Dialog>
    </Box>
  );
}


