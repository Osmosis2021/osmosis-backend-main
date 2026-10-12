import {
  Avatar,
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Tabs,
  Tab,
  Button,
  useTheme
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useStore from "../../../store";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import useLogout from "../../../hooks/useLogout";
import { PremiumCard } from "../../../ui/PremiumCard";
import { PremiumButton } from "../../../ui/PremiumButton";
import { PremiumSectionHeader } from "../../../ui/PremiumSectionHeader";
import PremiumEmptyState from "../../../ui/PremiumEmptyState";
import { isBookingCancelled, isBookingUpcoming } from '../../../utils/bookingStatus';
import { sessionLocalDay } from '../../../utils/sessionTime';
import { BookingListItem } from '../../Booking/BookingParts';

const StudentProfile = () => {
  const logout = useLogout();
  const axiosPrivate = useAxiosPrivate();
  const theme = useTheme();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [userInfo, setUserInfo] = useState({});
  const [bookings, setBookings] = useState([]);
  const { userName } = useStore();
  const pageUserName = useParams()?.userName;

  useEffect(() => {
    axiosPrivate.get(`booking/bookings/${pageUserName}`).then((response) => {
      setBookings(response.data);
    });
  }, [pageUserName, axiosPrivate]);

  useEffect(() => {
    axiosPrivate.get(`user/getUserInfo/${pageUserName}`)
      .then((res) => setUserInfo(res.data))
      .catch((err) => console.log("Error getting user info:", err));
  }, [pageUserName, axiosPrivate]);

  const sortedBookings = useMemo(() => {
    const upcoming = bookings.filter(b => isBookingUpcoming(b))
      .sort((a, b) => sessionLocalDay(a.date) - sessionLocalDay(b.date));

    const past = bookings.filter(b => !isBookingUpcoming(b))
      .sort((a, b) => sessionLocalDay(b.date) - sessionLocalDay(a.date));

    return { upcoming, past };
  }, [bookings]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const isOwnProfile = userInfo.userName && userInfo.userName === userName;

  // Past sessions the guest went to and hasn't reviewed yet get a nudge.
  const reviewFooter = (booking) => {
    if (!isOwnProfile || isBookingCancelled(booking) || isBookingUpcoming(booking) || booking.ratedAndReviewed) return null;
    return (
      <Button component={Link} to={`/student/bookings/${booking._id}#review`} variant="outlined" size="small" startIcon={<StarBorderIcon />}
        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
        Leave a review
      </Button>
    );
  };

  const BookingList = ({ items }) => (
    <Stack spacing={1.5}>
      {items.map((booking) => (
        <BookingListItem key={booking._id} booking={booking} perspective="guest" footer={reviewFooter(booking)} />
      ))}
    </Stack>
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

          {/* Bookings */}
          <Grid item xs={12} md={8}>
            <PremiumSectionHeader
              title="My bookings"
              subtitle="Manage your upcoming and past studio sessions"
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="Booking tabs">
                <Tab label={`Upcoming (${sortedBookings.upcoming.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
                <Tab label={`Past (${sortedBookings.past.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <Box>
                {sortedBookings.upcoming.length > 0 ? (
                  <BookingList items={sortedBookings.upcoming} />
                ) : (
                  <PremiumEmptyState
                    title="No upcoming sessions"
                    subtitle="Find a studio that inspires you and book your first session."
                    actionLabel="Explore studio times"
                    onAction={() => navigate('/explore')}
                  />
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                {sortedBookings.past.length > 0 ? (
                  <BookingList items={sortedBookings.past} />
                ) : (
                  <PremiumEmptyState
                    title="No past sessions"
                    subtitle="Sessions you\'ve been to will appear here."
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

