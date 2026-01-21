import React from 'react';
import { Button, Container, OutlinedInput, Typography, Grid } from '@mui/material';
import useStore from "../../../store";

import TERMS from '../../../constants/terms';

import './Cost.css';

function Cost(props) {
	const { newCourseCost, setNewCourseCost } = useStore()
	props.setIsNextDisabled(!Boolean(newCourseCost))

	const setWholeNumberCost = val => {
		setNewCourseCost(Math.max(Math.floor(val), 0))
	}

	return (
		<>
			<Container align='center'>
				<Typography variant='h4' mt={8} mb={12} align='center'>
					<span style={{ color: '#000000' }}>Cost </span>of your {TERMS.CLASSES}:
					<Typography>* Studio Time fee is 10%: ${(newCourseCost * .1).toFixed(2)}*</Typography>
					{/* <Typography>* No decimals *</Typography> */}
				</Typography>


				<Grid container style={{ alignItems: 'center', justifyContent: 'center' }}>
					<Grid item xs={2}>
						<Typography variant='h1' style={{ textAlign: 'center' }}>
							$
						</Typography>
					</Grid>
					<Grid item xs={4}>
						<OutlinedInput
							onChange={(e) => setWholeNumberCost(e.target.valueAsNumber)}
							value={newCourseCost}
							style={{ fontSize: '50px' }}
							id='outlined-adornment-amount'
							type='number'
							min="0"
							step="1"
						/>
					</Grid>
				</Grid>
				<br />
				<hr style={{ width: '75%' }} />
				<br />
				<Typography variant='h3'>{TERMS.CLASS.toLowerCase()}</Typography>

				<Button variant="contained" size="large" align='center' disabled={!Boolean(newCourseCost)}
					style={{ margin: '20% 0 20px', width: '80%', fontSize: 26, fontFamily: 'Poppins', color: 'white' }} fullWidth
					onClick={props.handleNext}>
					Next
				</Button>

			</Container>
		</>
	);
}

export default Cost;
