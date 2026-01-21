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
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../../store';
import Payment from './Payment';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { PremiumButton } from '../../ui/PremiumButton';
import { PremiumCard } from '../../ui/PremiumCard';

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
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        PaperProps={{
          sx: { bgcolor: isSuccess ? 'background.paper' : '#FAFAFA' }
        }}
      >
        <AppBar sx={{ position: 'relative', bgcolor: 'background.paper', color: 'text.primary', boxShadow: 'none', borderBottom: '1px solid #F0F0F0' }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1, fontWeight: 800 }} variant="h6">
              {isSuccess ? 'Reservation Confirmed' : 'Confirm Reservation'}
            </Typography>
            <IconButton edge="start" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" sx={{ py: 6 }}>
          {isSuccess ? (
            <Fade in={true} timeout={800}>
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>You're booked!</Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                  Pack your bags, you're going to {props.courseTitle}.
                </Typography>

                <PremiumCard sx={{ p: 3, textAlign: 'left', mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Reservation Details
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Artist</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{props.teacherFullName}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Date</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{formatDate(props.selectedDateAndTime.startDate)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Time</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{timeConverter(props.selectedDateAndTime.startTime)}</Typography>
                    </Box>
                  </Stack>
                </PremiumCard>

                <Stack spacing={2}>
                  <PremiumButton
                    variant="contained"
                    fullWidth
                    startIcon={<MessageIcon />}
                    onClick={handleMessageHost}
                    sx={{ py: 2 }}
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
                      sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                    >
                      View Booking
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<CalendarTodayIcon />}
                      sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                    >
                      Add to Calendar
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Fade>
          ) : (
            <Stack spacing={4}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                  {props.courseTitle}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                  with {props.teacherFullName}
                </Typography>
              </Box>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E0E0E0', bgcolor: 'white' }}>
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Date</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{formatDate(props.selectedDateAndTime.startDate)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Time</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{timeConverter(props.selectedDateAndTime.startTime)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Guests</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{props.guests}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Total</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>${props.total}</Typography>
                  </Box>
                </Stack>
              </Paper>

              <Box>
                <Payment
                  item={props}
                  paymentMetadata={paymentMetadata}
                  stripeID={props.stripeID}
                  bookThisCourse={bookThisCourse}
                  onBookingSuccess={handleBookingSuccess}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 4 }}>
                By confirming, you agree to the Studio Time Guest Policy and Cancellation Policy.
              </Typography>
            </Stack>
          )}
        </Container>
      </Dialog>
    </Box>
  );
}


