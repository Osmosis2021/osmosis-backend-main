import React, { useEffect } from 'react';
import { Box,Typography, Grid, ButtonGroup, Button, Stack } from '@mui/material';
import './Capacity.css';
import { PeopleAltRounded } from '@mui/icons-material';
import useStore from '../../../store';


// const capacity = [
// 	{ id: 0, label: 'Many', value: '5+', icon: 'many', path: '../../../assets/icons/many.png' },
// 	{ id: 1, label: 'Few', value: '3-5', icon: 'few', path: '../../../assets/icons/few.png' },
// 	{ id: 2, label: 'Little', value: '1-3', icon: 'little', path: '../../../assets/icons/little.png' }
// ]

function Capacity() {
	// const [isClicked, setIsClicked]=useState(false);

	// function handleClick(event, id) {
	// 	id===capacity[id].id && setIsClicked(id)
	// 	const capacity = event.target.value;
	// 	localStorage.setItem('capacity', capacity);
	// };
	// const [guests, setGuests] = useState(1);

	const {capacity, setCapacity, increaseCapacity, decreaseCapacity} = useStore()

	useEffect(() => {
		setCapacity(1)
	}, [])

	// const increaseGuests = () => {
    //     setGuests((prevGuests) => (prevGuests + 1));
    // };

    // const decreaseGuests = () => {
    //     if (guests > 1) {
    //         setGuests((prevGuests) => (prevGuests - 1));
    //     };
    // };




	return (
		<div>
			<Grid container direction='column' style={{ alignItems: 'center' }}>
				<Stack
					mb={4}
					mt={6}
					direction='row'
					spacing={2}
					style={{ alignItems: 'center' }}
				>
					<Typography variant='h3'>
						Number of <span style={{ color: '#00aeef' }}>guests: </span>
					</Typography>
				</Stack>

				<Box sx={{display:'flex', justifyContent:'space-between'}}>
                        <PeopleAltRounded color='primary' style={{width:90, height:100}}/>
                        <ButtonGroup variant='contained'>
                            <Button onClick={decreaseCapacity}>
                                <Typography variant='h3' fontWeight='bold' color='white'>
                                    —
                                </Typography>
                            </Button>
                            
                            <Button>
                                <Typography variant='h2' fontWeight='medium' color='white'>
                                    {capacity}
                                </Typography>
                            </Button>
                        
                            <Button onClick={increaseCapacity}>
                                <Typography variant='h3' fontWeight='small' color='white'>
                                    +
                                </Typography>
                            </Button>
                        </ButtonGroup>
                    </Box>


					
			</Grid>
		</div>		
	);
}

export default Capacity;