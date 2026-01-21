import React, { useState, useEffect } from 'react';
import { Container, Grid, Stack, Typography, Rating, Box, Divider, Skeleton, Avatar } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import GavelIcon from '@mui/icons-material/Gavel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useParams } from 'react-router-dom';
import ReactMapGL, { Marker } from 'react-map-gl';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from '../../store';
import TERMS from '../../constants/terms';
import { PremiumHero } from '../../ui/PremiumHero';
import { ArtistModule } from '../../ui/ArtistModule';
import { ReserveModule } from '../../ui/ReserveModule';
import { PremiumSectionHeader } from '../../ui/PremiumSectionHeader';
import { PremiumChip } from '../../ui/PremiumChip';
import { PremiumSkeleton } from '../../ui/PremiumFeedback';

import mapboxgl from 'mapbox-gl'
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const Course = () => {
	const [courseData, setCourseData] = useState({})
	const [selectedDateAndTime, setSelectedDateAndTime] = useState({})
	const [selectedTimeslotID, setSelectedTimeslotID] = useState('')
	const [selectedEnrolledStudents, setSelectedEnrolledStudents] = useState([])
	const [selectedEnrollment, setSelectedEnrollment] = useState(0)
	const [isLoading, setIsLoading] = useState(true);
	const [teacherInfo, setTeacherInfo] = useState();
	const [guestsEntered, setGuestsEntered] = useState(1);
	const paramsCourse = useParams();
	const { backendURL, userName } = useStore();
	const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFkZXItamFrZSIsImEiOiJjbDU4dXdnMXcyNDZ2M2pvY2k2OW1yajY5In0.VoWote3L5R1CdSF1RPKaZg';

	const increaseGuests = () => {
		const proposedTotal = guestsEntered + 1 + selectedEnrollment
		if (Boolean(courseData.capacity) && (proposedTotal <= courseData.capacity)) {
			setGuestsEntered(Math.min(guestsEntered + 1, courseData.capacity));
		}
	};

	const decreaseGuests = () => {
		if (guestsEntered > 1) {
			setGuestsEntered(guestsEntered - 1);
		}
	};

	useEffect(() => {
		setIsLoading(true);
		Promise.all([
			fetch(`${backendURL}course/getCourse/${paramsCourse.course}`).then(res => res.json()),
			fetch(`${backendURL}user/getUserInfo/${paramsCourse.userName}`).then(res => res.json())
		]).then(([course, teacher]) => {
			setCourseData(course);
			setTeacherInfo(teacher);
			setIsLoading(false);
		}).catch((err) => {
			console.log('Error loading data:', err);
			setIsLoading(false);
		});
	}, [paramsCourse, backendURL]);

	const [rating, setRating] = useState(0);
	useEffect(() => {
		if (courseData?.feedback?.length > 0) {
			const arrayOfReviews = courseData?.feedback?.map(ratAndRev => (ratAndRev?.rating))
			const average = (arrayOfReviews.reduce((a, b) => a + b, 0) / arrayOfReviews.length).toFixed(1);
			setRating(average);
		}
	}, [courseData?.feedback]);

	if (isLoading) {
		return (
			<Box>
				<TopNavBar back='/MapOpen' next='empty' activeStep='empty' />
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
			<TopNavBar back='/MapOpen' next='empty' activeStep='empty' />

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
							<Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
								<img
									src={require(`../../assets/icons/${courseData.industry || 'sports'}.png`)}
									style={{ height: 20, width: 20, opacity: 0.7 }}
									alt={courseData.industry}
								/>
								<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
									{courseData.industry}
								</Typography>
								<Typography variant="subtitle2">•</Typography>
								<Typography variant="subtitle2">{courseData.duration || 60} mins</Typography>
								<Typography variant="subtitle2">•</Typography>
								<Typography variant="subtitle2">Up to {courseData.capacity} guests</Typography>
							</Stack>
						</Box>

						<Divider sx={{ mb: 4 }} />

						<Box sx={{ mb: 6 }}>
							<PremiumSectionHeader title="What you'll do" />
							<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
								{courseData?.courseDescription}
							</Typography>
						</Box>

						<Box sx={{ mb: 6 }}>
							<PremiumSectionHeader title="Studio Vibe" />
							<Typography variant="body1" color="text.secondary">
								{courseData.studioVibe || `Experience the creative energy of a professional ${courseData.industry} studio.`}
							</Typography>
						</Box>

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
								subtitle={courseData?.feedback?.length > 0 ? `${rating} average rating from ${courseData?.feedback?.length} reviews` : "No reviews yet"}
							/>
							{courseData?.feedback?.length > 0 && (
								<Grid container spacing={2}>
									{courseData.feedback.map((rev) => (
										<Grid item xs={12} key={rev._id}>
											<Box sx={{ p: 2, borderRadius: 3, border: '1px solid #F0F0F0' }}>
												<Stack direction="row" spacing={2}>
													<Avatar src={rev?.studentID?.profileImage?.url} />
													<Box>
														<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{rev?.studentID?.userName}</Typography>
														<Rating value={rev.rating} readOnly size="small" sx={{ mb: 1 }} />
														<Typography variant="body2">{rev.reviews}</Typography>
													</Box>
												</Stack>
											</Box>
										</Grid>
									))}
								</Grid>
							)}
						</Box>

						<Box>
							<PremiumSectionHeader
								title="Cancellation Policy"
								subtitle="Full refund for cancellations made at least 24 hours before the session start time."
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

