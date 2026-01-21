import React, { useEffect } from 'react';
import { Button, Container, Input, Typography, Grid, TextField, Box, IconButton } from '@mui/material';
import useStore from "../../../store"
import TERMS from "../../../constants/terms"
import './SessionTag.css';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function SessionTag(props) {
	const {
		tags, setTags,
		courseTitle, setCourseTitle,
		courseDescription, setCourseDescription,
		studioVibe, setStudioVibe,
		whatToBring, setWhatToBring
	} = useStore()
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

	function handleCourseDescription(event) {
		event.preventDefault();
		const courseDescription = event.target.value;
		setCourseDescription(courseDescription);
	}

	const removeTag = (tag) => {
		console.log(tags)
		let filteredTags = tags.filter((specTag) => specTag !== tag)
		setTags(filteredTags)
	}





	return (
		<>
			<Container maxWidth='sm'>
				<Typography variant='h4' mb={2} mt={8} align='center'>
					Give your <span style={{ color: '#000000' }}>Studio Time </span> a title:
				</Typography>

				<Box style={{ textAlign: 'left', marginTop: '5%' }}>
					<Typography variant='h6'>
						{courseTitle}
					</Typography>
					<br />
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

				<br />
				<br />

				<Typography variant='h4' mb={2} mt={2} align='center'>
					What will you do?
				</Typography>

				<Box style={{ textAlign: 'left', marginTop: '5%' }}>
					<Typography variant='h6'>
						{courseDescription}
					</Typography>
					<br />
					<TextField
						onChange={handleCourseDescription}
						fullWidth
						multiline
						label={`What you'll do`}
						placeholder='Describe the experience. What makes your studio special? What will guests learn or create?'
						name='title'
						value={courseDescription}
					>
					</TextField>
					<Button
						size="small"
						startIcon={<AutoAwesomeIcon />}
						sx={{ mt: 1, textTransform: 'none' }}
						onClick={() => alert('AI Assist: Enter bullet points and I will polish them into a professional description! (Coming soon)')}
					>
						AI Assist: Polish description
					</Button>
				</Box>

				<br />
				<br />

				<Typography variant='h4' mb={2} mt={2} align='center'>
					Studio Vibe:
				</Typography>

				<Box style={{ textAlign: 'left', marginTop: '5%' }}>
					<TextField
						onChange={(e) => setStudioVibe(e.target.value)}
						fullWidth
						multiline
						label="Studio Vibe"
						placeholder="Describe the atmosphere of your studio (e.g., music, lighting, energy)."
						value={studioVibe}
					/>
				</Box>

				<br />
				<br />

				<Typography variant='h4' mb={2} mt={2} align='center'>
					What to bring:
				</Typography>

				<Box style={{ textAlign: 'left', marginTop: '5%' }}>
					<TextField
						onChange={(e) => setWhatToBring(e.target.value)}
						fullWidth
						multiline
						label="What to bring"
						placeholder="List anything guests should bring (e.g., comfortable shoes, a notebook)."
						value={whatToBring}
					/>
				</Box>

				<br />
				<br />

				<Typography variant='h4' mb={4} mt={2} align='center'>
					Any tags related to your {TERMS.COURSE.toLowerCase()}:
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
										<HighlightOffIcon style={{ color: 'red' }} />
									</IconButton>
								</Grid>

							</Grid>

						)
					})
				}

				<Box style={{ textAlign: 'center', marginTop: '5%' }}>
					<form id="form" onSubmit={handleTags}>
						<TextField
							fullWidth
							id='outlined-basic'
							label='Tags'
							placeholder='#sculpting, #painting, #drawing, #ceramics, #pottery, #surrealism'
							// onChange={handleChange}
							name='generalTags'
						// value={generalTags}
						>
						</TextField>
						<Input type="submit" >Add Tag ^^</Input>
					</form>
				</Box>

				<Button variant="contained" size="large" align='center' disabled={!Boolean(courseTitle) || !Boolean(courseDescription)}
					style={{ margin: '20% 0 20px', fontSize: 26, fontFamily: 'Poppins', color: 'white' }} fullWidth
					onClick={props.handleNext}>
					Next
				</Button>

			</Container>
		</>
	);
}
