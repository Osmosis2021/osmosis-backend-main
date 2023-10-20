import { Container, Grid, IconButton, Typography } from '@mui/material'
import React, {useEffect, useState} from 'react'
import SessionCard from '../../SessionCard/SessionCard'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useStore from '../../../store';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


export const ConfirmSession = () => {

    const {
        backendURL,
        newCourseIndustry, setNewCourseIndustry,
        tags, setTags,
        images, setImages,
        capacity, setCapacity,
        newCourseDuration, setNewCourseDuration,
        newCourseCost, setNewCourseCost,
        userID,
        userName,
        isTeacher,
        newCourseAddressLine1, setNewCourseAddressLine1,
        newCourseAddressLine2, setNewCourseAddressLine2,
        newCourseAddressZipcode, setNewCourseAddressZipcode,
        newCourseAddressCity, setNewCourseAddressCity,
        newCourseAddressState, setNewCourseAddressState,
        newCourseAddressCountry, setNewCourseAddressCountry,
        courseTitle, setCourseTitle,
        courseDescription, setCourseDescription,
        newCourseLatitude, setNewCourseLatitude,
        newCourseLongitude, setNewCourseLongitude,
        newCourseTimeslots, setNewCourseTimeslots,
    } = useStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState();
    const [teacherInfo, setTeacherInfo] = useState();

    const handleCourseRegistration = async (e) => {
		e.preventDefault();
        setIsLoading(true)
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
                schedule: newCourseTimeslots,
                courseDescription: courseDescription,
            }

            const {data} = await axios.post(backendURL + 'course/registerCourse', courseInfo)
            setIsLoading(false);
            console.log('finished submitting course registration. resp:', data);
            // alert('Course succesfully created!')
            if  (data.success === true) {
                setNewCourseIndustry('')
                setTags([])
                setImages([])
                setCapacity(1)
                setNewCourseDuration(60)
                setNewCourseCost('')
                setNewCourseAddressLine1('')
                setNewCourseAddressLine2('')
                setNewCourseAddressZipcode('')
                setNewCourseAddressCity('')
                setNewCourseAddressState('')
                setNewCourseAddressCountry('')
                setCourseTitle('')
                setCourseDescription('')
                setNewCourseLatitude(-73.9569994)
                setNewCourseLongitude(40.7297027)
                setNewCourseTimeslots([])
            }
            navigate(`/teachers/${userName}`)
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
        fetch (`${backendURL}user/getUserInfo/${userName}`)
            .then((res) => {
                return res.json();
            }).then((data) => {
                setTeacherInfo(data)
                console.log(data)
            }).catch((err) => {
                console.log('Error getting teacher info:\n', err)
            });
    }, [])


  return (
        <Container maxWidth='sm' align='center'>
            <Grid container spacing={2} justifyContent='center' alignItems='center'>

                <Grid item xs={12}>
                    <Typography mt={8} variant='h4'>Confirm your information</Typography>
                </Grid>

                <Grid item xs={12}>
                    <SessionCard
                        images={images[0]}
                        profileImage={teacherInfo?.profileImage?.url}
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
                    <IconButton type='submit' onClick={handleCourseRegistration} variant='contained' size='large'
                        disabled={(!Boolean(userName) || !Boolean(isTeacher)) || Boolean(isLoading)}>
                        <CheckCircleIcon sx={{fontSize:'150px', color:'#00aeef'}}>
                        </CheckCircleIcon> 
                    </IconButton>
                       
                    <Typography variant='h3' color='#00aeef'>
                        { isLoading ?  'Pending' : 
                          !Boolean(userName) ? 'Please sign in to add a course' :
                          !Boolean(isTeacher) ? "You're not signed up as a teacher" :
                          'Go Live Today' }
                    </Typography>
                        
                </Grid>
                
            </Grid>
        </Container>
    )
}
