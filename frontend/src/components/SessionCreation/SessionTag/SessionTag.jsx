import React, { useEffect } from 'react';
import { Container, Input, Typography, Grid, TextField, Box, IconButton } from '@mui/material';
import useStore from "../../../store"
import './SessionTag.css';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

export default function SessionTag() {
    const {tags, setTags, courseTitle, setCourseTitle} = useStore()
	// const [tags, setTags] = useState([]);
	useEffect(() => {
		setTags([])
		setCourseTitle('')
	}, [])

	function handleTags(event) {
		event.preventDefault();
		const form = document.getElementById('form');
    	const tag = document.getElementById('outlined-basic').value;
		const newTags = [...tags, tag]
		setTags(newTags);
		// localStorage.setItem('generalTags', newTags)
		form.reset();
	}

	function handleTitle(event) {
		event.preventDefault();
		const courseTitle = event.target.value;
		setCourseTitle(courseTitle);
	}

	const removeTag = (tag) => {
		console.log(tags)
		let filteredTags = tags.filter((specTag) =>  specTag !== tag )
		setTags(filteredTags)
	}





	return (
		<>
		<Container maxWidth='sm'>
			<Typography variant='h3' mb={2} mt={4} align='center'>
				Enter the title of your course:
			</Typography>

			
				<Box style={{ textAlign: 'center', marginTop:'5%' }}>
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
						>
					</TextField>
					
				</Box>
			

			<br/>

			<Typography variant='h3' mb={2} mt={4} align='center'>
				Enter any tags associated to your course:
			</Typography>

			{
				tags.map((tag, index) => {
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

			<Box style={{ textAlign: 'center', marginTop:'5%' }}>
			<form id="form" onSubmit={handleTags}>
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
				<Input type="submit" >Add Tag ^^</Input>
			</form>
			</Box>
		</Container>
		</>
	);
}
