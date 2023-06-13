import React from 'react';
import { Grid, Container, Typography, ToggleButton, Stack } from '@mui/material';
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
	const {newCourseIndustry, setNewCourseIndustry, setIcon} = useStore();

    props.setIsNextDisabled(!Boolean(newCourseIndustry))
  
  
	return (
		<>
		{/* <TopNavBar next='empty' back='/role' activeStep='1'/> */}

		<Container maxWidth='sm' align='center'>
			<Stack mb={2} mt={2} style={{ alignItems: 'center' }}>
				<Typography variant='h4'>
					Select your overall{' '}
					<span style={{ color: '#00aeef' }}>industry: </span>
				</Typography>
			</Stack>

			<Grid container rowSpacing={2}>

			{
				industries.map((_industry, id) => {
					return (
						<Grid item xs={6} style={{textAlign:'center', paddingBottom: '22px'}}>
							<ToggleButton
								key={id}
								value={_industry.label}
								variant='contained'
								onClick={(event)=>handleClick(event, id)}
								className='industryButton'
								style={{border:'#00aeef solid 1px', backgroundColor: newCourseIndustry === _industry.label ? '#00aeef' : 'white'}} 
							>
								<img alt={_industry.label} src={require(`../../../assets/icons/${_industry.icon}.png`)} style={{ width: 65, height: 65 }}/>
								<Typography
								gutterBottom
								variant='h6'
								mt={1}
								color={newCourseIndustry === _industry.label ? 'white' : '#00aeef'}
								fontWeight='medium'>
								{_industry.label}
								</Typography>
							</ToggleButton>
						</Grid>
					)
				})
			}
			</Grid>
		</Container>
		</>
	);
}
