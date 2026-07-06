import React, { useEffect, useCallback } from 'react'
import useStore from '../../store';
import { styled } from '@mui/material/styles';
import { Badge, Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Divider } from '@mui/material';
import SideDrawer from './SearchUsers';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { PremiumCard } from '../../ui/PremiumCard';

const MyChats = () => {
    const axiosPrivate = useAxiosPrivate()
    const { backendURL, selectedChat, setSelectedChat, chats, setChats, userID, notification } = useStore();

    const fetchChats = useCallback(async (userID) => {
        try {
            const { data } = await axiosPrivate.get(`${backendURL}chat/fetchChats/${userID}`)
            setChats(data)
        } catch (err) {
            console.error('Error while accessing chat:', err.message);
        }
    }, [axiosPrivate, backendURL, setChats]);

    const getSender = (userID, users) => {
        const sender = users[0]._id === userID ? users[1] : users[0];
        return sender;
    }

    useEffect(() => {
        fetchChats(userID);
    }, [userID, fetchChats])

    const hasNotification = (chatId) => {
        return notification.some(n => n.chat._id === chatId);
    };

    const StyledBadge = styled(Badge)(({ theme }) => ({
        '& .MuiBadge-badge': {
            backgroundColor: '#000000',
            color: '#000000',
            boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
            '&::after': {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                animation: 'ripple 1.2s infinite ease-in-out',
                border: '1px solid currentColor',
                content: '""',
            },
        },
        '@keyframes ripple': {
            '0%': { transform: 'scale(.8)', opacity: 1 },
            '100%': { transform: 'scale(2.4)', opacity: 0 },
        },
    }));

    return (
        <PremiumCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0, bgcolor: 'white' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F0F0F0' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Messages</Typography>
                <SideDrawer />
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <List sx={{ p: 0 }}>
                    {chats?.map((chat, index) => {
                        const sender = getSender(userID, chat.users);
                        const isSelected = selectedChat?._id === chat._id;
                        const chatHasNotification = hasNotification(chat._id);

                        return (
                            <React.Fragment key={chat._id}>
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => setSelectedChat(chat)}
                                        selected={isSelected}
                                        sx={{
                                            py: 2,
                                            px: 2,
                                            '&.Mui-selected': {
                                                bgcolor: 'rgba(0, 0, 0, 0.08)',
                                                borderRight: '3px solid #000000',
                                                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.12)' }
                                            }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <StyledBadge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                variant="dot"
                                                invisible={!chatHasNotification}
                                            >
                                                <Avatar src={sender?.profileImage?.url} sx={{ width: 48, height: 48 }} />
                                            </StyledBadge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                    {sender?.firstName} {sender?.lastName}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                                    {chat.latestMessage?.content || "No messages yet"}
                                                </Typography>
                                            }
                                        />
                                        {chatHasNotification && (
                                            <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                                {index < chats.length - 1 && <Divider sx={{ mx: 2 }} />}
                            </React.Fragment>
                        );
                    })}
                </List>
            </Box>
        </PremiumCard>
    )
}

export default MyChats;