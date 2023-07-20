import Carousel from '../SessionCreation/PhotoHandling/Carousel/Carousel';
import { Avatar, Box, ButtonGroup, Button, Card, Container, Grid, Skeleton, Stack, Typography, Rating } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GuestDrawer from '../GuestDrawer/GuestDrawer';
import PersonIcon from '@mui/icons-material/Person';
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DateDrawer, { timeConverter } from '../DateDrawer/DateDrawer';
import ReactMapGL, { Marker } from 'react-map-gl';
import TopNavBar from '../TopNavBar/TopNavBar';
import Prof from '../Profile/Prof';
import theme from '../../theme.js';
import useStore from '../../store';
import PayPopUp from './PayPopUp';
import { PeopleAltRounded } from '@mui/icons-material';
import axios from 'axios';

import mapboxgl from 'mapbox-gl'
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;


const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'


// TO DO:
// - Figure out Gallery Resizing for larger screens
// - Mapbox functionality, error regarding unmounted components
// - Modal functionality to populate number of guests in payment field
// - Payment functionality

const Course = (props) => {
	const [courseData, setCourseData] = useState({})
	const [selectedDateAndTime, setSelectedDateAndTime] = useState({})
	const [selectedTimeslotID, setSelectedTimeslotID] = useState('')
	// const [selectedCapacity, setSelectedCapacity] = useState(1)
	const [selectedEnrolledStudents, setSelectedEnrolledStudents] = useState([])
	const [selectedEnrollment, setSelectedEnrollment] = useState(0)
	const [isLoading, setIsLoading] = useState(true);
	const [teacherInfo, setTeacherInfo] = useState();
	const [guestsEntered, setGuestsEntered] = useState(1);
	const paramsCourse = useParams();
	const {userName} = useStore();
	const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFkZXItamFrZSIsImEiOiJjbDU4dXdnMXcyNDZ2M2pvY2k2OW1yajY5In0.VoWote3L5R1CdSF1RPKaZg';

	const increaseGuests = () => {
		const proposedTotal = guestsEntered + 1 + selectedEnrollment
		if(Boolean(courseData.capacity) && (proposedTotal <= courseData.capacity)) {
			setGuestsEntered(Math.min(guestsEntered + 1, courseData.capacity));
		}
    };
	
    const decreaseGuests = () => {
		if (guestsEntered > 1) {
            setGuestsEntered(guestsEntered - 1);
        }
    };


	useEffect(() => {
		fetch(`${backendURL}course/getCourse/${paramsCourse.course}`)
		.then((res) => {
			return res.json();
		}).then((data) => {
			setCourseData(data)
		}).catch((err) => {
			console.log('Error getting course info:\n', err);
		});
	
		fetch (`${backendURL}user/getUserInfo/${paramsCourse.userName}`)
        .then((res) => {
            return res.json();
        }).then((data) => {
            setTeacherInfo(data)
            setIsLoading(false)
        }).catch((err) => {
            console.log('Error getting teacher info:\n', err)
        })
    }, []);

	function getAverage (array) {
		const average = (array?.reduce((a, b) => a + b, 0) / array?.length).toFixed(2);
		return average;
	}

	const [rating, setRating] = useState(0);
	useEffect(() => {
		if (courseData?.feedback?.length > 0) {

			const arrayOfReviews = courseData?.feedback?.map(ratAndRev=>(ratAndRev?.rating))
			console.log(arrayOfReviews)
			const averageRating = getAverage(arrayOfReviews);
			setRating(averageRating);
		} else return;
	}, [courseData?.feedback]);
	
	return (
		<div>
			<TopNavBar back='/MapOpen' next='empty' activeStep='empty'/>
			<Carousel courseData={courseData}/>
			
			<br />

			<Grid container direction='column' style={{alignItems:'flex-start', justifyContent:'left', padding: '4%' }}>
				<Typography variant='h3'>
					{courseData.courseTitle}
				</Typography>
					
				<br />

				<Grid fullWidth item alignItems='left'>
					<Grid container direction='row' alignItems='center'>
						{ 
							isLoading ? <Skeleton/> :
							courseData?.tags?.map((tag, index) => {
								return (
									<Typography 
										variant='h5' 
										align='left'
										key={index} 
										id={index}
									>
										#{tag}&nbsp;
									</Typography>
								)
							})
						}
					</Grid>
				</Grid>

				<Grid item mt={2}>
					<Grid container direction='row' alignItems='center' columnSpacing={1}>

						{
							isLoading ? <Skeleton/> : 
							<>
								<Grid item >
									<img src={require(`../../assets/icons/${courseData.industry || 'sports'}.png`)} style={{height:25, width:25}} alt={courseData.industry}/> 
								</Grid>

								<Grid item >
									<Typography variant='h4'>{courseData.industry}</Typography>
								</Grid>
							</>
						}

					</Grid>
				</Grid>

			</Grid>

			{/* <br /> */}
			<hr style={{ color: theme.palette.mode === 'light' ? 'black' : 'white', width: '90%', border: 'solid .5px' }} />
			<br />

			<Container>
				<Link style={{textDecoration: 'none', color: theme.palette.mode === 'dark' ? 'white' : 'black'}} to={`/teachers/${paramsCourse.userName}`}>
					<Grid container spacing={2} alignItems='center'>
						
						<Grid item align='center' style={{ alignItems: 'flexEnd' }}>
							<Prof
								avatar={teacherInfo?.profileImage.url}
								name={paramsCourse.userName}
							/>
						</Grid>
						
						<Grid item xs>
							<Typography>
								{teacherInfo?.description}
							</Typography>
						</Grid>

					</Grid>
				</Link>
			</Container>

			<br />
			<hr style={{ color: theme.palette.mode === 'light' ? 'black' : 'white', width: '90%', border: 'solid .5px' }} />
			<br />

			<Container>
				<Grid container spacing={2} alignItems='center'>
					<Grid item style={{ alignItems: 'flexEnd' }}>
						<Typography variant='h5'>Course Description:</Typography>
						<br/>
						<Typography>{courseData?.courseDescription}</Typography>
					</Grid>
				</Grid>
			</Container>

			<br />
			<hr style={{ color: theme.palette.mode === 'light' ? 'black' : 'white', width: '90%', border: 'solid .5px' }} />
			<br />

			<Container>
				<Grid container spacing={2} alignItems='center'>
					<Grid item style={{ alignItems: 'flexEnd' }}>
						<Typography variant='h5'>Rating / Reviews:</Typography>
						<br/>
						<Stack direction='row' justifyContent='center' alignItems='flex-end'>
							<Rating size='large' precision={0.5} name="read-only" value={rating} readOnly />
							&nbsp;
							<Typography>{rating}</Typography>
							&nbsp;
							<Typography>({courseData?.feedback?.length})</Typography>
						</Stack>
						<br/>
						<Grid container justifyContent='center'>
							<Grid container direction='row' spacing={2}>
								{courseData?.feedback?.length > 0 &&
								courseData?.feedback?.map((ratAndRev) => {
									console.log(ratAndRev.rating);
									return (
									<Grid item key={ratAndRev._id} xs={12} md={6} lg={4}>
										<Card
										sx={{
											width: '100%',
											padding: '3%', // Adjust the padding as needed
											marginBottom: '1%', // Add space between the Card elements
										}}
										>
										<Grid container alignItems='center' spacing={1}>
											<Grid item>
											<Avatar
												src={ratAndRev?.studentID?.profileImage?.url}
												alt={ratAndRev?.studentID?.userName}
												sx={{ width: 48, height: 48, marginRight: '16px' }} // Adjust the size of the Avatar and add right margin
											/>
											<Typography variant='body1' align='center'>
												{ratAndRev?.studentID?.userName}
											</Typography>
											</Grid>
											<Grid item xs>
											<Stack direction='row' alignItems='center' spacing={1}>
												<Rating
												precision={0.5}
												value={ratAndRev.rating}
												readOnly
												/>
												<Typography>{ratAndRev.rating}</Typography>
											</Stack>
											<Typography>{ratAndRev.reviews}</Typography>
											</Grid>
										</Grid>
										</Card>
									</Grid>
									)
								})}
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Container>

			<br />
			<hr style={{ color: theme.palette.mode === 'light' ? 'black' : 'white', width: '90%', border: 'solid .5px' }} />
			<br />

			<Grid container mt={2} style={{ alignItems: 'center' }}>
				
				<Grid item xs={4} style={{ alignItems: 'center' }}>
					<Typography style={{textAlign: 'center'}}>
						<CalendarTodayIcon style={{fontSize:'50'}}/>
					</Typography>
				</Grid>

				<Grid item xs={4}>
					<Typography variant='h6' style={{ textAlign: 'center'}}>
						{(courseData.schedule === undefined) ? <></> : <DateDrawer schedule={courseData.schedule} 
						    selectedDateAndTime={selectedDateAndTime}
							setSelectedDateAndTime={setSelectedDateAndTime}
							setSelectedTimeslotID={setSelectedTimeslotID}
							// setSelectedCapacity={setSelectedCapacity}
							setSelectedEnrolledStudents={setSelectedEnrolledStudents}
							setSelectedEnrollment={setSelectedEnrollment}
						/>}
					</Typography>
				</Grid>
				{(selectedDateAndTime.hasOwnProperty('startDate')) &&
				<div style={{textAlign:'center'}}>
					<Typography>{selectedDateAndTime.startDate.slice(0, 10)}</Typography>
					<Typography>{timeConverter(selectedDateAndTime.startTime)}</Typography>
				</div>}
			</Grid>

			<br/>

			<Grid container style={{ alignItems: 'center'}}>

				<Grid item xs={4} style={{ alignItems: 'center' }}>
					<Typography style={{ textAlign: 'center'}}>
						<PersonIcon style={{fontSize:'50'}}/>
					</Typography>
				</Grid>

				<Grid item xs={4} style={{justifyContent:'center', display:'flex'}}>
						{/* <br/> */}
								{(selectedDateAndTime.hasOwnProperty('startDate')) &&
							<ButtonGroup variant='contained'>
								<Button onClick={decreaseGuests}>
									<Typography variant='h6' fontWeight='bold' color='white'>
										—
									</Typography>
								</Button>
								<Button>
									<Typography variant='h5' fontWeight='medium' color='white'>
										{guestsEntered}
									</Typography>
								</Button>
								<Button onClick={increaseGuests}>
									<Typography variant='h6' fontWeight='small' color='white'>
										+
									</Typography>
								</Button>
							</ButtonGroup>
								}
				</Grid>

				<Grid item xs={4} style={{justifyContent:'center', display:'flex'}}>
				{(selectedDateAndTime.hasOwnProperty('startDate')) &&
				<Stack justifyContent='center'>
					<Typography variant='h6'> Remaining Spots: </Typography>
					<Typography variant='body'> {courseData.capacity - selectedEnrollment} left </Typography>
				</Stack>
				}
				</Grid>

			</Grid>

			<br/>
			
			<Grid container style={{ alignItems: 'center' }}>

				<Grid item xs={4} style={{ alignItems: 'center'}}>
					<Typography style={{ textAlign: 'center'}}>
						<AttachMoneyIcon style={{fontSize:'35'}}/>
					</Typography>
				</Grid>

				<Grid item xs={4}>
					<Typography variant='h4' style={{ textAlign: 'center' }}>
						{courseData.pricePerStudent} / guest
					</Typography>
				</Grid>

			</Grid>
			<br/>
			<br/>
			<Grid container style={{ alignItems: 'center' }}>

				<Grid item xs={4} style={{ alignItems: 'center' }}>
					<Typography variant='h2' style={{ textAlign: 'center'}}>
						Total
					</Typography>
				</Grid>

				<Grid item xs={4}>
					<Typography variant='h2' style={{ textAlign: 'center' }}>
					{`$${courseData.pricePerStudent * guestsEntered}`}
					</Typography>
				</Grid>

				<div style={{textAlign:'right'}}>
				<PayPopUp 
					selectedDateAndTime={selectedDateAndTime}
					courseTitle={courseData.courseTitle}
					courseID={courseData._id}
					selectedTimeslotID={selectedTimeslotID}
					pricePerStudent={courseData.pricePerStudent}
					guests={guestsEntered}
					profileImage={teacherInfo?.profileImage?.url}
					total={courseData.pricePerStudent * guestsEntered}
					teacherFullName={`${teacherInfo?.firstName} ${teacherInfo?.lastName}`}
					teacherID={courseData.teacherID}
					teacherUserName={courseData.userName}
					studentUserName={userName}
					// stripeID={teacherInfo?.stripeID}
				/>
			</div>



			</Grid>

			<hr style={{ color: theme.palette.mode === 'light' ? 'black' : 'white', width: '90%', border: 'solid .5px' }} />

			{/* <div style={{textAlign:'right'}}>
				<PayPopUp 
					selectedDateAndTime={selectedDateAndTime}
					courseTitle={courseData.courseTitle}
					courseID={courseData._id}
					selectedTimeslotID={selectedTimeslotID}
					pricePerStudent={courseData.pricePerStudent}
					guests={guestsEntered}
					profileImage={teacherInfo?.profileImage?.url}
					total={courseData.pricePerStudent * guestsEntered}
					teacherFullName={`${teacherInfo?.firstName} ${teacherInfo?.lastName}`}
					teacherUserName={courseData.userName}
				/>
			</div> */}

			<Card style={{ margin: '5%' }}>
				{!Boolean(courseData.longitude) ? <Skeleton style={{margin: '5%', height:'100px', width:'100%'}} /> :
				<ReactMapGL
					zoom='11'
					latitude={courseData.latitude}
					longitude={courseData.longitude}
					style={{ width: '100%', height: 300, textAlign: 'center' }}
					mapStyle={`mapbox://styles/mapbox/${theme.palette.mode}-v11`}
					mapboxAccessToken={MAPBOX_TOKEN}>
						<Marker 
							latitude={courseData.latitude}
							longitude={courseData.longitude}
						/>
						<div>
							{/* <img alt={teacherInfo.industry}src={require(`../../../assets/icons/${teacherInfo.industry}.png`)} style={{width: "25px"}}/> */}
						</div>
				</ReactMapGL>}
			</Card>

			
		</div>
	);
};

export default Course;
