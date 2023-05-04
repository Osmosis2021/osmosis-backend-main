import React, { useEffect, useState } from 'react';
import { Button, Box, Container, Drawer, Grid, Paper, styled, Typography, IconButton }  from '@mui/material/';
import CloseIcon from '@mui/icons-material/Close';

export const timeConverter = (rawTime) => {
    const array = rawTime.split(':');
    const parsedInput = parseInt(array[0])
    const suffix = parsedInput >= 12 ? "PM" : "AM"; 
    const newTime = ((parsedInput + 11) % 12 + 1);
    return(newTime + ':' + array[1] + suffix);
}

export default function DateDrawer(props) {
        const Item = styled(Paper)(({ theme }) => ({
            backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#00aeef',
            ...theme.typography.heading1,
            padding: theme.spacing(1),
            textAlign: 'center',
            color: 'white',
        }));

        const [isDrawerOpen, setIsDrawerOpen] = useState(false)
        const [isScheduleLoading, setIsScheduleLoading] = useState(true)
        const [schedule, setSchedule] = useState([])

        const fetchSchedule = (recurssionDepth=0) => {
            const temp = new Date()
            const today = new Date(temp.toDateString())
            const presentAndFutureCourses = props?.schedule.filter((_course) => {
                const courseDate = new Date(_course.startDate)
                return courseDate >= today
            })
            presentAndFutureCourses.sort((a, b) => {
                const dateA = new Date(a.startDate.split('T')[0] + 'T' + a.startTime)
                const dateB = new Date(b.startDate.split('T')[0] + 'T' + b.startTime)
                return dateA - dateB
            })
            setSchedule(presentAndFutureCourses)
            setIsScheduleLoading(false)
        }

        useEffect(() => {
            fetchSchedule()
        }, [])
        
        const openSchedule = async () => {
            setIsDrawerOpen(true)
        }

        const selectionHandler = (startDate, startTime, timeslotID) => {
            props.setSelectedDateAndTime({startDate, startTime})
            props.setSelectedTimeslotID(timeslotID)
            setIsDrawerOpen(false)
        }

        function timeConverter (rawTime) {
            const array = rawTime.split(':');
            const parsedInput = parseInt(array[0])
            const suffix = parsedInput >= 12 ? "PM" : "AM"; 
            const newTime = ((parsedInput + 11) % 12 + 1);
            return(newTime + ':' + array[1] + suffix);
        }
        
        return (
        <>
            <Button variant='contained' onClick={openSchedule} style={{color:'white'}}>
                Availability
            </Button>

            <Drawer anchor='bottom' open={isDrawerOpen} onClose={()=> setIsDrawerOpen(false)}>
            <div style={{width:'100%', display:'flex', justifyContent:'right', paddingRight:'16px'}}>
                <IconButton
                    style={{width:'30px'}}
                    edge="end"
                    variant='contained'
                    onClick={()=>setIsDrawerOpen(false)}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
              </div>
                <Box p={2} textAlign='center' role='presentation'>
                    <Container>
                        <Grid container spacing={2} justifyContent='space-around'>
                        {isScheduleLoading ? <></> : schedule.map((availability) => {
                            return (
                                <>
                                <Grid item xs={4} 
                                    onClick={() => {selectionHandler(availability.startDate, availability.startTime, availability._id)}}
                                >
                                    <Item>
                                        {/* <Typography variant='h4'>{availability.dayOfWeek}</Typography> */}
                                        {/* <br/> */}
                                        {/* <Typography variant='h4'>{availability.startDate.split('', 4)}</Typography> */}
                                        {/* <br/> */}
                                        <Typography variant='h4'>{availability.dayOfWeek.split('', 3)}</Typography>
                                        <Typography variant='h4'>{availability.startDate.substr(5).split('', 5)}</Typography>
                                        {/* <Typography variant='h3'>{availability.courseLength}</Typography> */}
                                        {/* <br/> */}
                                        {/* <Typography variant='h6'>{availability.startTime}</Typography> */}
                                        <Typography variant='h6'>{timeConverter(availability.startTime)}</Typography>
                                    </Item>
                                </Grid>
                                </>
        
                            )
                        })}
                        </Grid>
                    </Container>
                </Box>
            </Drawer>
        </>
    )
}
