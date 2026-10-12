import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Stack,
  IconButton,
  Chip
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import SessionCard from "../../SessionCard/SessionCard";
import React, { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MessageIcon from '@mui/icons-material/Message';
import useStore from "../../../store";
import "./TeacherProfile.css";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import useLogout from "../../../hooks/useLogout";
import { PremiumSectionHeader } from "../../../ui/PremiumSectionHeader";
import { PremiumButton } from "../../../ui/PremiumButton";
import { PremiumSkeleton, PremiumEmptyState } from "../../../ui/PremiumFeedback";
import useStartChat from '../../../hooks/useStartChat';
import HostChecklist from './HostChecklist';
import axios from '../../../actions/axios';
import { isBookingUpcoming } from '../../../utils/bookingStatus';
import { BookingListItem } from '../../Booking/BookingParts';

const handleJsonResponse = async (res) => {
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  throw new Error(`Expected JSON but received content-type: ${contentType}. Content: ${text.slice(0, 100)}`);
};

const TeacherProfile = (props) => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const startChat = useStartChat();
  const logout = useLogout();
  const [teacherInfo, setTeacherInfo] = useState({ profileImage: {} });
  const [sessionCard, setSessionCard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const { backendURL, userName } = useStore();
  const pageUserName = useParams()?.userName;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getTeacherBookings = async () => {
      try {
        const resp = await axiosPrivate.get(
          `booking/teacherBookings/${pageUserName}`,
          { signal: controller.signal }
        );
        if (isMounted) {
          setBookings(resp.data);
          console.log("Teacher bookings:", resp.data);
        }
      } catch (err) {
        console.error("Error fetching teacher bookings:", err);
      }
    };

    getTeacherBookings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pageUserName, axiosPrivate]);

  useEffect(() => {
    const _controller = new AbortController();
    fetch(`${backendURL}course/getCourses/${pageUserName}`, {
      signal: _controller.signal,
    })
      .then(handleJsonResponse)
      .then((data) => {
        let courses = Array.isArray(data) ? data : [data];
        setSessionCard(courses);
      })
      .catch((err) => {
        console.log("Error getting courses:\n", err);
      });

    fetch(`${backendURL}user/getUserInfo/${pageUserName}`)
      .then(handleJsonResponse)
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

  const [isOnboarded, setIsOnboarded] = useState(false);
  const [stats, setStats] = useState(null);

  // Real, public numbers for this host (no placeholders).
  useEffect(() => {
    let cancelled = false;
    setStats(null);
    axios.get(`course/hostStats/${pageUserName}`)
      .then(({ data }) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setStats(null); });
    return () => { cancelled = true; };
  }, [pageUserName]);

  useEffect(() => {
    if (teacherInfo?.stripeID) {
      fetch(`${backendURL}stripe/retrieveStripeAccount/${teacherInfo.stripeID}`)
        .then(handleJsonResponse)
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
                  </Stack>
                  <Stack direction="row" spacing={2} color="text.secondary" flexWrap="wrap" useFlexGap>
                    {stats?.city && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationOnIcon fontSize="small" aria-hidden />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {stats.city}
                        </Typography>
                      </Stack>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      @{teacherInfo.userName}
                    </Typography>
                  </Stack>
                </Box>

                {teacherInfo.description ? (
                  <Typography variant="body1" sx={{ maxWidth: 600, color: 'text.secondary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {teacherInfo.description}
                  </Typography>
                ) : isOwnProfile && (
                  <Typography variant="body2" color="text.secondary">
                    Add a short bio so guests get to know you before they book.{' '}
                    <Link to="/edit" style={{ color: 'inherit', fontWeight: 700 }}>Add bio</Link>
                  </Typography>
                )}

                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5, '& > *': { whiteSpace: 'nowrap' } }}>
                  {!isOwnProfile && (
                    <PremiumButton
                      startIcon={<MessageIcon />}
                      onClick={() => startChat(teacherInfo?._id, { personLabel: 'this artist' })}
                    >
                      Message Artist
                    </PremiumButton>
                  )}
                  {isOwnProfile && (
                    <>
                      <PremiumButton
                        style={{ borderRadius: 24, fontWeight: 700, textTransform: 'none' }}
                        component={Link}
                        to="/flow"
                        startIcon={<AddIcon />

                        }
                      >
                        New studio time
                      </PremiumButton>
                      <Button
                        component={Link}
                        to="/edit"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                      >
                        Edit profile
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          {/* Stats: only real numbers; brand-new hosts get a simple badge instead of zeros */}
          {stats && (stats.sessionsHosted > 0 || stats.reviewCount > 0) ? (
            <Grid container spacing={2} sx={{ mt: 4 }}>
              {[
                { label: stats.sessionsHosted === 1 ? 'Session hosted' : 'Sessions hosted', value: stats.sessionsHosted },
                { label: stats.guestsHosted === 1 ? 'Guest hosted' : 'Guests hosted', value: stats.guestsHosted },
                stats.reviewCount > 0
                  ? { label: `Rating · ${stats.reviewCount} ${stats.reviewCount === 1 ? 'review' : 'reviews'}`, value: `★ ${stats.averageRating}` }
                  : { label: 'Reviews', value: 'None yet' },
              ].map((stat) => (
                <Grid item xs={4} key={stat.label}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#F9F9F9', borderRadius: 4, height: '100%' }}>
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
          ) : stats && (
            <Chip label="New host on Studio Time" sx={{ mt: 3, fontWeight: 700 }} />
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* First-run guide for the artist (only on their own profile) */}
        {isOwnProfile && (
          <HostChecklist
            host={teacherInfo}
            listingCount={sessionCard.length}
            payoutsReady={teacherInfo.payoutsEnabled === true || isOnboarded}
          />
        )}

        {/* Upcoming Sessions for Host */}
        {isOwnProfile && bookings.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <PremiumSectionHeader title="Upcoming bookings" subtitle="Guests coming to your studio. Tap one for details or to message them." />
            <Grid container spacing={2}>
              {bookings
                .filter(b => isBookingUpcoming(b))
                .map(booking => (
                  <Grid item xs={12} md={6} key={booking._id}>
                    <BookingListItem booking={booking} perspective="host" />
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
                        duration={course.duration}
                        nextSession={course.nextSession ?? null}
                        paymentsReady={course.paymentsReady !== false}
                      />
                    </Link>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <PremiumEmptyState
              title={isOwnProfile ? "You haven't listed a studio time yet" : "No studio times yet"}
              subtitle={isOwnProfile
                ? "List your first studio time and share the link with your followers. It takes about 5 minutes."
                : `${teacherInfo.firstName || 'This artist'} hasn't opened any sessions yet. Check back soon.`}
              actionLabel={isOwnProfile ? "List your first studio time" : undefined}
              onAction={() => navigate('/flow')}
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
