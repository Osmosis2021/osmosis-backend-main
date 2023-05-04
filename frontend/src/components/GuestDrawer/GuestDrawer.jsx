import React, { useState } from 'react';
import { Button, ButtonGroup, Box, Container, Drawer, Grid, Paper, styled, Typography, IconButton }  from '@mui/material/';
import { PeopleAltRounded } from '@mui/icons-material';
import useStore from '../../store';
import CloseIcon from '@mui/icons-material/Close';


export default function GusetDrawer(props) {

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [state, setState] = useState(false);
	const [guests, setGuests] = useState(1);
    const maximum = props.capacity
    const {setGuestsEntered} = useStore();

    const increaseGuests = () => {
        if (guests < maximum) {
            setGuests((prevGuests) => (prevGuests + 1));
            setGuestsEntered(guests)
        };
    };

    const decreaseGuests = () => {
        if (guests > 1) {
            setGuests((prevGuests) => (prevGuests - 1));
            setGuestsEntered(guests)
        };
    };


    return (
    <>
        <Button onClick={()=>setIsDrawerOpen(true)}>
            Guests
        </Button>

        <Drawer anchor='bottom' open={isDrawerOpen} onClose={()=> setIsDrawerOpen(false)}>
        <div style={{width:'100%', display:'flex', justifyContent:'right', padding:'3%'}}>
            <IconButton
                color="inherit"
                onClick={()=>setIsDrawerOpen(false)}
                aria-label="close"
            >
                <CloseIcon />
            </IconButton>
        </div>
            <Box p={2} textAlign='center' role='presentation'>
                <Container>
                    <Typography variant='h4'>
                        Number of Guests:
                    </Typography> 
                    <br/>
                    <Box sx={{display:'flex', justifyContent:'space-between'}}>
                        <PeopleAltRounded color='primary' style={{width:90, height:100}}/>
                        <ButtonGroup variant='contained'>
                            <Button onClick={decreaseGuests}>
                                <Typography variant='h3' fontWeight='bold' color='white'>
                                    —
                                </Typography>
                            </Button>
                            
                            <Button>
                                <Typography variant='h2' fontWeight='medium' color='white'>
                                    {guests}
                                </Typography>
                            </Button>
                        
                            <Button onClick={increaseGuests}>
                                <Typography variant='h3' fontWeight='small' color='white'>
                                    +
                                </Typography>
                            </Button>
                        </ButtonGroup>
                    </Box>
                </Container>
            </Box>
        </Drawer>
    </>
  )
}