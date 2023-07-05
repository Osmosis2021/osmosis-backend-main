import { Button, ButtonGroup, Card, Container, Grid, Input, IconButton, Skeleton, Stack, TextField, Typography, Box, FormHelperText } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import React, { useState, useEffect } from 'react';
import TopNavBar from '../../TopNavBar/TopNavBar';
import useStore from '../../../store';
import EditPhotos from './EditPhotos';
import { useNavigate, useParams } from 'react-router-dom';
import { PeopleAltRounded } from '@mui/icons-material';

import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import mapboxgl from 'mapbox-gl'
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'


  // images / courseTitle / industry / tags / pricePerStudent / capacity / icon / firstName / lastName / address / zipCode / profileImage / city 


// TO DO:

// - Figure out Gallery Resizing for larger screens
// - Mapbox functionality, error regarding unmounted components
// - Modal functionality to populate number of guests in payment field
// - Payment functionality

const EditCourse = (props) => {
	const {userName, isTeacher } = useStore();
	const [isLoading, setIsLoading] = useState(true)
	const [courseInfo, setCourseInfo] = useState({})
	const navigate = useNavigate();
	const { courseID } = useParams();

	useEffect(() => {
		fetch(`${backendURL}course/getCourse/${courseID}`)
		.then((res) => {
			return res.json();
		}).then((data) => {
			setCourseInfo(data)
			setIsLoading(false)
		}).catch((err) => {
			console.log('Error getting teacher info:\n', err);
		});
	}, [])

	const updateCourse = async (e) => {
        e.preventDefault();
        
        try {
            await fetch (`${backendURL}course/updateCourse/${courseInfo._id}`, {
                body: JSON.stringify(courseInfo),
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            }).then(() => {
				setIsLoading(false)
                alert('Successfully updated your course')
                navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
            })
        } catch (err) {
            alert('Update failed, please try again later')
            console.log('Error updating user:\n', err);
        };
    }

	const removeTag = (tag) => {
		let filteredTags = courseInfo.tags.filter((selectedTag) =>  selectedTag !== tag )
		setCourseInfo({...courseInfo, tags: filteredTags})
	}

	function handleTags() {
    	const tag = document.getElementById('outlined-basic').value;
		const newTags = [...courseInfo.tags, tag]
		setCourseInfo({...courseInfo, tags: newTags})
	}

	const increaseCapacity = () => setCourseInfo({...courseInfo, capacity: parseInt(courseInfo.capacity) + 1})

    const decreaseCapacity = () => {
        if (parseInt(courseInfo.capacity) > 1) {
            setCourseInfo({...courseInfo, capacity: parseInt(courseInfo.capacity) - 1})
        };
    };

	const deleteCourse = async (e) => {
        e.preventDefault();
		try {
			await fetch (`${backendURL}course/deleteCourse/${courseInfo._id}`, {
				method: 'DELETE'
			}).then(() => {
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
						{isLoading ? <Skeleton /> :
							<img src={require(`../../../assets/icons/${courseInfo?.industry}.png`)} style={{height:25, width:25}} alt={courseInfo.industry}/>
						}
					</Grid>
					<Grid item style={{textAlign:'left'}}>
						<Typography variant='h4'>{courseInfo.industry}</Typography>
					</Grid>
				</Grid>
			
				<Grid container style={{alignItems:'center', justifyContent:'center', padding: '0 5%', margin: '2%' }}>
					<Grid container direction='row' alignItems='center'>
						{isLoading ? <Skeleton style={{width:'100%', height:'100px'}}/> :
						courseInfo.tags?.map((tag, index) => {
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
						})}
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

				<Grid container style={{ alignItems: 'center', justifyContent: 'space-between' }}>
					<Grid item xs={2} style={{ alignItems: 'center' }}>
						<Typography style={{ textAlign: 'left'}}>
							<CalendarTodayIcon style={{width:80, height:75}}/>
						</Typography>
					</Grid>

					<Grid item xs={4}>
						<Typography variant='h6' style={{ textAlign: 'center' }}>
							Availability:
							<br/>
							{`${courseInfo?.timeslots?.length || 0} upcoming`}
							<br/>
							course timeslots
						</Typography>
					</Grid>

					<Grid xs={4} align='right'>
						<Button xs={4} type='submit' variant="contained" size="small" align='center' style={{fontSize: 18, fontFamily:'Poppins', color:'white'}} >
							Edit<br/>Availability
						</Button>
					</Grid>

					<Grid item xs={4}>
						<Typography variant='h6' style={{ textAlign: 'center'}}>
							{/* <DateDrawer/> */}
						</Typography>
					</Grid>
				</Grid>

				<br/>

				<Grid container style={{ alignItems: 'center', justifyContent: 'space-between' }}>
					<Grid item xs={2} style={{ alignItems: 'center' }}>
						<PeopleAltRounded style={{width:80, height:75}}/>
					</Grid>

					<Grid item xs={4}>
						<Typography variant='h6' style={{ textAlign: 'center' }}>
							{courseInfo.capacity || 1} capacity
						</Typography>
					</Grid>

					<Grid item xs={4} style={{fontSize: 18, fontFamily:'Poppins', color:'white', textAlign: 'right'}}>
						<ButtonGroup variant='contained'>
							<Button onClick={decreaseCapacity}>
								<Typography variant='h5' fontWeight='bold' color='white'>
									—
								</Typography>
							</Button>
							
							<Button>
								<Typography variant='h5' fontWeight='medium' color='white'>
									{courseInfo.capacity || 1}
								</Typography>
							</Button>
						
							<Button onClick={increaseCapacity}>
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
