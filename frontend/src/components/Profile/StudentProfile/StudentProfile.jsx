import {
  Avatar,
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Tabs,
  Tab,
  Chip,
  Divider,
  IconButton,
  Button,
  useTheme,
  useMediaQuery
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import MessageIcon from '@mui/icons-material/Message';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useStore from "../../../store";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import useLogout from "../../../hooks/useLogout";
import TERMS from "../../../constants/terms";
import { PremiumCard } from "../../../ui/PremiumCard";
import { PremiumButton } from "../../../ui/PremiumButton";
import { PremiumSectionHeader } from "../../../ui/PremiumSectionHeader";
import PremiumEmptyState from "../../../ui/PremiumEmptyState";
import { PremiumBackButton } from "../../../ui/PremiumBackButton";

const StudentProfile = () => {
  const logout = useLogout();
  const axiosPrivate = useAxiosPrivate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [userInfo, setUserInfo] = useState({});
  const [bookings, setBookings] = useState([]);
  const { backendURL, userID, userName } = useStore();
  const pageUserName = useParams()?.userName;

  useEffect(() => {
    axiosPrivate.get(`booking/bookings/${pageUserName}`).then((response) => {
      setBookings(response.data);
    });
  }, [pageUserName]);

  useEffect(() => {
    axiosPrivate.get(`${backendURL}user/getUserInfo/${pageUserName}`)
      .then((res) => setUserInfo(res.data))
      .catch((err) => console.log("Error getting user info:", err));
  }, [pageUserName]);

  const sortedBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = bookings.filter(b => new Date(b.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const past = bookings.filter(b => new Date(b.date) < today)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return { upcoming, past };
  }, [bookings]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChip = (booking) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.date);

    if (bookingDate < today) {
      return <Chip label="Completed" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(0,0,0,0.05)', color: 'text.secondary' }} />;
    }
    return <Chip label="Upcoming" size="small" color="primary" sx={{ fontWeight: 700 }} />;
  };

  const ReservationItem = ({ booking }) => (
    <PremiumCard sx={{ p: 0, mb: 2, overflow: 'hidden' }}>
      <Grid container>
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              height: { xs: 140, md: '100%' },
              backgroundImage: `url(${booking?.courseID?.images?.[0]?.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  {getStatusChip(booking)}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    ID: {booking._id.slice(-6).toUpperCase()}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {booking?.courseID?.courseTitle}
                </Typography>
              </Box>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Date & Time</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} @ {booking.time}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationOnIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {booking?.courseID?.address || 'Remote'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar src={booking?.teacherID?.profileImage?.url} sx={{ width: 24, height: 24 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Artist</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {booking?.teacherID?.firstName} {booking?.teacherID?.lastName}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                size="small"
                startIcon={<MessageIcon />}
                sx={{ fontWeight: 700, textTransform: 'none' }}
                onClick={async () => {
                  if (!userID) {
                    alert("Please log in to message artists.");
                    navigate('/');
                    return;
                  }
                  if (!booking?.teacherID?._id) {
                    alert("Could not identify the artist. Please try again.");
                    return;
                  }
                  try {
                    const { data } = await axiosPrivate.get(`${backendURL}chat/accessChats/${booking.teacherID._id}?userID=${userID}`);
                    const { chats, setChats, setSelectedChat } = useStore.getState();
                    if (!chats.find((c) => c._id === data._id)) {
                      setChats([data, ...chats]);
                    }
                    setSelectedChat(data);
                    navigate('/chat');
                  } catch (err) {
                    console.error("Error accessing chat:", err);
                    navigate('/chat');
                  }
                }}
              >
                Message Artist
              </Button>
              <PremiumButton
                size="small"
                variant="outlined"
                component={Link}
                to={`/student/bookings/${booking._id}`}
                sx={{ px: 3 }}
              >
                View Details
              </PremiumButton>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </PremiumCard>
  );

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', pb: 10 }}>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          {/* Profile Sidebar */}
          <Grid item xs={12} md={4}>
            <PremiumCard sx={{ p: 4, textAlign: 'center', position: 'sticky', top: 100 }}>
              <Avatar
                src={userInfo?.profileImage?.url}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, border: '4px solid white', boxShadow: theme.shadows[3] }}
              />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {userInfo.firstName} {userInfo.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                @{userInfo.userName}
              </Typography>

              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', fontStyle: userInfo?.description ? 'normal' : 'italic' }}>
                {userInfo?.description || "No bio added yet."}
              </Typography>

              {userInfo.userName === userName && (
                <Stack spacing={2}>
                  <PremiumButton
                    variant="contained"
                    fullWidth
                    startIcon={<EditIcon />}
                    component={Link}
                    to="/edit"
                  >
                    Edit Profile
                  </PremiumButton>
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => logout("/")}
                    sx={{ fontWeight: 700 }}
                  >
                    Logout
                  </Button>
                </Stack>
              )}
            </PremiumCard>
          </Grid>

          {/* Reservations Content */}
          <Grid item xs={12} md={8}>
            <PremiumSectionHeader
              title="My Reservations"
              subtitle="Manage your upcoming and past studio sessions"
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="reservation tabs">
                <Tab label={`Upcoming (${sortedBookings.upcoming.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
                <Tab label={`Past (${sortedBookings.past.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <Box>
                {sortedBookings.upcoming.length > 0 ? (
                  sortedBookings.upcoming.map(booking => (
                    <ReservationItem key={booking._id} booking={booking} />
                  ))
                ) : (
                  <PremiumEmptyState
                    title="No upcoming sessions"
                    subtitle="Explore the studio and book your first experience today."
                    actionLabel="Explore Experiences"
                    onAction={() => navigate('/explore')}
                  />
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                {sortedBookings.past.length > 0 ? (
                  sortedBookings.past.map(booking => (
                    <ReservationItem key={booking._id} booking={booking} />
                  ))
                ) : (
                  <PremiumEmptyState
                    title="No past sessions"
                    subtitle="Your completed experiences will appear here."
                  />
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StudentProfile;

