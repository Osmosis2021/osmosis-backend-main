import { Container, Grid, IconButton, Typography } from '@mui/material'
import React, {useState} from 'react'
import SessionCard from '../../SessionCard/SessionCard'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useStore from '../../../store';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const backendURL = 'http://localhost:8126/';

export const ConfirmSession = () => {

    const { newCourseIndustry, tags, images, profileImage, capacity, newCourseDuration, newCourseCost, classDays, userID, userName, newCourseAddressLine1, newCourseAddressLine2, newCourseAddressZipcode, newCourseAddressCity, newCourseAddressState, newCourseAddressCountry, courseTitle, newCourseLatitude, newCourseLongitude, newCourseTimeslots } = useStore();
    const navigate = useNavigate();

    const handleCourseRegistration = async (e) => {
		e.preventDefault();

		try {
            const courseInfo = {
                teacherID: userID,
                userName,
                address: {
                    line1: newCourseAddressLine1,
                    line2: newCourseAddressLine2,
                    city: newCourseAddressCity,
                    zipCode: newCourseAddressZipcode,
                    state: newCourseAddressState,
                    country: newCourseAddressCountry
                },
                longitude: newCourseLongitude,
                latitude: newCourseLatitude,
                industry: newCourseIndustry, 
                tags,
                pricePerStudent: newCourseCost, 
                courseTitle,
                capacity: capacity,
                duration: newCourseDuration,
                images, 
                schedule: newCourseTimeslots
            }

            const {data} = await axios.post('http://localhost:8126/course/registerCourse', courseInfo)
            
            if  (data.success === true) {

            }
            console.log(data);
            // alert('Course succesfully created!')
            navigate(`/teachers/${userName}`)
        } catch (error) {
            console.log(error)
        }
    }


  return (
        <Container maxWidth='sm' align='center'>
            <Grid container spacing={8} justifyContent='center' alignItems='center'>

                <Grid item xs={12}>
                    <Typography mt={8} variant='h6' fontSize={21}>Confirm your information</Typography>
                </Grid>

                <Grid item xs={12}>
                    <SessionCard
                        images={images[0]}
                        industry={newCourseIndustry}
                        tags={tags}
                        courseTitle={courseTitle}
                        icon={newCourseIndustry}
                        price={newCourseCost}
                        firstName={userName}
                        capacity={capacity}
                        address={newCourseAddressLine1}
                        city={newCourseAddressCity}
                        zipCode={newCourseAddressZipcode}
                    />
                </Grid>

                <Grid item xs={12}>
                    <IconButton type='submit' onClick={handleCourseRegistration} variant='contained' size='large'>
                    <CheckCircleIcon sx={{fontSize:'150px', color:'#00aeef'}}>
                    </CheckCircleIcon> 
                    </IconButton>
                    <Typography variant='h3' color='#00aeef'>Go Live Today</Typography>
                </Grid>
                
            </Grid>
        </Container>
    )
}
