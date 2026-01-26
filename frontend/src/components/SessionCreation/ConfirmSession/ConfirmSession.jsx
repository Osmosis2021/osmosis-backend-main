import {
    CircularProgress,
    Container,
    Grid,
    IconButton,
    Typography,
    Box,
    Stack,
    Button,
    Divider,
    Fade
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import SessionCard from '../../SessionCard/SessionCard'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useStore from '../../../store';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import TERMS from '../../../constants/terms';
import CompletenessChecklist from '../CompletenessChecklist/CompletenessChecklist';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';
import { PremiumCard } from '../../../ui/PremiumCard';

export const ConfirmSession = (props) => {
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
        studioVibe, setStudioVibe,
        whatToBring, setWhatToBring,
        newCourseLatitude, setNewCourseLatitude,
        newCourseLongitude, setNewCourseLongitude,
        newCourseTimeslots, setNewCourseTimeslots,
    } = useStore();

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState();
    const [newCourseID, setNewCourseID] = useState('');

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
                studioVibe: studioVibe,
                whatToBring: whatToBring,
            }

            const { data } = await axios.post(backendURL + 'course/registerCourse', courseInfo)
            setIsLoading(false);

            if (data.success === true && data.course?._id) {
                setNewCourseID(data.course._id);
                setIsSuccess(true);
                if (props.setHideFooter) props.setHideFooter(true);

                // Reset store
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
                setStudioVibe('')
                setWhatToBring('')
                setNewCourseLatitude(-73.9569994)
                setNewCourseLongitude(40.7297027)
                setNewCourseTimeslots([])
            }
        } catch (error) {
            console.log(error)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetch(`${backendURL}user/getUserInfo/${userName}`)
            .then((res) => res.json())
            .then((data) => {
                setTeacherInfo(data)
            }).catch((err) => {
                console.log('Error getting teacher info:\n', err)
            });
    }, [])

    const handleCopyLink = () => {
        const url = `${window.location.origin}/teachers/${userName}/${newCourseID}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/teachers/${userName}/${newCourseID}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: courseTitle,
                    text: `Check out my new Studio Time: ${courseTitle}`,
                    url: url,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    if (isSuccess) {
        return (
            <Fade in={true} timeout={800}>
                <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                    <Box sx={{ mb: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                            Your Studio Time is live!
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Congratulations! Your experience is now discoverable by the community.
                        </Typography>
                    </Box>

                    <Stack spacing={2} sx={{ mb: 6 }}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<VisibilityIcon />}
                            component={Link}
                            to={`/teachers/${userName}/${newCourseID}`}
                            disabled={!newCourseID}
                            sx={{ py: 2, fontWeight: 700, borderRadius: 3, opacity: newCourseID ? 1 : 0.6 }}
                        >
                            {newCourseID ? 'View Your Listing' : 'Finalizing Listing...'}
                        </Button>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<ContentCopyIcon />}
                                onClick={handleCopyLink}
                                disabled={!newCourseID}
                                sx={{ py: 1.5, fontWeight: 700, borderRadius: 3 }}
                            >
                                Copy Link
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<ShareIcon />}
                                onClick={handleShare}
                                disabled={!newCourseID}
                                sx={{ py: 1.5, fontWeight: 700, borderRadius: 3 }}
                            >
                                Share
                            </Button>
                        </Stack>
                    </Stack>

                    <PremiumCard sx={{ textAlign: 'left', p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                            Next Steps
                        </Typography>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                                <Typography variant="body2">
                                    Add more availability to your calendar to get more bookings.
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                                <Typography variant="body2">
                                    Share your link on Instagram or Twitter to reach your audience.
                                </Typography>
                            </Box>
                        </Stack>
                        <Button
                            component={Link}
                            to={`/teachers/${userName}`}
                            sx={{ mt: 3, fontWeight: 700, textTransform: 'none' }}
                        >
                            Back to Dashboard
                        </Button>
                    </PremiumCard>
                </Container>
            </Fade>
        );
    }

    return (
        <Container maxWidth='md' sx={{ py: 4 }}>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <PremiumSectionHeader
                        title="Review & Go Live"
                        subtitle="One last look before your studio doors open."
                        align="center"
                    />
                </Grid>

                <Grid item xs={12} md={7}>
                    <Stack spacing={4}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Completeness Checklist
                            </Typography>
                            <CompletenessChecklist setActiveStep={props.setActiveStep} />
                        </Box>

                        <PremiumCard sx={{ p: 3, bgcolor: 'rgba(0,174,239,0.02)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Host Agreement
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                By going live, you agree to host this experience as described and follow the Studio Time community guidelines.
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleCourseRegistration}
                                disabled={(!Boolean(userName) || !Boolean(isTeacher)) || isLoading}
                                sx={{
                                    py: 2,
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    borderRadius: 3,
                                    boxShadow: '0 8px 24px rgba(0,174,239,0.25)'
                                }}
                            >
                                {isLoading ? <CircularProgress size={24} sx={{ color: 'primary.main' }} /> : 'Go Live Today'}
                            </Button>
                            {!isTeacher && (
                                <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                                    You must be registered as a host to go live.
                                </Typography>
                            )}
                        </PremiumCard>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                        Preview
                    </Typography>
                    <Box sx={{ position: 'sticky', top: 100 }}>
                        <SessionCard
                            images={images[0]?.url || images[0]}
                            profileImage={teacherInfo?.profileImage?.url}
                            industry={newCourseIndustry}
                            tags={tags}
                            courseTitle={courseTitle || 'Your Experience Title'}
                            icon={newCourseIndustry}
                            price={newCourseCost || 0}
                            firstName={userName}
                            capacity={capacity}
                            address={newCourseAddressLine1}
                            city={newCourseAddressCity}
                            zipCode={newCourseAddressZipcode}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                            This is how your experience will appear in search.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}

