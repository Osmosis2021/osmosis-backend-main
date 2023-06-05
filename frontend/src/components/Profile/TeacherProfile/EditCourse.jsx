import { Button, ButtonGroup, Card, Container, Grid, Input, IconButton, Skeleton, Stack, TextField, Typography, Box, FormHelperText } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GuestDrawer from '../../GuestDrawer/GuestDrawer';
import PersonIcon from '@mui/icons-material/Person';
import React, { useState, useEffect } from 'react';
import DateDrawer from '../../DateDrawer/DateDrawer';
import ReactMapGL, { Marker } from 'react-map-gl';
import TopNavBar from '../../TopNavBar/TopNavBar';
import Prof from '../../Profile/Prof';
import theme from '../../../theme.js';
import useStore from '../../../store';
import EditPhotos from './EditPhotos';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { PeopleAltRounded } from '@mui/icons-material';

import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import mapboxgl from 'mapbox-gl'
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const backendURL = process.env.NODE_ENV === 'production' ? 'https://osmosis.herokuapp.com/' : 'http://localhost:8126/'


  // images / courseTitle / industry / tags / pricePerStudent / capacity / icon / firstName / lastName / address / zipCode / profileImage / city 


// TO DO:

// - Figure out Gallery Resizing for larger screens
// - Mapbox functionality, error regarding unmounted components
// - Modal functionality to populate number of guests in payment field
// - Payment functionality

const EditCourse = (props) => {
	const [teacherData, setTeacherData] = useState({});
	const {userName, userID, isTeacher } = useStore();
	const [editedTags, setEditedTags] = useState();
	const [isLoading, setIsLoading] = useState(true)
	const [guests, setGuests] = useState(1)
	const [courseInfo, setCourseInfo] = useState({})
	const navigate = useNavigate();
	// const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFkZXItamFrZSIsImEiOiJjbDU4dXdnMXcyNDZ2M2pvY2k2OW1yajY5In0.VoWote3L5R1CdSF1RPKaZg';
	const { courseID } = useParams();
	console.log(courseID)
	useEffect(() => {
		fetch(`${backendURL}course/getCourse/${courseID}`)
		.then((res) => {
			return res.json();
		}).then((data) => {
			setTeacherData(data);
			setCourseInfo(data)
			setEditedTags(teacherData?.tags)
			setIsLoading(false)

		}).catch((err) => {
			console.log('Error getting teacher info:\n', err);
		});
	}, []);

	// async function updateCourse() {
	// 	// e.preventDefault();
    //     const { courseTitle, tags, capacity, price } = courseInfo
	// 	axios.put(`${backendURL}course/updateCourse/${userID}`, courseInfo)
	// }

	const updateCourse = async (e) => {
        e.preventDefault();
        // const { 
		// 	courseTitle, 
		// 	tags, 
		// 	guests, 
		// 	pricePerStudent 
		// } = courseInfo
        
        try {
            await fetch (`${backendURL}course/updateCourse/${courseInfo._id}`, {
                body: JSON.stringify(courseInfo),
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            }).then(() => {
                // setFirstName(userInfo.firstName)
                // setLastName(userInfo.lastName)
                // setUserName(userInfo.userName)

				console.log(courseInfo)	
                alert('Successfully updated your course')
                navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
            })
        } catch (err) {
            alert('Update failed, please try again later')
            console.log('Error updating user:\n', err);
        };
    }

	const removeTag = (tag) => {
		console.log('backendData saved to state =>', editedTags);
		let filteredTags = editedTags.filter((selectedTag) =>  selectedTag !== tag )
		setEditedTags(filteredTags);
		setCourseInfo(prev => ({...prev, tags: editedTags}))
		console.log('after click', courseInfo.tags)
	}

	function handleTags() {
		// event.preventDefault();
    	const tag = document.getElementById('outlined-basic').value;
		console.log(tag)
		editedTags.push(tag);
		setCourseInfo(prev => ({...prev, tags: editedTags}))
		console.log(editedTags);
	}

	const increaseGuests = () => {
		const convertedGuests= parseInt(teacherData.capacity)
		console.log(convertedGuests)
        setGuests((convertedGuests) => (convertedGuests + 1));
		setCourseInfo(prev => ({...prev, capacity: guests}))
		console.log(guests)
    };

    const decreaseGuests = () => {
        if (guests > 1) {
            setGuests((prevGuests) => (prevGuests - 1));
			setCourseInfo(prev => ({...prev, capacity: guests}))
        };
    };

	const deleteCourse = async (e) => {
        e.preventDefault();
		try {
			await fetch (`${backendURL}course/deleteCourse/${courseInfo._id}`, {
				method: 'DELETE'
			}).then(() => {
				console.log(courseInfo);
				// setFirstName(userInfo.firstName)
				// setLastName(userInfo.lastName)
				// setUserName(userInfo.userName)
				alert('Successfully DELETED your course')
				navigate(`/teachers/${userName}`)
			})
		} catch (err) {
			alert('DELETION failed, please try again later')
			console.log('Error updating user:\n', err);
		};
	}

	return (
	
		<Container maxWidth='sm' style={{marginTop:16}}>
			<TopNavBar back={`/teachers/${userName}`} />
			<Typography variant='h4' style={{textAlign:'center'}}> 
				Edit your course offering:
			</Typography>

			<br />
			<hr style={{ color: 'black', width: '100%', border: 'solid .5px' }} />
			<br />

			<form>
					<Input type='text' 
						onChange={event => setCourseInfo(prev => ({...prev, courseTitle: event.target.value}))} 
						value={courseInfo.courseTitle} 
						fullWidth 
						multiline 
						style={{fontSize:'32px'}}
					/>
					
					<br />
					<hr style={{ color: 'black', width: '100%', border: 'solid .5px' }} />
					<br />

				<Grid container direction='row' alignItems='center' columnSpacing={1}>

					<Grid item>
						{ 
							isLoading ? <Skeleton /> :
							<img src={require(`../../../assets/icons/${teacherData?.industry}.png`)} style={{height:25, width:25}} alt={teacherData.industry}/>
						}
					</Grid>

					<Grid item style={{textAlign:'left'}}>
						<Typography variant='h4'>{teacherData.industry}</Typography>
					</Grid>

				</Grid>
			
				<Grid container style={{alignItems:'center', justifyContent:'center', padding: '0 5%', margin: '2%' }}>
				
					<Grid container direction='row' alignItems='center'>
						{ 
						isLoading ? <Skeleton style={{width:'100%', height:'100px'}}/> :
						editedTags?.map((tag, index) => {
							return (
									<Grid container alignItems='center'>
										<Grid item>
											<Typography 
												variant='h5' 
												align='left'
												key={index} 
												id={index}
											>
												#{tag}
											</Typography>
										</Grid>

										<Grid item>
											<IconButton variant='contained' onClick={() => removeTag(tag)}>
												<HighlightOffIcon style={{color:'red'}}/>
											</IconButton>
										</Grid>
									</Grid>
								)
							})
						}
					</Grid>

				</Grid>

				<Box style={{ textAlign: 'center', marginTop:'5%' }}>
					<form id="formForTags">
						<TextField
							fullWidth
							id='outlined-basic'
							label='General Tags'
							placeholder='#baseball, #basketball, #soccer, #football'
							// onChange={handleChange}
							name='generalTags'
							// value={generalTags}
							>
						</TextField>
						<Button onClick={handleTags} > Add Tag ^^ </Button>
					</form>
				</Box>

				<EditPhotos/>

				<br />
				<hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
				<br />

				<Grid container style={{ alignItems: 'center' }}>
						
					<Grid item xs={4} style={{ alignItems: 'center' }}>
						<Typography style={{ textAlign: 'center'}}>
						<CalendarTodayIcon style={{fontSize:'50'}}/>
						</Typography>
					</Grid>

					<Grid item xs={4}>
						<Typography variant='h6' style={{ textAlign: 'center' }}>
							<Stack container>
								
								<Stack item>
									Monday
								</Stack>
								
								<Stack item>
									18
								</Stack>
								
								<Stack item>
									4:00 PM – 5:30 PM
								</Stack>

							</Stack>
						</Typography>
					</Grid>

					<Grid item xs={4}>
						<Typography variant='h6' style={{ textAlign: 'center'}}>
							{/* <DateDrawer/> */}
						</Typography>
					</Grid>

				</Grid>

				<br/>

				<Grid container style={{ alignItems: 'center' }}>
					
					<Grid item xs={4} style={{ alignItems: 'center' }}>
						<PeopleAltRounded style={{width:80, height:75}}/>
					
					</Grid>

					<Grid item xs={4}>
						<Typography variant='h6' style={{ textAlign: 'center' }}>
							{teacherData.capacity} guests
						</Typography>
					</Grid>

					<Grid item xs={4}>
						<ButtonGroup variant='contained'>
								<Button onClick={decreaseGuests}>
									<Typography variant='h5' fontWeight='bold' color='white'>
										—
									</Typography>
								</Button>
								
								<Button>
									<Typography variant='h5' fontWeight='medium' color='white'>
										{guests || teacherData.capacity}
									</Typography>
								</Button>
							
								<Button onClick={increaseGuests}>
									<Typography variant='h5' fontWeight='small' color='white'>
										+
									</Typography>
								</Button>
							</ButtonGroup>
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
						<input 
							type='number' 
							min='0'
							onChange={event => setCourseInfo(prev => ({...prev, pricePerStudent: event.target.value}))} 
							value={courseInfo.pricePerStudent}
							fullWidth 
							multiline 
							style={{width:'75%', fontSize:'24px', fontFamily:'Poppins'}}

						/>
					</Grid>
					<Grid item xs={2}>
						<Typography variant='h4'>
							/guest
						</Typography>
					</Grid>

				</Grid>

				<br/>
				<br/>

				<br/>
				<hr style={{ color: 'black', width: '90%', border: 'solid .5px' }} />
				<br/>
	
				<Button type='submit' onClick={updateCourse} variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white', marginBottom:'24px'}} fullWidth>
					Update Course
				</Button>

				<Button type='submit' onClick={deleteCourse} color='error' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white', marginBottom:'36px'}} fullWidth>
					Delete Course
				</Button>

			</form>
				
		</Container>

	);
};

export default EditCourse;



{/* <Button
onClick = {
	(e) => {
			fetch(`${backendURL}course/deleteCourse/:id`, { method: 'DELETE' })
			.then((res) => {
				return res.json();
			}).catch((err) => {
				console.log('Error deleting teacher info:\n', err);
			});
	}
} 
>
	DELETE
</Button> */}