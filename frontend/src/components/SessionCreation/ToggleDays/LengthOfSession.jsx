import { Grid, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import useStore from '../../../store';


import TERMS from '../../../constants/terms';


const StyledToggle = withStyles({
    root: {
        color: '#000000',
        '&$selected': {
            color: 'white',
            background: '#000000',
        },
        '&:hover': {
            borderColor: '#000000',
            color: 'white',
            background: '#000000',
        },
        '&:hover$selected': {
            borderColor: '#000000',
            background: '#000000',
        },
        borderRadius: '50px',
        height: '44px',
        minWidth: '80px',
        padding: '0 20px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        border: '1px solid #EDEDED',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
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
                Choose length of your {TERMS.CLASS.toLowerCase()}:
            </Typography>

            <Grid container spacing={2} justifyContent='center'>
                {Length.map((length) => (
                    <Grid item key={length}>
                        <ToggleButtonGroup exclusive value={newCourseDuration} onChange={(e, val) => { if (val) setNewCourseDuration(val) }}>
                            <StyledToggle
                                value={length}
                                aria-label={`${length} minutes`}
                            >
                                {length === 60 ? '1 hr' : length === 90 ? '1.5 hr' : `${length} min`}
                            </StyledToggle>
                        </ToggleButtonGroup>
                    </Grid>
                ))}
            </Grid>
        </div>
    )
}

export default LengthOfSession

