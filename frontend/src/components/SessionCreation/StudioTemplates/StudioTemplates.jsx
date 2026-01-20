import React from 'react';
import { Box, Grid, Typography, Stack, Button, useTheme } from '@mui/material';
import useStore from '../../../store';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PanToolIcon from '@mui/icons-material/PanTool';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { PremiumCard } from '../../../ui/PremiumCard';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';

const templates = [
    {
        id: 'walkthrough',
        title: 'Studio Walkthrough',
        description: 'Observe the creative process in action.',
        bestFor: 'Best for: New hosts who want a low-pressure start.',
        icon: <VisibilityIcon sx={{ fontSize: 32 }} />,
        prefill: {
            courseTitle: 'Studio Walkthrough: [Your Craft]',
            courseDescription: 'Join me for a behind-the-scenes look at my creative process. You will observe how I start a project, the tools I use, and how I handle common challenges. Perfect for those curious about the day-to-day life of an artist.',
            studioVibe: 'Quiet, focused, and filled with the smell of fresh materials. A true working environment.',
            newCourseDuration: 60,
            capacity: 5,
            whatToBring: 'Notebook and curiosity. No materials needed.',
        }
    },
    {
        id: 'demo',
        title: 'Live Demo + Q&A',
        description: 'Watch a specific technique and ask anything.',
        bestFor: 'Best for: Experts who love to teach and share knowledge.',
        icon: <PlayCircleOutlineIcon sx={{ fontSize: 32 }} />,
        prefill: {
            courseTitle: 'Live Demo: Mastering [Specific Technique]',
            courseDescription: 'I will demonstrate my unique approach to [Technique]. I will break down the steps, explain my decision-making, and answer your questions in real-time as I work.',
            studioVibe: 'Interactive and educational. Plenty of space to get a close look at the work.',
            newCourseDuration: 90,
            capacity: 8,
            whatToBring: 'Questions and a camera for photos.',
        }
    },
    {
        id: 'mini-session',
        title: 'Hands-on Mini Session',
        description: 'A quick, guided session to create something small.',
        bestFor: 'Best for: Interactive experiences and making memories.',
        icon: <PanToolIcon sx={{ fontSize: 32 }} />,
        prefill: {
            courseTitle: 'Mini Session: Create Your Own [Small Project]',
            courseDescription: 'Get your hands dirty! In this short session, I will guide you through creating a small [Project] from start to finish. You will leave with a piece of your own making.',
            studioVibe: 'High energy, collaborative, and creative. Expect some mess!',
            newCourseDuration: 120,
            capacity: 4,
            whatToBring: 'Clothes you don\'t mind getting dirty. All materials provided.',
        }
    },
    {
        id: 'critique',
        title: 'Portfolio Review',
        description: 'Professional feedback on your own work.',
        bestFor: 'Best for: Mentors and professional artists.',
        icon: <RateReviewIcon sx={{ fontSize: 32 }} />,
        prefill: {
            courseTitle: 'Professional Critique & Portfolio Review',
            courseDescription: 'Bring 3-5 pieces of your work for a deep dive. I will provide constructive feedback on technique, composition, and professional presentation to help you level up.',
            studioVibe: 'Professional, supportive, and analytical. A safe space for growth.',
            newCourseDuration: 45,
            capacity: 1,
            whatToBring: '3-5 pieces of your work (physical or digital).',
        }
    }
];

export default function StudioTemplates(props) {
    const theme = useTheme();
    const {
        setCourseTitle,
        setCourseDescription,
        setStudioVibe,
        setNewCourseDuration,
        setCapacity,
        setWhatToBring
    } = useStore();

    const handleSelectTemplate = (template) => {
        const { prefill } = template;
        setCourseTitle(prefill.courseTitle);
        setCourseDescription(prefill.courseDescription);
        setStudioVibe(prefill.studioVibe);
        setNewCourseDuration(prefill.newCourseDuration);
        setCapacity(prefill.capacity);
        setWhatToBring(prefill.whatToBring);
        props.handleNext();
    };

    return (
        <Box sx={{ py: 4 }}>
            <PremiumSectionHeader
                title="Choose a Template"
                subtitle="Start with a pre-filled experience and customize it later."
                align="center"
            />

            <Grid container spacing={3} sx={{ mt: 2 }}>
                {templates.map((template) => (
                    <Grid item xs={12} sm={6} key={template.id}>
                        <PremiumCard
                            onClick={() => handleSelectTemplate(template)}
                            sx={{ cursor: 'pointer', height: '100%' }}
                        >
                            <Stack spacing={2} sx={{ p: 1 }}>
                                <Box sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 3,
                                    bgcolor: 'rgba(0,174,239,0.1)',
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {template.icon}
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                                        {template.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                                        {template.description}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        fontWeight: 700,
                                        color: 'primary.main',
                                        bgcolor: 'rgba(0,174,239,0.05)',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 2
                                    }}>
                                        {template.bestFor}
                                    </Typography>
                                </Box>
                            </Stack>
                        </PremiumCard>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 6, textAlign: 'center' }}>
                <Button
                    variant="text"
                    onClick={props.handleNext}
                    sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                    }}
                >
                    Or start from scratch with a blank canvas
                </Button>
            </Box>
        </Box>
    );
}

