import React, { useEffect } from 'react';
import { Container, Input, Typography, Grid, TextField, Box, IconButton } from '@mui/material';
import useStore from "../../../store"
import './SessionTag.css';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

export default function SessionTag(props) {
    const {tags, setTags, courseTitle, setCourseTitle, courseDescription, setCourseDescription} = useStore()
	props.setIsNextDisabled((!Boolean(courseTitle)) || (!Boolean(courseDescription)))
	useEffect(() => {
		setTags([])
	}, [])

	function handleTags(event) {
		event.preventDefault();
		const form = document.getElementById('form');
    	const tag = document.getElementById('outlined-basic').value;
		const newTags = [...tags, tag]
		setTags(newTags);
		form.reset();
	}

	function handleTitle(event) {
		event.preventDefault();
		const courseTitle = event.target.value;
		setCourseTitle(courseTitle);
	}
	
	function handleCourseDescription (event) {
		event.preventDefault();
		const courseDescription = event.target.value;
		setCourseDescription(courseDescription);
	}

	const removeTag = (tag) => {
		console.log(tags)
		let filteredTags = tags.filter((specTag) =>  specTag !== tag )
		setTags(filteredTags)
	}





	return (
		<>
		<Container maxWidth='sm'>
			<Typography variant='h4' mb={2} mt={8} align='center'>
				Title of your course:
			</Typography>

			<Box style={{ textAlign: 'left', marginTop:'5%' }}>
				<Typography variant='h6'>
					{courseTitle}
				</Typography>
				<br/>
				<TextField
					onChange={handleTitle}
					fullWidth
					label='Title'
					placeholder='How to build a startup'
					name='title'
					value={courseTitle}
					>
				</TextField>
			</Box>
		
			<br/>
			<br/>

			<Typography variant='h4' mb={2} mt={2} align='center'>
				Course description:
			</Typography>

			<Box style={{ textAlign: 'left', marginTop:'5%' }}>
				<Typography variant='h6'>
					{courseDescription}
				</Typography>
				<br/>
				<TextField
					onChange={handleCourseDescription}
					fullWidth
					multiline
					label='Course Description'
					placeholder='We meet outside my local cafe called Grey Cafe and we grab a cup of coffee and chat about the financial markets'
					name='title'
					value={courseDescription}
					>
				</TextField>
			</Box>

			<br/>
			<br/>

			<Typography variant='h4' mb={4} mt={2} align='center'>
				Any tags related to your course:
			</Typography>

			{
				tags.map((tag, index) => {
					return (
						<Grid container alignItems='left'>
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

			<Box style={{ textAlign: 'center', marginTop:'5%' }}>
			<form id="form" onSubmit={handleTags}>
				<TextField
					fullWidth
					id='outlined-basic'
					label='Tags'
					placeholder='#raisingCapital, #goToMarket, #MVP, #leanStartup'
					// onChange={handleChange}
					name='generalTags'
					// value={generalTags}
					>
				</TextField>
				<Input type="submit" >Add Tag ^^</Input>
			</form>
			</Box>




		</Container>
		</>
	);
}
