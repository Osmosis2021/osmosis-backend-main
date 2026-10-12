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
  Fade,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../../store';
import Payment from './Payment';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { PremiumButton } from '../../ui/PremiumButton';
import { PremiumCard } from '../../ui/PremiumCard';
import { useTheme, useMediaQuery, Grid } from '@mui/material';
import useStartChat from '../../hooks/useStartChat';
import { formatSessionDate } from '../../utils/sessionTime';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_GUEST = { firstName: '', lastName: '', email: '' };

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
        PaperProps={{
          sx: {
            bgcolor: isSuccess ? 'background.paper' : '#FAFAFA',
            borderRadius: isMobile ? 0 : 5,
            boxShadow: isMobile ? 'none' : '0 24px 64px rgba(0,0,0,0.15)',
            overflow: 'visible',          // ✅ do NOT clip Stripe
            display: 'flex',
            flexDirection: 'column',
            maxHeight: isMobile ? '100vh' : 'calc(100vh - 64px)',
            minHeight: 0,
          }
        }}
      >
        {/* Unified Mobile/Desktop Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 },
          py: 2,
          bgcolor: 'background.paper',
          borderRadius: isMobile ? 0 : 5,
          borderBottom: '1px solid #F0F0F0',
          zIndex: 1, // Keep above scrollable content
        }}>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            {isSuccess ? 'Booking confirmed' : 'Checkout'}
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ bgcolor: '#F5F5F5' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          <Container maxWidth={isSuccess ? "sm" : "md"} sx={{ py: { xs: 3, md: 4 } }}>
            {isSuccess ? (
              <Fade in={true} timeout={400}>
                <Box sx={{ textAlign: 'center', mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
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

                  <PremiumCard sx={{ p: 3, textAlign: 'left', mb: 4, width: '100%', maxWidth: 450 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
                      Booking details
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Artist</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{props.teacherFullName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDate(props.selectedDateAndTime.startDate)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{timeConverter(props.selectedDateAndTime.startTime)}</Typography>
                      </Box>
                    </Stack>
                  </PremiumCard>

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
                          Return to Dashboard
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
              </Fade>
            ) : (
              <Grid container spacing={{ xs: 4, md: 6 }}>
                {/* Left Column: Summary */}
                <Grid item xs={12} md={5}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, lineHeight: 1.2 }}>
                        {props.courseTitle}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Hosted by {props.teacherFullName}
                      </Typography>
                    </Box>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #EEE', bgcolor: 'white' }}>
                      <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 2 }}>
                        Summary
                      </Typography>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Date</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDate(props.selectedDateAndTime.startDate)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Time</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{timeConverter(props.selectedDateAndTime.startTime)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Guests</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{props.guests}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Total Due</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>${props.total}</Typography>
                        </Box>
                      </Stack>
                    </Paper>

                    <Box sx={{ px: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                        <strong>Free cancellation until the day before your session</strong> for a full refund.
                        By booking, you agree to the Studio Time <Link to="/termsofservice">Terms of Service</Link>.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Column: Payment */}
                <Grid item xs={12} md={7}>
                  <PremiumCard sx={{ p: { xs: 2.5, md: 4 }, bgcolor: 'white', height: '100%', overflow: 'visible' }}>
                    <Box sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{isGuestCheckout && !guestDetails ? 'Your details' : 'Payment'}</Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.3,
                          bgcolor: 'success.light',
                          color: 'success.dark',
                          borderRadius: 1,
                          opacity: 0.8
                        }}>
                          <LockIcon sx={{ fontSize: 12 }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Secure</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Your payment information is encrypted and secure.
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid #E0E0E0',
                      bgcolor: '#FCFCFC',
                      transition: 'border-color 0.2s ease',
                      overflow: 'visible', // ✅ ensure stripe not clipped
                      '&:focus-within': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 4px rgba(10, 10, 10, 0.025)'
                      }
                    }}>
                      {isGuestCheckout && !guestDetails ? (
                        <GuestDetailsForm value={guestDetails} onSubmit={setGuestDetails} onLogIn={goToLogin} />
                      ) : (
                        <Stack spacing={2}>
                          {isGuestCheckout && (
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
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
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3, opacity: 0.6 }}>
                      {['visa', 'mastercard', 'amex', 'applepay'].map((brand) => (
                        <Box
                          key={brand}
                          component="img"
                          src={`https://js.stripe.com/v3/fingerprinted/img/checkout-payment-methods/${brand}-8466657906d4e2d3d0f0119e7a836ca3.svg`}
                          sx={{ height: 20, filter: 'grayscale(1)' }}
                        />
                      ))}
                    </Stack>
                  </PremiumCard>
                </Grid>
              </Grid>
            )}
          </Container>
        </Box>
      </Dialog>
    </Box>
  );
}


