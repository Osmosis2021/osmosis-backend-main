import React from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import useStore from '../../../store';
import { PremiumCard } from '../../../ui/PremiumCard';

import { useNavigate } from 'react-router-dom';

export default function CompletenessChecklist({ setActiveStep }) {
    const navigate = useNavigate();
    const {
        description, // Host bio
        images,
        studioVibe,
        newCourseTimeslots,
        courseTitle,
        courseDescription
    } = useStore();

    const handleFix = (item) => {
        if (item.label === 'Host Bio') {
            navigate('/edit');
        } else if (item.label === '3+ Photos') {
            setActiveStep(7);
        } else if (item.label === 'Studio Vibe') {
            setActiveStep(2); // SessionTag contains Vibe input
        } else if (item.label === 'Experience Details') {
            setActiveStep(2); // SessionTag contains Title/Description input
        } else if (item.label === 'Availability Set') {
            setActiveStep(4);
        }
    };

    const checklist = [
        { label: 'Host Bio', complete: Boolean(description), tip: 'Tell guests about your journey.' },
        { label: '3+ Photos', complete: images.length >= 3, tip: 'Show off your studio space.' },
        { label: 'Studio Vibe', complete: Boolean(studioVibe), tip: 'Describe the atmosphere.' },
        { label: 'Experience Details', complete: Boolean(courseTitle) && Boolean(courseDescription), tip: 'Clear titles attract more guests.' },
        { label: 'Availability Set', complete: newCourseTimeslots.length > 0, tip: 'Open your doors for bookings.' },
    ];

    const completedCount = checklist.filter(item => item.complete).length;
    const percentage = (completedCount / checklist.length) * 100;

    return (
        <PremiumCard sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Listing Strength
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {Math.round(percentage)}% Complete
                </Typography>
            </Stack>

            <Box sx={{ mb: 4 }}>
                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0,174,239,0.1)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                        }
                    }}
                />
            </Box>

            <List spacing={1}>
                {checklist.map((item, index) => (
                    <ListItem
                        key={index}
                        sx={{
                            px: 0,
                            py: 1.5,
                            borderBottom: index === checklist.length - 1 ? 'none' : '1px solid #F0F0F0'
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            {item.complete ? (
                                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                            ) : (
                                <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
                            )}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            secondary={!item.complete ? item.tip : null}
                            primaryTypographyProps={{
                                variant: 'body1',
                                fontWeight: item.complete ? 600 : 500,
                                color: item.complete ? 'text.primary' : 'text.secondary'
                            }}
                            secondaryTypographyProps={{
                                variant: 'caption',
                                color: 'primary.main',
                                fontWeight: 600
                            }}
                        />
                        {!item.complete && (
                            <Button
                                size="small"
                                sx={{ fontWeight: 700, textTransform: 'none' }}
                                onClick={() => handleFix(item)}
                            >
                                Fix
                            </Button>
                        )}
                    </ListItem>
                ))}
            </List>

            {percentage < 100 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,174,239,0.05)', borderRadius: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block' }}>
                        💡 Pro Tip: Complete profiles get 3x more bookings!
                    </Typography>
                </Box>
            )}
        </PremiumCard>
    );
}

