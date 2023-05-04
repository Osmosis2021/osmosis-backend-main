import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Container, Card, Box, CardMedia, CardContent, Grid, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Courses from '../../assets/classes.json';

import './GetClasses.css';

const GetCourses = () => {
    const [course, setCourse] = useState(Courses);
    
    return (
        // <Container className='container'>
            <Grid className='grid' container spacing={2}>
                {course.map((elem, idx) => (
                    <Grid className='grid-child' item key={idx}  >
                        <Link to={`/classes/${elem.id}`} className='link'>
                            
                            <Card className='card'>
                                {/* <div className='cardHeader'> */}
                                    <div className='cardLeft' gap={1} align='left'>
                                        <Avatar 
                                            className='cardMedia' 
                                            src={elem.images.first} 
                                            alt={elem.name} 
                                            sx={{ width: 75, height: 75 }}
                                        />
                                        <Typography variant='body1' mt={1} fontWeight='medium' textAlign='center'>
                                            {elem.instructor}
                                        </Typography>
                                    </div>

                                    <Container className="cardBody">
                                        <CardContent className='cardContent'>
                                            <Typography gutterBottom >
                                                {elem.bio}
                                            </Typography>
                                        </CardContent>
                                    </Container>

                                    <Box className='cardFooter' alignItem='center' gutterBottom>
                                        <Typography variant='h5' margin={1} alignItem='center'>
                                            Price <br/>
                                            {elem.price}
                                        </Typography>
                                        <Typography variant='h5' margin={1} alignItem='center'>
                                            Cap. <br/>
                                            {elem.capacity}
                                        </Typography>
                                    </Box>
                                {/* </div> */}
                                
                            </Card>
                        </Link>

                    </Grid>
                ))}
            </Grid>
        // </Container>
    );
};

export default GetCourses;