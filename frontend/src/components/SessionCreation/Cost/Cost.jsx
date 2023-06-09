import React, {useEffect} from 'react';
import { Container, OutlinedInput, Typography, Grid } from '@mui/material';
import useStore from "../../../store";

import './Cost.css';

function Cost(props) {
    const {newCourseCost, setNewCourseCost} = useStore()
    props.setIsNextDisabled(!Boolean(newCourseCost))

	const setWholeNumberCost = val => {
		setNewCourseCost(Math.max(Math.floor(val), 0))
	}

	useEffect(() => {
		setNewCourseCost('')
	}, [])

	return (
		<>
		<Container align='center'>
			<Typography variant='h4' mt={2} mb={12} align='center'>
				<span style={{ color: '#00aeef' }}>Cost </span>of your Sessions:
			</Typography>

			<Grid container style={{ alignItems: 'center', justifyContent:'center'}}>
				<Grid item xs={2}>
					<Typography variant='h1' style={{ textAlign: 'center' }}>
						$
					</Typography>
				</Grid>
				<Grid item xs={4}>
					<OutlinedInput
						onChange={(e) => setWholeNumberCost(e.target.valueAsNumber)}
						value={newCourseCost}
						style={{fontSize:'50px'}}
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
			<Typography variant='h3'>session</Typography>
		</Container>
		</>
	);
}

export default Cost;
