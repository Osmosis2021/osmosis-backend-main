import React, { useState } from 'react';
import { Box, Typography, Avatar, Stack, Button, Collapse } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link, useNavigate } from 'react-router-dom';
import { PremiumButton } from './PremiumButton';
import useStore from '../store';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

export const ArtistModule = ({ teacherInfo, userName, city }) => {
    const navigate = useNavigate();
    const { userID } = useStore();
    const axiosPrivate = useAxiosPrivate();
    const [expanded, setExpanded] = useState(false);
    const description = teacherInfo?.description || `Hi, I'm ${teacherInfo?.firstName}! Welcome to my studio.`;
    const isLong = description.length > 150;

    const handleMessage = async () => {
        if (!userID) {
            alert("Please log in to message artists.");
            navigate('/');
            return;
        }
        if (!teacherInfo?._id) {
            alert("Could not identify the artist. Please try again.");
            return;
        }
        try {
            const { data } = await axiosPrivate.get(`chat/accessChats/${teacherInfo._id}?userID=${userID}`);
            const { chats, setChats, setSelectedChat } = useStore.getState();
            if (!chats.find((c) => c._id === data._id)) {
                setChats([data, ...chats]);
            }
            setSelectedChat(data);
            navigate('/chat');
        } catch (err) {
            console.error("Error accessing chat:", err);
            navigate('/chat');
        }
    };

    return (
        <Box
            sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid #F0F0F0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar
                    src={teacherInfo?.profileImage?.url}
                    sx={{ width: 64, height: 64, border: '2px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                />
                <Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {teacherInfo?.firstName} {teacherInfo?.lastName}
                        </Typography>
                        {teacherInfo?.stripeID && <VerifiedIcon color="primary" sx={{ fontSize: 18 }} />}
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                        <LocationOnIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {city || 'Local Artist'}
                        </Typography>
                    </Stack>
                </Box>
            </Stack>

            <Box sx={{ mb: 3 }}>
                <Collapse in={expanded} collapsedSize={60}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {description}
                    </Typography>
                </Collapse>
                {isLong && (
                    <Button
                        onClick={() => setExpanded(!expanded)}
                        sx={{ p: 0, mt: 0.5, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                        {expanded ? 'Show less' : 'Read more'}
                    </Button>
                )}
            </Box>

            <Stack direction="row" spacing={2}>
                <PremiumButton
                    sx={{ borderRadius: '12px' }}
                    component={Link}
                    to={`/teachers/${userName}`}
                    variant="outlined"
                    fullWidth
                    size="small"
                >
                    View Profile
                </PremiumButton>
                <PremiumButton
                    sx={{ borderRadius: '12px' }}
                    variant="contained"
                    fullWidth
                    size="small"
                    onClick={handleMessage}
                >
                    Message
                </PremiumButton>
            </Stack>
        </Box>
    );
};
