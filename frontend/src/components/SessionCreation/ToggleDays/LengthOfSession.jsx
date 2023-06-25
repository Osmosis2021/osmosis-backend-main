import { Grid, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import useStore from '../../../store';


const StyledToggle = withStyles({
    root: {
    color: '#00aeef',
    '&$selected': {
        color: 'white',
        background: '#00aeef',
    },
    '&:hover': {
        borderColor: '#00aeef',
        color: 'white',
        background: '#00aeef',
    },
    '&:hover$selected': {
        borderColor: '#00aeef',
        background: '#00aeef',
    },
    borderRadius: '20%',
    height: '50px',
    width: '50px',
    },
    selected: {},
})(ToggleButton);


function LengthOfSession() {

    const [isClicked, setIsClicked] = useState(false);
    const { newCourseDuration, setNewCourseDuration } = useStore();
    const Length = [30, 60, 90]

    useEffect(() => {
        setNewCourseDuration(60)
    }, [])

    const handleClick = (event) => {
		setNewCourseDuration(Number(event.target.value));
        setIsClicked(!isClicked);
	}


  return (
    <div>
          <Typography variant='h4' mb={2} mt={8} align='center'>
            Choose length of your session:
          </Typography>

          <Grid container mt={2} mb={2} justifyContent='space-around' alignItems='center'>
          {
            Length.map((length) => {
                return (
                    <Grid item key={length}>
                        <ToggleButtonGroup>
                            <StyledToggle
                                value={length}
                                selected={length === newCourseDuration}
                                onClick={handleClick}
                            >{`${length} minutes`}
                            </StyledToggle>
                        </ToggleButtonGroup>
                    </Grid>
                )
            })
          }
          </Grid>
    </div>
  )
}

export default LengthOfSession

