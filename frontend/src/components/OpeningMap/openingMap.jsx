import React, { useEffect, useState } from 'react';
import ReactMapGL, { Marker, GeolocateControl, Popup } from 'react-map-gl';
import Prof from '../Profile/Prof';
import { Box, Button, Container, Grid, Stack, Tab, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import IndustryFilter from '../TopAppBar/IndustryFilter';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import theme from '../../theme.js';
import { IndustryOptions } from '../TopAppBar/IndustryOptions';
import './openingMap.css';

import mapboxgl from 'mapbox-gl'
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const backendURL = process.env.NODE_ENV === 'production' ? 'https://osmosis.herokuapp.com/' : 'http://localhost:8126/'


const MAPBOX_TOKEN =
	'pk.eyJ1IjoicmFkZXItamFrZSIsImEiOiJjbDU4dXdnMXcyNDZ2M2pvY2k2OW1yajY5In0.VoWote3L5R1CdSF1RPKaZg';

const OpeningMap = () => {
	const [selectedCourse, setSelectedCourse] = useState(null);

	const [initialViewState, setInitialViewState] = useState({
		zoom: 10,
		latitude: 40.7076398,
		longitude: -73.9596498,
		// MAKE CURRENT LOCATION OF USER
	});
	const [courses, setCourses] = useState([]);
	const [courseFilter, setCourseFilter] = useState('all');
	const [teacherInfo, setTeacherInfo] = useState({});
	const [filteredCourses, setFilteredCourses] = useState([]);
	const [major, setMajor] = useState('');
	const [value, setValue] = useState(0);

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	const handleFilter = (e) => {
		const newValue = e.target.textContent.toLowerCase()
		if ((courseFilter === newValue) || (newValue === 'all')) {
			setCourseFilter('all');
			setFilteredCourses(courses)
		} else {
			setCourseFilter(newValue)
			setFilteredCourses(courses.filter((course) => (course.industry === newValue)))
		}
	}

	useEffect(() => {
		fetch(
			`${backendURL}course/getCourses/${initialViewState.latitude}/${initialViewState.longitude}`
		).then((res) => {
			return res.json();
		}).then((courses) => {
			setCourses(courses);
			setFilteredCourses(courses)
		}).catch((err) => {
			console.log('Error getting courses:\n', err);
		});
	}, []);

// MAKE fetch ${selectedCourse.userName}

		useEffect(() => {
			fetch (`${backendURL}user/getUserInfo/${selectedCourse?.userName}`)
			.then((res) => {
				return res.json();
			}).then((data) => {
				setTeacherInfo(data)
			}).catch((err) => {
				console.log('Error getting teacher info:\n', err)
			});
		}, [selectedCourse]);

	return (
		<div>
			{/* <IndustryFilter /> */}
			<Container maxWidth='xl'>
				<Box
					sx={{
						display: 'flex',
						flexGrow: 1,
						px: { xs: 0, md: 2 },
						alignItems: 'center',
						mt: 0,
						mb: 0,
					}}>
					<Tabs
						value={courseFilter}
						onChange={handleChange}
						variant='scrollable'
						scrollButtons
						sx={{
							[`& .${tabsClasses.scrollButtons}`]: {
								'&.Mui-disabled': { opacity: 0.3 },
						},
					}}>
						<Tab
							onClick={handleFilter}
							value={'all'}
							key={'all'}
							// icon={industry.icon}
							label={'all'}
						/>
						{IndustryOptions.map((industry) => {
							return (
								<Tab
									onClick={handleFilter}
									value={industry.label}
									key={industry.id}
									icon={industry.icon}
									label={industry.label}
								/>
							);
						})}
					</Tabs>
				</Box>
			</Container>
			<ReactMapGL
				initialViewState={initialViewState}
				mapStyle={`mapbox://styles/mapbox/${theme.palette.mode}-v11`}
				mapboxAccessToken={MAPBOX_TOKEN}
				style={{ width: '100vw', height: '90vh' }}>
				{filteredCourses.map((course) => (
					<Marker
						key={course._id}
						latitude={course.latitude}
						longitude={course.longitude}>
						<div>
							<button
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
								}}
								onClick={(e) => {
									setSelectedCourse(course);
									setInitialViewState({
										zoom: 12,
										latitude: course.latitude,
										longitude: course.longitude,
									});
								}}>
								<img
									src={require(`../../assets/icons/${course.industry}.png`)}
									alt='industry'
									style={{ width: '25px' }}
								/>
							</button>
						</div>
					</Marker>
				))}
				{selectedCourse ? (
				<Link to={`/teachers/${selectedCourse.userName}/${selectedCourse._id}`}>
					<Popup
						style={{
							maxWidth:'min(60%, 300px)',
							// backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff'
						}}
						latitude={selectedCourse.latitude}
						longitude={selectedCourse.longitude}
						onClose={() => setSelectedCourse(null)}>
						<div
							style={{ fontFamily: 'Poppins', backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff'}}>
							<img className='popupImg' src={selectedCourse?.images[0]?.url} alt='' />
							<div style={{padding: '3%'}}>

							<Typography variant='h4'>{selectedCourse.courseTitle}</Typography>
							<Grid container direction='row' justifyContent='spaceBetween'>
								
								<Grid item xs={6} style={{justifyContent: 'center', display: 'flex'}}>
									<Prof
										avatar={teacherInfo.profileImage?.url}
										name={selectedCourse.userName}
										tags={selectedCourse.tags}
										stars={selectedCourse.stars}
									/>
								</Grid>

								<Grid item xs={6} style={{justifyContent: 'center', display: 'flex', flexDirection: 'column'}}>
									<p style={{textAlign: 'center'}}>{selectedCourse.capacity} guests
										<br/>${selectedCourse.pricePerStudent}/session</p>
							
									<Button variant='contained' style={{ textDecoration: 'none', color: 'white' }}>
										More
									</Button>
								</Grid>

							</Grid>
								<br/>
							<Grid item fullWidth>
								<Stack>
								
									<Grid container fullWidth>
										{
											selectedCourse.tags.map((tag, index) => {
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
								</Stack>
							</Grid>

							</div>
						</div>
					</Popup>
				</Link>
				) : null}

				<GeolocateControl />
			</ReactMapGL>
		</div>
	);
};

export default OpeningMap;
