import React, {useState} from 'react';
import { Grid, Container, Typography, ToggleButton, Stack, Fab } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import './Industry.css';
import TopNavBar from '../../TopNavBar/TopNavBar';
import useStore from '../../../store';


const industries = [
    { id: 0, label: 'music', icon: 'music', },
    { id: 1, label: 'cook', icon: 'cook', },
    { id: 2, label: 'language', icon: 'language', },
    { id: 3, label: 'dance', icon: 'dance', },
    { id: 4, label: 'art', icon: 'art', },
    { id: 5, label: 'business', icon: 'business', },
    { id: 6, label: 'yoga', icon: 'yoga', },
    { id: 7, label: 'sports', icon: 'sports', },
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
			<Stack mb={4} mt={6} style={{ alignItems: 'center' }}>
				<Typography variant='h3'>
					Select your overall{' '}
					<span style={{ color: '#00aeef' }}>industry: </span>
				</Typography>
			</Stack>

			<Grid container rowSpacing={2}>

			{
				industries.map((_industry, id) => {
					return (
						<Grid item xs={6} style={{textAlign:'center'}}>
							
							<ToggleButton
								key={id}
								value={_industry.label}
								variant='contained'
								onClick={(event)=>handleClick(event, id)}
								className='industryButton'
								style={{border:'#00aeef solid 1px', backgroundColor: newCourseIndustry === _industry.label ? '#00aeef' : 'white'}} 
							>
								<img alt={_industry.label} src={require(`../../../assets/icons/${_industry.icon}.png`)} style={{ width: 70, height: 70 }}/>
								<Typography
								gutterBottom
								variant='h5'
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
