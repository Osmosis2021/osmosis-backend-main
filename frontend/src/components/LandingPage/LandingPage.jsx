import { Button, Container, Grid, List, ListItem, Stack, Typography, ListItemIcon } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ResponsiveAppBar from './ResponsiveAppBar';
import './LandingPage.css';
import smallVideo from './Comp1.mp4';
import largeVideo from './animatedVid.mp4';
import CreateCourseWalkthrough from './osmosisWalkthrough.mp4'
import mapWalkthrough from './mapWalkthrough.mp4'
import Messaging from './messaging.png'
import AOS from 'aos';
import 'aos/dist/aos.css';
import pay from "../../assets/pay.png"
import schedule from "../../assets/schedule.png"
import megaphone from "../../assets/megaphone.png"
import InstagramIcon from '@mui/icons-material/Instagram';
import { Link as LinkRouter } from 'react-router-dom';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import map from '../../assets/map.png'
import reviews from '../../assets/reviews.png'
import learning from '../../assets/learning.png'


function LandingPage() {

    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 900);

    useEffect(() => {

        const handleResize = () => {
            setIsLargeScreen(window.innerWidth > 900)
        };

        window.addEventListener('resize', handleResize)

        AOS.init({
            duration: 1200,
            once: false,
            mirror: true,
        });

        return () => {
            window.removeEventListener('resize', handleResize);
        };

    }, []);

    return (
        <>
            <ResponsiveAppBar />

            <div className="showcase">
                {
                    isLargeScreen ? (
                        <video playsInline lazyload muted autoPlay id="video-bg" src={largeVideo}>
                        </video>
                    ) : <video playsInline lazyload muted autoPlay id="video-bg" src={smallVideo}>
                    </video>
                }

                <div className="overlay">
                </div>

                <Container className="text">
                    <Grid container direction='column'>
                        <Grid item data-aos="fade-left">
                            <Typography variant='h2'>Inside the studios of</Typography>
                            <Typography variant='h2'>real artists 🎨</Typography>
                            <br />
                        </Grid>
                        <Grid item xs={12} md={2} data-aos="fade-right">
                            <Typography variant='h4' style={{ paddingTop: '5%', width: isLargeScreen ? '60%' : '100%', lineHeight: '1.5' }}>
                                Studio Time is a marketplace designed to connect guests & artists
                                <span style={{ color: '#000000' }}> in-person</span>.
                                Living in an era dominated by technology, Studio Time stands out by blending
                                <span style={{ color: '#000000' }}> high tech with high touch</span> ➡️ we leverage tech to create a
                                creative environment truly centered around people.
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid item paddingTop='10%'>
                        <LinkRouter to='/sign-up'>
                            <Button data-aos="fade-up" variant='contained' style={{ color: 'white', fontSize: '24px' }}>
                                Request Access
                            </Button>
                        </LinkRouter>
                    </Grid>

                </Container>

            </div>


            <Container style={{ paddingTop: '5%' }}>
                <Grid container spacing={2} alignItems='center' justifyContent='center'>
                    <Grid item lg={6} md={6} xs={12}>
                        <Stack container alignItems='center' style={{ paddingBottom: '5%' }} spacing={4}>
                            <Stack item data-aos='fade-up'>
                                <Typography variant="h2" color="primary">
                                    Artists:
                                </Typography>
                            </Stack>

                            <Stack item data-aos='fade-left' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                <img width="50em" height="50em" src={schedule} alt="calendar" />

                                <Typography variant="h4" color="primary">
                                    Manage Availability
                                </Typography>

                            </Stack>

                            <Stack item data-aos='fade-right' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                <img width="50em" height="50em" src={pay} alt="" />

                                <Typography variant="h4" color="primary">
                                    Direct payments
                                </Typography>
                            </Stack>

                            <Stack item data-aos='fade-left' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                <img width="50em" height="50em" src={Messaging} alt="" />

                                <Typography variant="h4" color="primary">
                                    Message guests
                                </Typography>
                            </Stack>

                            <Stack item data-aos='fade-right' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                <img width="50em" height="50em" src={megaphone} alt="" />

                                <Typography variant="h4" color="primary">
                                    Grow your studio
                                </Typography>
                            </Stack>

                        </Stack>
                    </Grid>

                    <Grid item data-aos='fade-up' lg={6} md={6} xs={12} style={{ justifyContent: 'center', display: 'flex' }}>
                        <video playsInline muted autoPlay id="video-bg" src={CreateCourseWalkthrough} style={{ width: 'auto', height: '80vh', maxWidth: '600px' }}></video>
                    </Grid>
                </Grid>
            </Container>




            <Container style={{ paddingTop: '5%' }}>
                <Grid container spacing={2} alignItems='center' justifyContent='center'>

                    {
                        isLargeScreen ? (
                            <>
                                <Grid item data-aos='fade-up' lg={6} md={6} xs={12} style={{ justifyContent: 'center', display: 'flex' }}>
                                    <video playsInline muted autoPlay id="video-bg" src={mapWalkthrough} style={{ width: 'auto', height: '80vh', maxWidth: '600px' }}></video>
                                </Grid>

                                <Grid item lg={6} md={6} xs={12}>
                                    <Stack container alignItems='center' style={{ paddingBottom: '5%' }} spacing={4}>
                                        <Stack item data-aos='fade-up'>
                                            <Typography variant="h2" color="primary">
                                                Guests:
                                            </Typography>
                                        </Stack>

                                        <Stack item data-aos='fade-right' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={learning} alt="calendar" />

                                            <Typography variant="h4" color="primary">
                                                Access the process
                                            </Typography>

                                        </Stack>

                                        <Stack item data-aos='fade-left' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={map} alt="" />

                                            <Typography variant="h4" color="primary">
                                                Near you
                                            </Typography>
                                        </Stack>

                                        <Stack item data-aos='fade-right' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={Messaging} alt="" />

                                            <Typography variant="h4" color="primary">
                                                Message artists
                                            </Typography>
                                        </Stack>

                                        <Stack item data-aos='fade-left' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={reviews} alt="" />

                                            <Typography variant="h4" color="primary">
                                                Verified reviews
                                            </Typography>
                                        </Stack>

                                    </Stack>
                                </Grid>
                            </>

                        ) : (
                            <>
                                <Grid item lg={6} md={6} xs={12}>
                                    <Stack container alignItems='center' style={{ paddingBottom: '5%' }} spacing={4}>
                                        <Stack item data-aos='fade-up'>
                                            <Typography variant="h2" color="primary">
                                                Guests:
                                            </Typography>
                                        </Stack>

                                        <Stack item data-aos='fade-right' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={learning} alt="calendar" />

                                            <Typography variant="h4" color="primary">
                                                Access the process
                                            </Typography>

                                        </Stack>

                                        <Stack item data-aos='fade-left' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={map} alt="" />

                                            <Typography variant="h4" color="primary">
                                                Near you
                                            </Typography>
                                        </Stack>

                                        <Stack item data-aos='fade-right' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={Messaging} alt="" />

                                            <Typography variant="h4" color="primary">
                                                Message artists
                                            </Typography>
                                        </Stack>

                                        <Stack item data-aos='fade-left' spacing={2} direction='row' style={{ alignItems: 'flex-end' }}>

                                            <img width="50em" height="50em" src={reviews} alt="" />

                                            <Typography variant="h4" color="primary">
                                                Verified reviews
                                            </Typography>
                                        </Stack>

                                    </Stack>
                                </Grid>

                                <Grid item data-aos='fade-up' lg={6} md={6} xs={12} style={{ justifyContent: 'center', display: 'flex' }}>
                                    <video playsInline muted autoPlay id="video-bg" src={mapWalkthrough} style={{ width: 'auto', height: '80vh', maxWidth: '600px' }}></video>
                                </Grid>
                            </>
                        )
                    }
                </Grid>
            </Container>



            <div style={{ width: '100vw', height: '100vh', margin: 0, backgroundColor: '#1a1a1a', marginTop: '15%' }}>
                <footer style={{ padding: '5%' }}>
                    <Grid container>

                        <Grid item xs={6}>
                            <Typography variant='h5' style={{ color: "#000000" }}>Studio Time</Typography>
                            <List style={{ paddingTop: '25px' }}>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>About</a></ListItem>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>Features</a></ListItem>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>How it works</a></ListItem>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>Where to teach</a></ListItem>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>Contact</a></ListItem>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>What to teach</a></ListItem>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>Privacy</a></ListItem>
                                <ListItem><a style={{ textDecoration: 'none', color: 'white' }}>Terms</a></ListItem>


                            </List>
                        </Grid>

                        <Grid item xs={6} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div id="thanks" class="col-md-5 offset-md-1 mb-3">
                                <form>
                                    <Typography variant='h5' style={{ color: 'white' }}>Get in touch!</Typography>
                                    <Typography style={{ color: 'white', paddingTop: '5px' }}>Send us an email</Typography>
                                    <div>
                                        <a href="mailto:hello@studiotime.com" style={{ color: "#000000", textDecoration: 'none' }}><h5>hello@studiotime.com</h5></a>
                                    </div>
                                </form>
                            </div>
                        </Grid>

                        <Grid container xs={12} flexWrap='noWrap' textAlign='center' style={{ position: 'absolute', bottom: '20vh', alignItems: 'center', display: 'flex', justifyContent: 'center', width: '90vw' }}>

                            <LinkRouter to='https://www.instagram.com/studiotime'>
                                <ListItem className="social">
                                    <ListItemIcon>
                                        <InstagramIcon style={{ width: '50px', height: '50px', color: 'black' }} />
                                    </ListItemIcon>
                                </ListItem>
                            </LinkRouter>

                            <LinkRouter to='https://twitter.com/studiotime'>
                                <ListItem className="social">
                                    <ListItemIcon>
                                        <FacebookIcon style={{ width: '50px', height: '50px', color: 'black' }} />
                                    </ListItemIcon>
                                </ListItem>
                            </LinkRouter>

                            <LinkRouter to='https://www.facebook.com/profile.php?id=100080291769164'>
                                <ListItem className="social">
                                    <ListItemIcon>
                                        <TwitterIcon style={{ width: '50px', height: '50px', color: 'black' }} />
                                    </ListItemIcon>
                                </ListItem>
                            </LinkRouter>

                            <LinkRouter to='https://www.youtube.com/@studiotime'>
                                <ListItem className="social">
                                    <ListItemIcon>
                                        <YouTubeIcon style={{ width: '50px', height: '50px', color: 'black' }} />
                                    </ListItemIcon>
                                </ListItem>
                            </LinkRouter>

                        </Grid>


                    </Grid>
                    <Typography style={{ color: 'white', position: 'absolute', bottom: '10vh', textAlign: 'center', width: '90vw' }}>© 2026 Studio Time. All rights reserved.</Typography>

                </footer>
            </div>




        </>
    );
}

export default LandingPage;
