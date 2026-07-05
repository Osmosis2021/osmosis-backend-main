import React, { useState } from 'react';
import {
  Button,
  Dialog,
  AppBar,
  Toolbar,
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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../../store';
import Payment from './Payment';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { PremiumButton } from '../../ui/PremiumButton';
import { PremiumCard } from '../../ui/PremiumCard';
import { useTheme, useMediaQuery, Grid } from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PayPopUp(props) {
  const [open, setOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingID, setBookingID] = useState(null);
  const { userID, backendURL, userName, chats, setChats, setSelectedChat } = useStore();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const paymentMetadata = {
    teacherUserName: props.teacherUserName,
    time: props.selectedDateAndTime?.startTime,
    date: props.selectedDateAndTime?.startDate ? String(props.selectedDateAndTime.startDate).split('T')[0] : null
  }

  const handleMessageHost = async () => {
    if (!props.teacherID) {
      navigate('/chat');
      return;
    }
    try {
      const { data } = await axiosPrivate.get(`${backendURL}chat/accessChats/${props.teacherID}?userID=${userID}`);
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      navigate('/chat');
    } catch (err) {
      console.error("Error accessing chat:", err);
      navigate('/chat'); // Fallback
    }
  };

  async function bookThisCourse() {
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
      date: props.selectedDateAndTime.startDate
    }

    const bookingResponse = await axiosPrivate.post(`${backendURL}booking/createBooking`, bookingObj);
    return bookingResponse;
  }

  const handleBookingSuccess = (id) => {
    setBookingID(id);
    setIsSuccess(true);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (isSuccess) {
      navigate(`/students/${userName}`);
    }
    setOpen(false);
    setIsSuccess(false);
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
    if (!inputDate) return '';
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const date = new Date(inputDate);
    return date.toLocaleDateString(undefined, options);
  }

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isDisabled = !props.selectedDateAndTime?.startDate || !userID || !props.stripeID;

  return (
    <Box sx={{ width: props.fullWidth ? '100%' : 'auto' }}>
      <Button
        variant="contained"
        fullWidth={props.fullWidth}
        onClick={handleClickOpen}
        disabled={isDisabled}
        sx={{
          borderRadius: 3,
          py: 2,
          fontWeight: 800,
          fontSize: '1.1rem',
          textTransform: 'none',
          boxShadow: '0 8px 24px rgba(0,174,239,0.25)',
          '&:hover': {
            boxShadow: '0 12px 32px rgba(0,174,239,0.35)',
          },
          '&.Mui-disabled': {
            bgcolor: !props.stripeID ? 'action.disabledBackground' : undefined
          }
        }}
      >
        {!props.selectedDateAndTime?.startDate ? "Select Date First" :
          !userID ? "Sign in to Reserve" :
            !props.stripeID ? "Payments Unavailable" : "Reserve Now"}
      </Button>
      {!props.stripeID && userID && props.selectedDateAndTime?.startDate && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center', fontWeight: 600 }}>
          This artist hasn't enabled payments yet.
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
            {isSuccess ? 'Reservation Confirmed' : 'Checkout'}
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
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
                    Pack your bags, you're going to {props.courseTitle}. We've sent a confirmation email to you.
                  </Typography>

                  <PremiumCard sx={{ p: 3, textAlign: 'left', mb: 4, width: '100%', maxWidth: 450 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
                      Reservation Details
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
                        By confirming your reservation, you agree to the Studio Time Guest Policy and host's cancellation terms.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Column: Payment */}
                <Grid item xs={12} md={7}>
                  <PremiumCard sx={{ p: { xs: 2.5, md: 4 }, bgcolor: 'white', height: '100%', overflow: 'visible' }}>
                    <Box sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Payment</Typography>
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
                        boxShadow: '0 0 0 4px rgba(0,174,239,0.05)'
                      }
                    }}>
                      <Payment
                        item={props}
                        paymentMetadata={paymentMetadata}
                        stripeID={props.stripeID}
                        bookThisCourse={bookThisCourse}
                        onBookingSuccess={handleBookingSuccess}
                      />
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


