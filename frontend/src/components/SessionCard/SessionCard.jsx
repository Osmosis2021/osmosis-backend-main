import React from 'react';
import { Avatar, Card, Divider, Grid, Skeleton, Stack, Typography } from '@mui/material';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./SessionCard.css";

function SessionCard (props) {
  
  // PROPS INCLUDE: date / images / courseTitle / industry / tags / price / capacity / icon / firstName / lastName / address / zipCode / profileImage / city 

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    };
  
    return (
        
        <Card>

            <Slider {...settings}>
                <div>
                    { props.icon === '0' ? <Typography>Loading...</Typography> : 
                      Boolean(props.images) ? <img src={props.images} alt='Course' className="carousel-image"/> :
                      <h3 style={{alignText:'center'}}>No image provided</h3>
                    }
                </div>
            </Slider>

            <Grid container>
          
                <Grid item xs={8}>
                    <div className="card-title">
                        <Stack direction='column' alignItems='left' spacing={1}>
                            <Typography variant='h4' className="industry">{props.courseTitle}</Typography>
                        
                            <Grid fullWidth item alignItems='left'>
                                <Typography className='tags'>
                                    <Grid container direction='row' alignItems='center'>
                                        {/* WHEN NEWLY CREATED USER, THERE IS NO TAGS TO MAP THROUGH */}
                                        { props.tags?.map((tag, index) => {
                                            return (
                                                <Typography 
                                                    variant='h5' 
                                                    align='left'
                                                    key={index} 
                                                    id={index}
                                                >
                                                    #{tag}&nbsp;
                                                </Typography>
                                                )
                                            })
                                        }
                                    </Grid>
                                </Typography>
                            </Grid>
                        
                            <Stack direction='row' alignItems='center'>
                                {/* WHEN NEWLY CREATED USER THERE IS NO ICON TO DISPLAY */}
                                <img src={require(`../../assets/icons/${props?.icon}.png`)} alt={props.icon} style={{ marginLeft:'3%', width:'22px', height:'22px'}}/>
                                <Typography variant='h4' className="industry">{props.industry}</Typography>
                            </Stack>
                            
                        </Stack>
                    </div>
                </Grid>

                <Grid item xs align='center' style={{paddingTop:'4%' }}>
                    
                    <Grid item>
                        { props.icon === '0' ? <Typography>Loading...</Typography> : 
                            <Avatar src={props.profileImage} />
                        }
                        <p className='name'> {props.firstName} {props.lastName}</p>
                        <p className='tags'>{props.capacity} capacity</p>
                        <p className='tags'>${props.price}/guest</p>
                    </Grid>

                </Grid>

            </Grid>

            {/* <Divider sx={{borderColor:'#00aeef'}}/> */}

            <Grid container className="more-info" align="center" alignItems='center'>
            
                <Grid item xs={6}>
                    <Stack>

                        <Stack item>
                            <Typography variant='h5'>{props?.date?.substr(5).split('',5)}</Typography>
                        </Stack>

                        {/* <Stack item>
                            <Typography variant='h6'>{props?.date?.split('', 4)}</Typography>
                        </Stack> */}

                        <Stack item>
                            <Typography variant='h6'>{props?.time}</Typography>
                        </Stack>
                        
                    </Stack>
                </Grid>

                <Grid item xs={6}>
                    <Stack spacing={-3} >

                        <Stack item>
                        <p>{props.address}</p>
                        </Stack>
                    
                        <Stack item>
                        <p>{props.city}, {props.zipCode}</p>
                        </Stack>

                    </Stack>
                </Grid>

            </Grid>

        </Card>
    )
}

export default SessionCard;