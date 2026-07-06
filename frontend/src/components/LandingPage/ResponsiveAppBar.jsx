import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import { Link } from 'react-router-dom';
import logo from '../../assets/studio_time_logo_white.png';

function HideOnScroll(props) {

    const { children, window } = props;

    const trigger = useScrollTrigger({
        target: window ? window() : undefined,
    });

    return (
        <Slide appear={false} direction="down" in={!trigger}>
            {children}
        </Slide>
    );
}


function ResponsiveAppBar(props) {

    return (
        <React.Fragment>
            <HideOnScroll {...props}>
                <AppBar>
                    <Toolbar>
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                            <img src={logo} alt="Studio Time" style={{ height: '32px', width: 'auto', marginRight: '16px' }} />
                        </Box>

                        <Link to='/'>
                            <Button style={{ margin: '5px', color: 'white' }} variant='contained'>Login</Button>
                        </Link>
                        <Link to='/sign-up'>
                            <Button style={{ margin: '5px', color: '#000000', backgroundColor: 'white' }} variant='contained'>Signup</Button>
                        </Link>

                    </Toolbar>
                </AppBar>
            </HideOnScroll>
        </React.Fragment>
    );
}

export default ResponsiveAppBar;