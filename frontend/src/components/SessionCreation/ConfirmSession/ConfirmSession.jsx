import {
    Alert,
    CircularProgress,
    Container,
    Grid,
    Typography,
    Box,
    Stack,
    Button,
    Fade,
    Backdrop
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import SessionCard from '../../SessionCard/SessionCard'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useStore from '../../../store';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import { useToast } from '../../../ui/feedback';
import { browserTimeZone } from '../../../utils/sessionTime';
import { Link } from 'react-router-dom';
import CompletenessChecklist from '../CompletenessChecklist/CompletenessChecklist';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';
import { PremiumCard } from '../../../ui/PremiumCard';
import Mascot from '../../../ui/Mascot';
import Confetti from '../../../ui/Confetti';

// Shown in turn while the studio time is being published (photos are the slow part).
const PUBLISH_STEPS = ['Uploading your photos…', 'Setting up your sessions…', 'Putting your studio on the map…', 'Almost there…'];

export const ConfirmSession = (props) => {
    const {
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

    const axiosPrivate = useAxiosPrivate();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState();
    const [newCourseID, setNewCourseID] = useState('');
    const [publishedTitle, setPublishedTitle] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [publishStep, setPublishStep] = useState(0);
    const [publishedCard, setPublishedCard] = useState(null);

    // Move through the publishing messages while we wait (stays on the last one).
    useEffect(() => {
        if (!isLoading) return undefined;
        setPublishStep(0);
        const timer = setInterval(() => setPublishStep((step) => Math.min(step + 1, PUBLISH_STEPS.length - 1)), 3500);
        return () => clearInterval(timer);
    }, [isLoading]);

    const handleCourseRegistration = async (e) => {
        e.preventDefault();
        setIsLoading(true)
        setSubmitError('')
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
                pricePerStudent: Number(newCourseCost),
                courseTitle,
                capacity: capacity,
                duration: newCourseDuration,
                images,
                sessions: newCourseTimeslots
                    .filter(slot => slot?.date && slot?.startTime)
                    .map(({ date, startTime }) => ({ date, startTime })),
                timezone: browserTimeZone(),
                courseDescription: courseDescription,
                studioVibe: studioVibe,
                whatToBring: whatToBring,
            }

            const { data } = await axiosPrivate.post('course/registerCourse', courseInfo)
            setIsLoading(false);

            if (data.success === true && data.course?._id) {
                setNewCourseID(data.course._id);
                setPublishedTitle(courseTitle);
                // Keep what the card looked like (the form is cleared below) to show it on the success screen.
                setPublishedCard({
                    images: data.course.images?.[0]?.url || images[0]?.url || images[0],
                    industry: newCourseIndustry,
                    tags,
                    courseTitle,
                    price: newCourseCost || 0,
                    capacity,
                    duration: newCourseDuration,
                    city: newCourseAddressCity,
                });
                setIsSuccess(true);
                if (props.setHideFooter) props.setHideFooter(true);
                window.scrollTo({ top: 0 }); // start the celebration at the top

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
                setNewCourseLatitude(40.7297027)
                setNewCourseLongitude(-73.9569994)
                setNewCourseTimeslots([])
            }
        } catch (error) {
            console.log(error)
            setIsLoading(false)
            const message = error.response?.data?.message || "We couldn't publish your studio time. Please check your connection and try again.";
            setSubmitError(message)
            toast.error(message)
        }
    }

    useEffect(() => {
        const { backendURL, userName } = useStore.getState();
        fetch(`${backendURL}user/getUserInfo/${userName}`)
            .then((res) => res.json())
            .then((data) => {
                setTeacherInfo(data)
            }).catch((err) => {
                console.log('Error getting teacher info:\n', err)
            });
    }, [])

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/teachers/${userName}/${newCourseID}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied. Paste it in your bio or stories!');
        } catch (err) {
            // Some in-app browsers block clipboard access; show the link so it can be copied by hand.
            toast.info(url, { duration: 10000 });
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/teachers/${userName}/${newCourseID}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: publishedTitle,
                    text: `Check out my new Studio Time: ${publishedTitle}`,
                    url: url,
                });
            } catch (err) {
                // Closing the share sheet is not an error.
                if (err?.name !== 'AbortError') handleCopyLink();
            }
        } else {
            handleCopyLink();
        }
    };

    if (isSuccess) {
        const hostFirstName = teacherInfo?.firstName || userName;
        return (
            <Fade in={true} timeout={600}>
                <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 }, textAlign: 'center' }}>
                    <Confetti />
                    <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Mascot size={120} motion="hop" title="The Studio Time cube, celebrating" />
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 900, mt: 2, mb: 1, fontSize: { xs: '2rem', md: '2.6rem' } }}>
                            You're live!
                        </Typography>
                        <Typography variant="h6" component="p" color="text.secondary" sx={{ fontWeight: 500, maxWidth: 420 }}>
                            Your studio doors are open. Share the link with your followers so they can book.
                        </Typography>
                    </Box>

                    {publishedCard && (
                        <Box sx={{ maxWidth: 360, mx: 'auto', mb: 4, textAlign: 'left' }}>
                            <SessionCard
                                {...publishedCard}
                                icon={publishedCard.industry}
                                firstName={teacherInfo?.firstName || userName}
                                lastName={teacherInfo?.lastName}
                                profileImage={teacherInfo?.profileImage?.url}
                            />
                        </Box>
                    )}

                    <Stack spacing={2} sx={{ mb: 5 }}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<ShareIcon />}
                            onClick={handleShare}
                            disabled={!newCourseID}
                            sx={{ py: 2, fontWeight: 800, borderRadius: 3, textTransform: 'none', fontSize: '1.05rem' }}
                        >
                            Share your studio time
                        </Button>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<ContentCopyIcon />}
                                onClick={handleCopyLink}
                                disabled={!newCourseID}
                                sx={{ py: 1.5, fontWeight: 700, borderRadius: 3, textTransform: 'none' }}
                            >
                                Copy link
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<VisibilityIcon />}
                                component={Link}
                                to={`/teachers/${userName}/${newCourseID}`}
                                disabled={!newCourseID}
                                sx={{ py: 1.5, fontWeight: 700, borderRadius: 3, textTransform: 'none' }}
                            >
                                View listing
                            </Button>
                        </Stack>
                    </Stack>

                    <PremiumCard nohover sx={{ textAlign: 'left', p: 3 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
                            What's next, {hostFirstName}?
                        </Typography>
                        <Stack spacing={1.5} component="ol" sx={{ pl: 2.5, m: 0 }}>
                            <Typography component="li" variant="body2">Post the link in your Instagram bio or stories. Shared links show your photo and price.</Typography>
                            <Typography component="li" variant="body2">Add more dates from your profile so more people can find a time that works.</Typography>
                            <Typography component="li" variant="body2">You'll get an email the moment someone books.</Typography>
                        </Stack>
                        <Button
                            component={Link}
                            to={`/teachers/${userName}`}
                            sx={{ mt: 2.5, fontWeight: 700, textTransform: 'none', px: 0 }}
                        >
                            Go to my profile
                        </Button>
                    </PremiumCard>
                </Container>
            </Fade>
        );
    }

    return (
        <Container maxWidth='md' sx={{ py: 4 }}>
            {/* While publishing: the cube keeps people company so the wait doesn't feel stuck. */}
            <Backdrop open={isLoading} sx={{ zIndex: 200000, bgcolor: 'rgba(255,255,255,0.94)', flexDirection: 'column', px: 3, textAlign: 'center' }}>
                <Mascot size={96} motion="hop" />
                <Typography variant="h5" component="p" sx={{ fontWeight: 800, mt: 3, color: 'text.primary' }} role="status" aria-live="polite">
                    {PUBLISH_STEPS[publishStep]}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 360 }}>
                    Publishing can take up to a minute. Please keep this page open.
                </Typography>
            </Backdrop>
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

                        <PremiumCard sx={{ p: 3, bgcolor: 'rgba(10, 10, 10, 0.01)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Host Agreement
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                By going live, you agree to host this studio time as described and follow the Studio Time community guidelines.
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
                                    boxShadow: '0 8px 24px rgba(10, 10, 10, 0.125)'
                                }}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" aria-label="Publishing" /> : 'Go live today'}
                            </Button>
                            {submitError && (
                                <Alert severity="error" role="alert" sx={{ mt: 2, borderRadius: '12px' }}>{submitError}</Alert>
                            )}
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
                            courseTitle={courseTitle || 'Your studio time title'}
                            icon={newCourseIndustry}
                            price={newCourseCost || 0}
                            firstName={teacherInfo?.firstName || userName}
                            lastName={teacherInfo?.lastName}
                            capacity={capacity}
                            address={newCourseAddressLine1}
                            city={newCourseAddressCity}
                            zipCode={newCourseAddressZipcode}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                            This is how your studio time will appear on Explore.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}

