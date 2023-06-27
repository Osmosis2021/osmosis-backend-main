import { Typography, Grid, ButtonGroup, Button, Stack } from '@mui/material';
import { PeopleAltRounded } from '@mui/icons-material';
import React from 'react';
import useStore from '../../../store';
import './Capacity.css';

function Capacity(props) {

	const {capacity, increaseCapacity, decreaseCapacity} = useStore()
    props.setIsNextDisabled(!Boolean(capacity))

	return (
		<div>
			<Grid container direction='column' style={{ alignItems: 'center' }}>
				
				<Stack
					mb={4}
					mt={8}
					direction='row'
					spacing={2}
					style={{ alignItems: 'center' }}>
					<Typography variant='h4'>
						Number of <span style={{ color: '#00aeef' }}>guests: </span>
					</Typography>
				</Stack>

				<Grid container sx={{display:'flex', padding:'10px', justifyContent:'space-evenly'}}>
					
					<PeopleAltRounded color='primary' style={{width:90, height:100}}/>
					
					<ButtonGroup variant='contained'>
						
						<Button onClick={decreaseCapacity}>
							<Typography variant='h4' fontWeight='bold' color='white'>
								—
							</Typography>
						</Button>
						
						<Button>
							<Typography variant='h3' fontWeight='medium' color='white'>
								{capacity}
							</Typography>
						</Button>
					
						<Button onClick={increaseCapacity}>
							<Typography variant='h4' fontWeight='small' color='white'>
								+
							</Typography>
						</Button>

					</ButtonGroup>

                </Grid>
					
				<Button variant="contained" size="large" align='center' disabled={!Boolean(capacity)}
					style={{margin: '20% 0 20px', width:'80%', fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth
					onClick={props.handleNext}>
					Next
				</Button>

			</Grid>
		</div>		
	);
}

export default Capacity;