import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Container, Grid, Stack, Typography, Rating, Box, Divider, Skeleton, Avatar } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import ReactMapGL, { Marker } from 'react-map-gl';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from '../../store';
import { PremiumHero } from '../../ui/PremiumHero';
import { ArtistModule } from '../../ui/ArtistModule';
import { ReserveModule } from '../../ui/ReserveModule';
import { PremiumSectionHeader } from '../../ui/PremiumSectionHeader';
import { PremiumChip } from '../../ui/PremiumChip';
import { PremiumSkeleton } from '../../ui/PremiumFeedback';
import axios from '../../actions/axios';
import { industryIcon } from '../../utils/industryIcon';
import { formatDuration, isUpcomingSession } from '../../utils/sessionTime';

import mapboxgl from 'mapbox-gl'
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const Course = () => {
	const [courseData, setCourseData] = useState({})
	const [selectedDateAndTime, setSelectedDateAndTime] = useState({})
	const [selectedTimeslotID, setSelectedTimeslotID] = useState('')
	const [, setSelectedEnrolledStudents] = useState([])
	const [selectedEnrollment, setSelectedEnrollment] = useState(0)
	const [isLoading, setIsLoading] = useState(true);
	const [loadState, setLoadState] = useState('loading'); // loading | ready | notFound | error
	const [teacherInfo, setTeacherInfo] = useState();
	const [guestsEntered, setGuestsEntered] = useState(1);
	const paramsCourse = useParams();
	const { userName } = useStore();
	const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFkZXItamFrZSIsImEiOiJjbDU4dXdnMXcyNDZ2M2pvY2k2OW1yajY5In0.VoWote3L5R1CdSF1RPKaZg';

	const selectedSlot = courseData?.schedule?.find((slot) => slot._id === selectedTimeslotID);
	const sessionCapacity = selectedSlot?.capacity ?? courseData.capacity ?? 1;

	const increaseGuests = () => {
		if (guestsEntered + 1 + selectedEnrollment <= sessionCapacity) {
			setGuestsEntered(guestsEntered + 1);
		}
	};

	// When a different session is chosen, never ask for more spots than it has left.
	useEffect(() => {
		const spotsLeft = Math.max(1, sessionCapacity - selectedEnrollment);
		setGuestsEntered((current) => Math.min(current, spotsLeft));
	}, [selectedTimeslotID, sessionCapacity, selectedEnrollment]);

	const decreaseGuests = () => {
		if (guestsEntered > 1) {
			setGuestsEntered(guestsEntered - 1);
		}
	};

	const loadListing = useCallback(async () => {
		setIsLoading(true);
		setLoadState('loading');
		try {
			const [{ data: course }, { data: teacher }] = await Promise.all([
				axios.get(`course/getCourse/${paramsCourse.course}`),
				axios.get(`user/getUserInfo/${paramsCourse.userName}`).catch(() => ({ data: null })),
			]);
			if (!course?._id) {
				setLoadState('notFound');
			} else {
				setCourseData(course);
				setTeacherInfo(teacher || undefined);
				setLoadState('ready');
			}
		} catch (err) {
			console.log('Error loading data:', err);
			setLoadState(err.response?.status === 404 ? 'notFound' : 'error');
		} finally {
			setIsLoading(false);
		}
	}, [paramsCourse.course, paramsCourse.userName]);

	useEffect(() => { loadListing(); }, [loadListing]);

	// Pre-select a session from the link (e.g. after logging in to reserve it).
	const [searchParams] = useSearchParams();
	const sessionFromLink = searchParams.get('session');
	useEffect(() => {
		if (!sessionFromLink || selectedTimeslotID || !courseData?.schedule) return;
		const slot = courseData.schedule.find((s) => s._id === sessionFromLink);
		if (slot && isUpcomingSession(slot) && slot.enrollment < slot.capacity) {
			setSelectedDateAndTime({ startDate: slot.startDate, startTime: slot.startTime });
			setSelectedTimeslotID(slot._id);
			setSelectedEnrolledStudents(slot.enrolledStudents);
			setSelectedEnrollment(slot.enrollment);
		}
	}, [sessionFromLink, courseData, selectedTimeslotID]);

	const [rating, setRating] = useState(0);
	useEffect(() => {
		if (courseData?.feedback?.length > 0) {
			const arrayOfReviews = courseData?.feedback?.map(ratAndRev => (ratAndRev?.rating))
			const average = (arrayOfReviews.reduce((a, b) => a + b, 0) / arrayOfReviews.length).toFixed(1);
			setRating(average);
		}
	}, [courseData?.feedback]);

	if (!isLoading && loadState !== 'ready') {
		return (
			<Box>
				<TopNavBar back='/explore' next='empty' activeStep='empty' />
				<Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
					{loadState === 'notFound' ? (
						<Stack spacing={2} alignItems="center">
							<SearchOffIcon sx={{ fontSize: 48, color: 'text.disabled' }} aria-hidden />
							<Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>This studio time isn't available</Typography>
							<Typography color="text.secondary">It may have been removed by the artist. There are other studios to explore.</Typography>
							<Button component={RouterLink} to="/explore" variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
								Browse studio times
							</Button>
						</Stack>
					) : (
						<Alert severity="error" sx={{ borderRadius: '12px', textAlign: 'left' }}
							action={<Button color="inherit" size="small" onClick={loadListing}>Try again</Button>}>
							We couldn't load this studio time. Check your connection and try again.
						</Alert>
					)}
				</Container>
			</Box>
		);
	}

	if (isLoading) {
		return (
			<Box>
				<TopNavBar back='/explore' next='empty' activeStep='empty' />
				<PremiumSkeleton height={400} />
				<Container sx={{ mt: 4 }}>
					<Grid container spacing={4}>
						<Grid item xs={12} md={8}>
							<Skeleton variant="text" width="60%" height={60} />
							<Skeleton variant="text" width="40%" height={30} />
							<Box sx={{ mt: 4 }}>
								<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
							</Box>
						</Grid>
						<Grid item xs={12} md={4}>
							<Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
						</Grid>
					</Grid>
				</Container>
			</Box>
		);
	}

	return (
		<Box sx={{ pb: { xs: 10, md: 6 }, bgcolor: 'background.default', minHeight: '100vh' }}>
			<TopNavBar back='/explore' next='empty' activeStep='empty' />

			<PremiumHero
				images={courseData.images}
				title={courseData.courseTitle}
				industry={courseData.industry}
			/>

			<Container sx={{ mt: 4 }}>
				<Grid container spacing={6}>
					{/* Left Column: Content */}
					<Grid item xs={12} md={8}>
						<Box sx={{ mb: 4 }}>
							<Typography variant="h3" sx={{ fontWeight: 700, mb: 1.5 }}>
								{courseData.courseTitle}
							</Typography>
							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
								{courseData?.tags?.map((tag, index) => (
									<PremiumChip key={index} label={tag} />
								))}
							</Stack>
							<Stack direction="row" spacing={1} alignItems="center" color="text.secondary" flexWrap="wrap" useFlexGap>
								{courseData.industry && (
									<>
										<img src={industryIcon(courseData.industry)} style={{ height: 20, width: 20, opacity: 0.7 }} alt="" />
										<Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
											{courseData.industry}
										</Typography>
										<Typography variant="subtitle2" aria-hidden>•</Typography>
									</>
								)}
								<Typography variant="subtitle2">{formatDuration(courseData.duration || 60)}</Typography>
								<Typography variant="subtitle2" aria-hidden>•</Typography>
								<Typography variant="subtitle2">Up to {courseData.capacity} {courseData.capacity === 1 ? 'guest' : 'guests'}</Typography>
							</Stack>
						</Box>

						<Divider sx={{ mb: 4 }} />

						<Box sx={{ mb: 6 }}>
							<PremiumSectionHeader title="What you'll do" />
							<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
								{courseData?.courseDescription}
							</Typography>
						</Box>

						{courseData.studioVibe && (
							<Box sx={{ mb: 6 }}>
								<PremiumSectionHeader title="Studio Vibe" />
								<Typography variant="body1" color="text.secondary">
									{courseData.studioVibe}
								</Typography>
							</Box>
						)}

						{courseData.whatToBring && (
							<Box sx={{ mb: 6 }}>
								<PremiumSectionHeader title="What to bring" />
								<Typography variant="body1" color="text.secondary">
									{courseData.whatToBring}
								</Typography>
							</Box>
						)}

						<Box sx={{ mb: 6 }}>
							<ArtistModule
								teacherInfo={teacherInfo}
								userName={paramsCourse.userName}
								city={courseData.addressDetails?.city || courseData.city}
							/>
						</Box>

						<Box sx={{ mb: 6, display: { xs: 'block', md: 'none' } }} id="booking-section">
							<PremiumSectionHeader title="Reserve Your Spot" />
							<ReserveModule
								sx={{ borderRadius: 3 }}
								courseData={courseData}
								teacherInfo={teacherInfo}
								selectedDateAndTime={selectedDateAndTime}
								setSelectedDateAndTime={setSelectedDateAndTime}
								setSelectedTimeslotID={setSelectedTimeslotID}
								setSelectedEnrolledStudents={setSelectedEnrolledStudents}
								setSelectedEnrollment={setSelectedEnrollment}
								guestsEntered={guestsEntered}
								increaseGuests={increaseGuests}
								decreaseGuests={decreaseGuests}
								selectedTimeslotID={selectedTimeslotID}
								selectedEnrollment={selectedEnrollment}
								userName={userName}
								forceInline={true}
							/>
						</Box>

						<Box sx={{ mb: 6 }}>
							<PremiumSectionHeader title="Location" />
							<Box sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #F0F0F0', height: 300 }}>
								{Boolean(courseData.latitude) && Boolean(courseData.longitude) && !isNaN(Number(courseData.latitude)) && !isNaN(Number(courseData.longitude)) ? (
									<ReactMapGL
										zoom={11}
										latitude={Number(courseData.latitude)}
										longitude={Number(courseData.longitude)}
										style={{ width: '100%', height: '100%' }}
										mapStyle={`mapbox://styles/mapbox/light-v11`}
										mapboxAccessToken={MAPBOX_TOKEN}
									>
										<Marker latitude={Number(courseData.latitude)} longitude={Number(courseData.longitude)} />
									</ReactMapGL>
								) : (
									<Box sx={{ width: '100%', height: '100%', bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
										<Stack alignItems="center" spacing={1}>
											<LocationOnIcon fontSize="large" color="disabled" />
											<Typography variant="body2" color="text.secondary">
												{courseData.city || 'Location available upon booking'}
											</Typography>
										</Stack>
									</Box>
								)}
							</Box>
						</Box>

						<Box sx={{ mb: 6 }}>
							<PremiumSectionHeader
								title="Reviews"
								subtitle={courseData?.feedback?.length > 0
									? `${rating} average from ${courseData.feedback.length} ${courseData.feedback.length === 1 ? 'review' : 'reviews'}`
									: "No reviews yet. Be one of the first guests!"}
							/>
							{courseData?.feedback?.length > 0 && (
								<Stack spacing={1.5}>
									{[...courseData.feedback].reverse().map((rev) => {
										const first = rev?.studentID?.firstName || 'Guest';
										const initial = rev?.studentID?.lastName ? ` ${rev.studentID.lastName[0]}.` : '';
										const when = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;
										return (
											<Box key={rev._id} sx={{ p: 2, borderRadius: '12px', bgcolor: 'background.paper' }}>
												<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
													<Avatar src={rev?.studentID?.profileImage?.url} alt="" sx={{ width: 36, height: 36 }} />
													<Box sx={{ minWidth: 0 }}>
														<Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{first}{initial}</Typography>
														{when && <Typography variant="caption" color="text.secondary">{when}</Typography>}
													</Box>
												</Stack>
												<Rating value={rev.rating} readOnly size="small" />
												{rev.reviews && <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>{rev.reviews}</Typography>}
											</Box>
										);
									})}
								</Stack>
							)}
						</Box>

						<Box>
							<PremiumSectionHeader
								title="Cancellation Policy"
								subtitle="Free cancellation until the day before your session: cancel from your booking for a full refund. Same-day cancellations aren't refunded. If the artist cancels, you're refunded in full automatically."
							/>
						</Box>
					</Grid>

					{/* Right Column: Sticky Reserve Card */}
					<Grid item xs={12} md={4} sx={{ borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
						<ReserveModule
							courseData={courseData}
							teacherInfo={teacherInfo}
							selectedDateAndTime={selectedDateAndTime}
							setSelectedDateAndTime={setSelectedDateAndTime}
							setSelectedTimeslotID={setSelectedTimeslotID}
							setSelectedEnrolledStudents={setSelectedEnrolledStudents}
							setSelectedEnrollment={setSelectedEnrollment}
							guestsEntered={guestsEntered}
							increaseGuests={increaseGuests}
							decreaseGuests={decreaseGuests}
							selectedTimeslotID={selectedTimeslotID}
							selectedEnrollment={selectedEnrollment}
							userName={userName}
						/>
					</Grid>
				</Grid>
			</Container>

			{/* Mobile Sticky Bar */}
			{/* <ReserveModule
				courseData={courseData}
				teacherInfo={teacherInfo}
				selectedDateAndTime={selectedDateAndTime}
				setSelectedDateAndTime={setSelectedDateAndTime}
				setSelectedTimeslotID={setSelectedTimeslotID}
				setSelectedEnrolledStudents={setSelectedEnrolledStudents}
				setSelectedEnrollment={setSelectedEnrollment}
				guestsEntered={guestsEntered}
				increaseGuests={increaseGuests}
				decreaseGuests={decreaseGuests}
				selectedTimeslotID={selectedTimeslotID}
				selectedEnrollment={selectedEnrollment}
				userName={userName}
			/> */}
		</Box>
	);
};

export default Course;

