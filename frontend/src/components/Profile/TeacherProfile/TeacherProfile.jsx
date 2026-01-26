import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Skeleton,
  Rating,
  TextField,
  Typography,
  Stack,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { Link, Link as LinkRouter, useNavigate, useParams } from "react-router-dom";
import TopProfileBar from "../../TopNavBar/TopProfileBar";
import SessionCard from "../../SessionCard/SessionCard";
import React, { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MessageIcon from '@mui/icons-material/Message';
import ShareIcon from '@mui/icons-material/Share';
import useStore from "../../../store";
import UserInfo from "../UserInfo";
import "./TeacherProfile.css";
import Prof from "../Prof";
import axios from "../../../actions/axios";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import useLogout from "../../../hooks/useLogout";
import CalendarViewButton from "../CalendarViewButton";
import TERMS from "../../../constants/terms";
import { PremiumSectionHeader } from "../../../ui/PremiumSectionHeader";
import { PremiumCard } from "../../../ui/PremiumCard";
import { PremiumButton } from "../../../ui/PremiumButton";
import { PremiumSkeleton, PremiumEmptyState } from "../../../ui/PremiumFeedback";

import { PremiumBackButton } from "../../../ui/PremiumBackButton";

const TeacherProfile = (props) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const axiosPrivate = useAxiosPrivate();
  const logout = useLogout();
  const [teacherInfo, setTeacherInfo] = useState({ profileImage: {} });
  const [sessionCard, setSessionCard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [unratedAndUnreviewedBooking, setUnratedAndUnreviewedBooking] =
    useState([]);
  const [bookingsTakenAsStudent, setBookingsTakenAsStudent] = useState([]);
  const [classHappened, setClassHappened] = useState([]);
  const { backendURL, userID, userName, isStudent } = useStore();
  const pageUserName = useParams()?.userName;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const _today = new Date();

    const getTeacherBookings = async () => {
      try {
        const resp = await axiosPrivate.get(
          `booking/teacherBookings/${pageUserName}`,
          { signal: controller.signal }
        );
        const teacherClassHappened = resp.data.filter((booking) => {
          const slotDate = new Date(booking.date);
          return slotDate <= _today;
        });
        if (isMounted) {
          setBookings(resp.data);
          console.log("Teacher bookings:", resp.data);
          setClassHappened(teacherClassHappened);
        }
      } catch (err) {
        console.error("Error fetching teacher bookings:", err);
      }
    };

    const getStudentBookings = async () => {
      try {
        if (isStudent) {
          const studentResp = await axiosPrivate.get(
            `booking/bookings/${pageUserName}`,
            { signal: controller.signal }
          );
          if (studentResp.data) {
            const bookingHappenedAndNotReviewed = studentResp.data.filter(
              (booking) => {
                const slotDate = new Date(booking.date);
                return slotDate <= _today && !booking.ratedAndReviewed;
              }
            );
            if (isMounted) {
              setUnratedAndUnreviewedBooking(bookingHappenedAndNotReviewed);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching student bookings:", err);
      }
    };

    getTeacherBookings();
    getStudentBookings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pageUserName, isStudent, axiosPrivate]);

  useEffect(() => {
    const _controller = new AbortController();
    fetch(`${backendURL}course/getCourses/${pageUserName}`, {
      signal: _controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        let courses = Array.isArray(data) ? data : [data];
        setSessionCard(courses);
      })
      .catch((err) => {
        console.log("Error getting courses:\n", err);
      });

    fetch(`${backendURL}user/getUserInfo/${pageUserName}`)
      .then((res) => res.json())
      .then((data) => {
        setTeacherInfo(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("Error getting teacher info:\n", err);
      });
    return () => {
      _controller.abort();
    };
  }, [pageUserName, backendURL]);

  const handleWrittenReview = (event, booking) => {
    const writtenReview = event.target.value;
    setUnratedAndUnreviewedBooking((prevBookings) => {
      return prevBookings.map((prevBooking) => {
        if (prevBooking._id === booking._id) {
          return { ...prevBooking, writtenReview };
        }
        return prevBooking;
      });
    });
  };

  const sendRating = (event, booking) => {
    event.preventDefault();
    const { rating, writtenReview } = booking;
    if (rating && writtenReview) {
      fetch(`${backendURL}course/sendReview/${booking._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: { rating, writtenReview, userID },
        }),
      }).then(() => {
        setUnratedAndUnreviewedBooking((prevBookings) =>
          prevBookings.filter((prevBooking) => prevBooking._id !== booking._id)
        );
      });
    } else {
      alert("Please both rate and review your class");
    }
  };

  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    if (teacherInfo?.stripeID) {
      fetch(`${backendURL}stripe/retrieveStripeAccount/${teacherInfo.stripeID}`)
        .then((res) => res.json())
        .then((data) => {
          setIsOnboarded(data?.retrieveAccount?.payouts_enabled || false);
        })
        .catch(console.error);
    }
  }, [teacherInfo, backendURL]);

  if (isLoading) return <PremiumSkeleton type="detail" />;

  const isOwnProfile = teacherInfo.userName === userName;

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh' }}>



      {/* Premium Header */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid #F0F0F0', pt: { xs: 4, md: 8 }, pb: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
              <Avatar
                src={teacherInfo?.profileImage?.url}
                sx={{
                  width: { xs: 120, md: 180 },
                  height: { xs: 120, md: 180 },
                  mx: 'auto',
                  border: '4px solid #FFF',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                }}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                      {teacherInfo.firstName} {teacherInfo.lastName}
                    </Typography>
                    <VerifiedIcon color="primary" sx={{ fontSize: 28 }} />
                  </Stack>
                  <Stack direction="row" spacing={2} color="text.secondary">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <LocationOnIcon fontSize="small" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {teacherInfo.city || 'Brooklyn, NY'}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      @{teacherInfo.userName}
                    </Typography>
                  </Stack>
                </Box>

                <Typography variant="body1" sx={{ maxWidth: 600, color: 'text.secondary', lineHeight: 1.7 }}>
                  {teacherInfo.description || "Artist and educator sharing the creative process with the community."}
                </Typography>

                <Stack direction="row" spacing={2}>
                  {!isOwnProfile && (
                    <PremiumButton
                      startIcon={<MessageIcon />}
                      onClick={async () => {
                        if (!userID) {
                          alert("Please log in to message artists.");
                          navigate("/");
                          return;
                        }
                        if (!teacherInfo?._id) {
                          alert("Could not identify the artist. Please try again.");
                          return;
                        }
                        try {
                          const { data } = await axiosPrivate.get(
                            `${backendURL}chat/accessChats/${teacherInfo._id}?userID=${userID}`
                          );
                          const { chats, setChats, setSelectedChat } = useStore.getState();
                          if (!chats.find((c) => c._id === data._id)) {
                            setChats([data, ...chats]);
                          }
                          setSelectedChat(data);
                          navigate("/chat");
                        } catch (err) {
                          console.error("Error accessing chat:", err);
                          navigate("/chat");
                        }
                      }}
                    >
                      Message Artist
                    </PremiumButton>
                  )}
                  {isOwnProfile && (
                    <>
                      <PremiumButton
                        style={{ borderRadius: 24, fontWeight: 700, textTransform: 'none' }}
                        component={Link}
                        to="/FLOW"
                        startIcon={<AddIcon />

                        }
                      >
                        Studio Time
                      </PremiumButton>
                      <Button
                        component={Link}
                        to="/edit"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                      >
                        Edit Profile
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          {/* Stats Row */}
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {[
              { label: 'Sessions Hosted', value: bookings.length },
              { label: 'Avg Rating', value: '4.9' },
              { label: 'Response Time', value: '< 2 hrs' }
            ].map((stat, i) => (
              <Grid item xs={4} key={i}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#F9F9F9', borderRadius: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Stripe Onboarding Alert */}
        {isOwnProfile && !isOnboarded && (
          <PremiumCard sx={{ mb: 6, bgcolor: 'rgba(0,174,239,0.05)', border: '1px dashed #000000', borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} padding={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Finish Setting Up Your Studio</Typography>
                <Typography variant="body2" color="text.secondary">Onboard to Stripe to process payments and get paid for your sessions.</Typography>
              </Box>
              <Button
                component={Link}
                to={`/stripeonboarding/${userName}`}
                variant="contained"
                sx={{ borderRadius: 3, fontWeight: 700, px: 4 }}
              >
                Setup Stripe
              </Button>
            </Stack>
          </PremiumCard>
        )}

        {/* Upcoming Sessions for Host */}
        {isOwnProfile && bookings.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <PremiumSectionHeader title="Your Upcoming Sessions" subtitle="Manage your upcoming studio visits." />
            <Grid container spacing={3}>
              {bookings
                .filter(b => new Date(b.date) > new Date())
                .map(booking => (
                  <Grid item xs={12} md={6} key={booking._id}>
                    <PremiumCard component={Link} to={`/teacher/bookings/${booking?._id}`} sx={{ textDecoration: 'none' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={booking?.studentID?.profileImage?.url} sx={{ width: 56, height: 56 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{booking?.courseID?.courseTitle}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(booking.date).toLocaleDateString()} at {booking.time}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>${booking.total}</Typography>
                      </Stack>
                    </PremiumCard>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {/* Studio Times Grid */}
        <Box id="studio-times">
          <PremiumSectionHeader
            title="Studio Times"
            subtitle={`Explore sessions hosted by ${teacherInfo.firstName}.`}
          />
          {sessionCard.length > 0 ? (
            <Grid container spacing={3}>
              {sessionCard.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Box sx={{ position: 'relative' }}>
                    {isOwnProfile && (
                      <IconButton
                        component={Link}
                        to={`/editcourse/${course._id}`}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 10,
                          bgcolor: 'background.paper',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          '&:hover': { bgcolor: '#F0F0F0' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Link
                      to={isOwnProfile ? `/editcourse/${course._id}` : `/teachers/${course.userName}/${course._id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <SessionCard
                        industry={course.industry}
                        tags={course.tags}
                        courseTitle={course.courseTitle}
                        price={course.pricePerStudent}
                        firstName={teacherInfo.firstName}
                        lastName={teacherInfo.lastName}
                        profileImage={teacherInfo.profileImage.url}
                        images={course?.images[0]?.url}
                        icon={course.industry}
                        capacity={course.capacity}
                        city={course.addressDetails?.city || course.city}
                        zipCode={course.addressDetails?.zipCode || course.zipCode}
                        address={course.addressDetails?.line1 || course.address}
                      />
                    </Link>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <PremiumEmptyState
              title="No sessions yet"
              subtitle={isOwnProfile ? "Start your hosting journey today." : "This artist hasn't posted any sessions yet."}
              actionText={isOwnProfile ? "Create a Session" : null}
              onAction={() => isOwnProfile && navigate('/flow')}
            />
          )}
        </Box>

        {/* Gallery Section */}
        {sessionCard.some(c => c.images?.length > 1) && (
          <Box sx={{ mt: 8 }}>
            <PremiumSectionHeader title="Studio Gallery" subtitle="A glimpse inside the creative space." />
            <Grid container spacing={2}>
              {sessionCard.flatMap(c => c.images).slice(0, 6).map((img, i) => (
                <Grid item xs={6} md={4} key={i}>
                  <Box
                    component="img"
                    src={img.url}
                    sx={{
                      width: '100%',
                      height: 240,
                      objectFit: 'cover',
                      borderRadius: 4,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Logout Button for own profile */}
        {isOwnProfile && (
          <Box sx={{ mt: 10, textAlign: 'center' }}>
            <Button
              onClick={() => logout("/")}
              color="error"
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Logout from Account
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default TeacherProfile;
