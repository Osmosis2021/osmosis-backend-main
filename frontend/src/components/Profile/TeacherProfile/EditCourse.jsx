import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Button, ButtonGroup, Container, Grid, IconButton, Skeleton, TextField, Typography, Box, Stack, Divider } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TopNavBar from '../../TopNavBar/TopNavBar';
import useStore from '../../../store';
import EditPhotos from './EditPhotos';
import { useNavigate, useParams } from 'react-router-dom';
import { PeopleAltRounded } from '@mui/icons-material';
import TERMS from '../../../constants/terms';
import { PremiumCard } from '../../../ui/PremiumCard';

import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import mapboxgl from 'mapbox-gl'
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const ToggleDays = lazy(() => import('../../SessionCreation/ToggleDays/ToggleDays'))


// images / courseTitle / industry / tags / pricePerStudent / capacity / icon / firstName / lastName / address / zipCode / profileImage / city 


// TO DO:

// - Figure out Gallery Resizing for larger screens
// - Mapbox functionality, error regarding unmounted components
// - Modal functionality to populate number of guests in payment field
// - Payment functionality

const EditCourse = (props) => {
	const { userName, isTeacher, newCourseTimeslots, setNewCourseTimeslots,
		backendURL, timeslotsToRemove, setTimeslotsToRemove } = useStore();
	const [isLoading, setIsLoading] = useState(true)
	const [isAvailabilityVisible, setIsAvailabilityVisible] = useState(false)
	const [courseInfo, setCourseInfo] = useState({})
	const navigate = useNavigate();
	const { courseID } = useParams();

	useEffect(() => {
		const currentBackendURL = useStore.getState().backendURL;
		fetch(`${currentBackendURL}course/getCourse/${courseID}`)
			.then((res) => {
				return res.json();
			}).then((data) => {
				setCourseInfo(data)
				setNewCourseTimeslots(data.schedule)
				setIsLoading(false)
			}).catch((err) => {
				console.log('Error getting teacher info:\n', err);
			});
	}, [courseID, setNewCourseTimeslots])

	const updateCourse = async (e) => {
		e.preventDefault();

		const timeslotsToAdd = []
		newCourseTimeslots.forEach(slot => {
			if (Boolean(slot?._id)) {
				if (timeslotsToRemove.indexOf(slot._id) >= 0) {  // delete this timeslot from db
					setTimeslotsToRemove([...timeslotsToRemove, slot._id])
				}
			}
			else if (timeslotsToRemove.indexOf(slot.tempID) < 0) {
				timeslotsToAdd.push(slot)
			}
		})
		const _toRemove = timeslotsToRemove.filter(el => typeof el === 'string')
		const updatedCourseInfo = { ...courseInfo, timeslotsToAdd, timeslotsToRemove: _toRemove }
		setCourseInfo(updatedCourseInfo)
		try {
			await fetch(`${backendURL}course/updateCourse/${courseInfo._id}`, {
				body: JSON.stringify(updatedCourseInfo),
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
			}).then(() => {
				setIsLoading(false)
				setTimeslotsToRemove([])
				alert(`Successfully updated your ${TERMS.COURSE.toLowerCase()}`)
				navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
			})
		} catch (err) {
			alert('Update failed, please try again later')
			console.log('Error updating user:\n', err);
		};
	}

	const removeTag = (tag) => {
		let filteredTags = courseInfo.tags.filter((selectedTag) => selectedTag !== tag)
		setCourseInfo({ ...courseInfo, tags: filteredTags })
	}

	function handleTags() {
		const tag = document.getElementById('outlined-basic').value;
		const newTags = [...courseInfo.tags, tag]
		setCourseInfo({ ...courseInfo, tags: newTags })
	}

	const increaseCapacity = () => setCourseInfo({ ...courseInfo, capacity: parseInt(courseInfo.capacity) + 1 })

	const decreaseCapacity = () => {
		if (parseInt(courseInfo.capacity) > 1) {
			setCourseInfo({ ...courseInfo, capacity: parseInt(courseInfo.capacity) - 1 })
		};
	};

	const deleteCourse = async (e) => {
		e.preventDefault();
		try {
			await fetch(`${backendURL}course/deleteCourse/${courseInfo._id}`, {
				method: 'DELETE'
			}).then(() => {
				alert(`Successfully DELETED your ${TERMS.COURSE.toLowerCase()}`)
				navigate(`/teachers/${userName}`)
			})
		} catch (err) {
			alert('DELETION failed, please try again later')
			console.log('Error updating user:\n', err);
		};
	}

	return (
		<Container maxWidth='sm' style={{ marginTop: 16 }}>
			<TopNavBar back={`/teachers/${userName}`} />
			<Typography variant='h4' style={{ textAlign: 'center' }}>
				Edit your {TERMS.COURSE.toLowerCase()} offering:
			</Typography>

			<br />
			<hr style={{ color: 'black', width: '100%', border: 'solid .5px' }} />
			<br />

			<form>
				<PremiumCard sx={{ mb: 4, p: 3 }}>
					<Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>
						Experience Title
					</Typography>
					<TextField
						variant="outlined"
						fullWidth
						multiline
						defaultValue={courseInfo.courseTitle}
						onBlur={event => setCourseInfo(prev => ({ ...prev, courseTitle: event.target.value }))}
						InputProps={{
							sx: { fontSize: '1.5rem', fontWeight: 700 }
						}}
					/>
				</PremiumCard>

				<Grid container direction='row' alignItems='center' columnSpacing={1} sx={{ mb: 4, px: 2 }}>
					<Grid item>
						{/* {isLoading ? <Skeleton /> :
							<img src={require(`../../../assets/icons/${courseInfo?.industry}.png`)} style={{ height: 32, width: 32 }} alt={courseInfo.industry} />
						} */}
					</Grid>
					<Grid item style={{ textAlign: 'left' }}>
						<Typography variant='h5' sx={{ fontWeight: 800 }}>{courseInfo.industry}</Typography>
					</Grid>
				</Grid>

				<PremiumCard sx={{ mb: 4, p: 3 }}>
					<Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>
						Tags
					</Typography>
					<Grid container direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
						{isLoading ? <Skeleton style={{ width: '100%', height: '100px' }} /> :
							courseInfo.tags?.map((tag, index) => {
								return (
									<Grid item key={index}>
										<Box sx={{
											display: 'flex',
											alignItems: 'center',
											bgcolor: 'rgba(0,174,239,0.1)',
											borderRadius: 2,
											px: 1.5,
											py: 0.5
										}}>
											<Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main', mr: 1 }}>
												#{tag}
											</Typography>
											<IconButton size="small" onClick={() => removeTag(tag)}>
												<HighlightOffIcon fontSize="small" color='error' />
											</IconButton>
										</Box>
									</Grid>
								)
							})}
					</Grid>

					<Box sx={{ display: 'flex', gap: 1 }}>
						<TextField
							fullWidth
							size="small"
							id='outlined-basic'
							label='Add Tag'
							placeholder='e.g. #jazz'
							name='generalTags'
						/>
						<Button variant="contained" onClick={handleTags} sx={{ fontWeight: 700 }}>
							Add
						</Button>
					</Box>
				</PremiumCard>

				<EditPhotos />

				<br />

				<PremiumCard sx={{ mt: 4, p: 3 }}>
					<Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Settings</Typography>

					<Stack spacing={4}>
						<Grid container alignItems='center' justifyContent='space-between'>
							<Grid item xs={2}>
								<CalendarTodayIcon color="action" fontSize="large" />
							</Grid>

							<Grid item xs={6}>
								<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
									Availability
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{newCourseTimeslots.length || 0} upcoming timeslots
								</Typography>
							</Grid>

							<Grid item xs={4} align='right'>
								<Button
									variant="outlined"
									size="small"
									onClick={() => setIsAvailabilityVisible(!isAvailabilityVisible)}
									sx={{ borderRadius: 3, fontWeight: 700 }}
								>
									Edit
								</Button>
							</Grid>
						</Grid>

						{isAvailabilityVisible && <Suspense fallback='Loading...'>
							<ToggleDays isExistingCourse={true} />
						</Suspense>}

						<Divider />

						<Grid container alignItems='center' justifyContent='space-between'>
							<Grid item xs={2}>
								<PeopleAltRounded color="action" fontSize="large" />
							</Grid>

							<Grid item xs={6}>
								<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
									Capacity
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Max guests per session
								</Typography>
							</Grid>

							<Grid item xs={4} align='right'>
								<ButtonGroup variant='outlined' size="small">
									<Button onClick={decreaseCapacity}>-</Button>
									<Button disabled sx={{ color: 'text.primary !important', fontWeight: 700 }}>
										{courseInfo.capacity || 1}
									</Button>
									<Button onClick={increaseCapacity}>+</Button>
								</ButtonGroup>
							</Grid>
						</Grid>

						<Divider />

						<Grid container alignItems='center' justifyContent='space-between'>
							<Grid item xs={2}>
								<AttachMoneyIcon color="action" fontSize="large" />
							</Grid>

							<Grid item xs={6}>
								<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
									Price
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Per student
								</Typography>
							</Grid>

							<Grid item xs={4} align='right'>
								<TextField
									type='number'
									size="small"
									onChange={event => setCourseInfo(prev => ({ ...prev, pricePerStudent: Math.max(0, parseInt(event.target.value) || 0) }))}
									value={courseInfo.pricePerStudent}
									InputProps={{
										startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
									}}
									sx={{ width: 100 }}
								/>
							</Grid>
						</Grid>
					</Stack>
				</PremiumCard>

				<br />
				<br />
				<br />
				<hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
				<br />

				<Button type='submit' onClick={updateCourse} variant="contained" size="large" align='center' style={{ fontSize: 26, fontFamily: 'Poppins', color: 'white', marginBottom: '24px' }} fullWidth>
					Update {TERMS.COURSE}
				</Button>

				<Button type='submit' onClick={deleteCourse} color='error' variant="contained" size="large" align='center' style={{ fontSize: 26, fontFamily: 'Poppins', color: 'white', marginBottom: '36px' }} fullWidth>
					Delete {TERMS.COURSE}
				</Button>

			</form>
		</Container>
	);
};

export default EditCourse;
