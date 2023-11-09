import React, { useEffect, useState } from 'react';
import { Button, Box, Container, Drawer, Grid, Paper, styled, Typography, IconButton }  from '@mui/material/';
import CloseIcon from '@mui/icons-material/Close';

export const timeConverter = (rawTime) => {
    const array = rawTime?.split(':');
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
        const [schedule, setSchedule] = useState(props.schedule)

        const fetchSchedule = () => {
            const today = new Date()
            today.setDate(today.getDate() - 1) // subtract 1 day to provide buffer for hour differences
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

        const selectionHandler = (startDate, startTime, timeslotID, enrolledStudents, enrollment, capacity) => {
            if(enrollment >= capacity) {
                return
            }
            props.setSelectedDateAndTime({startDate, startTime})
            props.setSelectedTimeslotID(timeslotID)
            props.setSelectedEnrolledStudents(enrolledStudents)
            props.setSelectedEnrollment(enrollment)
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
                        <Grid container spacing={2} justifyContent='space-around' style={{marginBottom:'56px'}}>
                        {isScheduleLoading ? <></> : schedule.map((availability) => {
                            return (
                                <Grid item xs={4} style={{cursor:'pointer'}}
                                    onClick={() => {selectionHandler(availability.startDate, availability.startTime, availability._id,
                                        availability.enrolledStudents, availability.enrollment, availability.capacity)}}
                                >
                                    <Item style={(availability.enrollment >= availability.capacity) ? {opacity: .5} : {}}>
                                        {/* <Typography variant='h4'>{availability.dayOfWeek}</Typography> */}
                                        {/* <br/> */}
                                        {(availability.enrollment >= availability.capacity) &&
                                        <Typography variant='h4' style={{color: 'red'}}>Full</Typography>
                                        }
                                        {/* <br/> */}
                                        <Typography variant='h4'>{availability.dayOfWeek.split('', 3)}</Typography>
                                        <Typography variant='h4'>{availability.startDate.substr(5).split('', 5)}</Typography>
                                        {/* <Typography variant='h3'>{availability.courseLength}</Typography> */}
                                        {/* <br/> */}
                                        {/* <Typography variant='h6'>{availability.startTime}</Typography> */}
                                        <Typography variant='h6'>{timeConverter(availability.startTime)}</Typography>
                                    </Item>
                                </Grid>
                            )
                        })}
                        </Grid>
                    </Container>
                </Box>
            </Drawer>
        </>
    )
}
