import React from 'react';
import { Grid, Container, Typography, ToggleButton, Stack, Button } from '@mui/material';
import './Industry.css';
import useStore from '../../../store';


const industries = [
	{ id: 0, label: 'music', icon: 'music', },
	{ id: 1, label: 'cook', icon: 'cook', },
	{ id: 2, label: 'language', icon: 'language', },
	{ id: 3, label: 'dance', icon: 'dance', },
	{ id: 4, label: 'art', icon: 'art', },
	{ id: 5, label: 'business', icon: 'business', },
	{ id: 6, label: 'mindfulness', icon: 'yoga', },
	{ id: 7, label: 'sports', icon: 'sports', },
	{ id: 8, label: 'tech', icon: 'tech', },
	{ id: 9, label: 'fitness', icon: 'fitness', }
];


export default function Industry(props) {

	const handleClick = (event) => {
		setNewCourseIndustry(event.target.value);
		setIcon(event.target.innerText.toLowerCase());
	}
	const { newCourseIndustry, setNewCourseIndustry, setIcon } = useStore();

	props.setIsNextDisabled(!Boolean(newCourseIndustry))


	return (
		<>
			{/* <TopNavBar next='empty' back='/role' activeStep='1'/> */}

			<Container maxWidth='sm' align='center'>
				<Stack mb={2} mt={8} style={{ alignItems: 'center' }}>
					<Typography variant='h4'>
						Tell guests what you'll be doing
					</Typography>
				</Stack>

				<Grid container rowSpacing={2}>
					{industries.map((_industry, id) => {
						return (
							<Grid item xs={6} style={{ textAlign: 'center' }}>
								<ToggleButton
									key={id}
									value={_industry.label}
									variant='contained'
									onClick={(event) => handleClick(event, id)}
									className='industryButton'
									style={{ border: '#000000 solid 1px', backgroundColor: newCourseIndustry === _industry.label ? '#000000' : 'white' }}
								>
									<img alt={_industry.label} src={require(`../../../assets/icons/${_industry.icon}.png`)} style={{ width: 65, height: 65 }} />
									<Typography
										style={{ pointerEvents: 'none' }}
										gutterBottom
										variant='h6'
										mt={1}
										color={newCourseIndustry === _industry.label ? 'white' : '#000000'}
										fontWeight='medium'>
										{_industry.label}
									</Typography>
								</ToggleButton>
							</Grid>
						)
					})}
				</Grid>
				<Button variant="contained" size="large" align='center' disabled={!Boolean(newCourseIndustry)}
					style={{ margin: '15px 0 20px', width: '80%', fontSize: 26, fontFamily: 'Poppins', color: 'white' }} fullWidth
					onClick={props.handleNext}>
					Next
				</Button>
			</Container>
		</>
	);
}
