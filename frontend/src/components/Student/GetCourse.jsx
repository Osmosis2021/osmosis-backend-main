import { Box, Grid, Typography, Button } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Courses from '../../assets/classes.json';
import { Avatar } from '@mui/material';
import { PeopleAltRounded } from '@mui/icons-material';
import './getCourse.css';

const GetCourse = () => {
    const { course } = useParams();

    const [session, setSession] = useState({});
    const [modal, setModal] = useState(false)

    const getClass = (course) => {
        for (let i = 0; i < Courses.length; i++) {
            if (Courses[i].id === course) {
                setSession(Courses[i]);
            }
        }
    }

    const handleModal = (e) => {
        e.preventDefault();
        setModal(true);
    }

    useEffect(() => {
      getClass(course);
    }, [session]);
    
    return (
        <div className='container'>
           <Grid>
                <Grid className='top' item>
                    <div className='left'>
                        <Avatar 
                            className='cardMedia' 
                            src={session.images} 
                            alt={session.name} 
                            sx={{ width: 75, height: 75 }}
                        />
                        <Typography variant='body1' mt={1} color="white" fontWeight= '700' textAlign='center'>
                            {session.instructor}
                        </Typography>
                    </div>
                    <Typography className='header' variant='h5'>
                        {session.bio}
                    </Typography>
                </Grid>
                <Grid className='middle' marginTop='1rem' item>
                    <Box className='infoBox'>
                        <Typography className='span' >{session.price}</Typography>
                        <Typography className='span' >60min</Typography>
                        <Typography className='span' > <PeopleAltRounded /> {session.capacity}</Typography>
                    </Box>
                    <Box className='location'>
                        {/* <Maap/> */}
                    </Box>
                </Grid>
                <Grid className='pictures' marginTop='1rem' item>
                    Photos
                </Grid>
            </Grid>

            <div className='navigation'>
                {/* <Link to={`/${session.id}/enroll`} style={{textDecoration: 'none'}}> */}
                    <Button onClick={handleModal} variant="contained" size="large" style={{ maxWidth: "2rem",fontSize: 10, padding: 10 }} fullWidth>
                        Enroll
                    </Button>
                {/* </Link> */}
                <Link to='/classes' style={{textDecoration: 'none'}}>
                    <Button variant="contained" size="large" style={{fontSize: 10, padding: 10 }} fullWidth>
                        Back
                    </Button>
                </Link>
            </div>

        </div>
    );
};

export default GetCourse;