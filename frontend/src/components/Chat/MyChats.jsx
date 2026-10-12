import React from 'react'
import useStore from '../../store';
import { Badge, Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Divider } from '@mui/material';
import SideDrawer from './SearchUsers';
import { PremiumCard } from '../../ui/PremiumCard';
import PremiumEmptyState from '../../ui/PremiumEmptyState';

// The other person in a one-to-one conversation.
const otherPerson = (userID, users = []) => (users[0]?._id === userID ? users[1] : users[0]);

// "2:05 PM" today, "Mon" this week, otherwise "Oct 9".
const shortTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (now - date < 6 * 86400000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/** The inbox. Conversations are loaded and kept live by useMessagingSync (in Layout). */
const MyChats = () => {
    const { selectedChat, setSelectedChat, chats, userID } = useStore();

    return (
        <PremiumCard nohover sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0, bgcolor: 'white' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F0F0F0' }}>
                <Typography variant="h6" component="h1" sx={{ fontWeight: 800, mb: 2 }}>Messages</Typography>
                <SideDrawer />
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {chats?.length === 0 ? (
                    <Box sx={{ p: 2 }}>
                        <PremiumEmptyState
                            title="No messages yet"
                            subtitle="Questions about a session? Use the Message button on any listing or booking to reach the artist."
                            sx={{ border: 'none', py: 4, px: 1 }}
                        />
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {chats?.map((chat, index) => {
                            const person = otherPerson(userID, chat.users);
                            const isSelected = selectedChat?._id === chat._id;
                            const unread = chat.unreadCount > 0;
                            const latest = chat.latestMessage;
                            const fromMe = latest && (latest.sender?._id || latest.sender) === userID;

                            return (
                                <React.Fragment key={chat._id}>
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            onClick={() => setSelectedChat(chat)}
                                            selected={isSelected}
                                            sx={{
                                                py: 1.75,
                                                px: 2,
                                                '&.Mui-selected': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.06)',
                                                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.1)' }
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar src={person?.profileImage?.url} alt="" sx={{ width: 48, height: 48 }} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                sx={{ ml: 0.5, minWidth: 0 }}
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                                                            {[person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.userName || 'Studio Time member'}
                                                        </Typography>
                                                        <Typography variant="caption" color={unread ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: unread ? 800 : 500, flexShrink: 0 }}>
                                                            {shortTime(latest?.createdAt || chat.updatedAt)}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography component="span" variant="body2" noWrap sx={{ flex: 1, color: unread ? 'text.primary' : 'text.secondary', fontWeight: unread ? 700 : 400 }}>
                                                            {latest?.content ? `${fromMe ? 'You: ' : ''}${latest.content}` : 'No messages yet'}
                                                        </Typography>
                                                        {unread && (
                                                            <Badge badgeContent={chat.unreadCount} color="primary" sx={{ mr: 1, '& .MuiBadge-badge': { position: 'static', transform: 'none', fontWeight: 700 } }}>
                                                                <span />
                                                            </Badge>
                                                        )}
                                                    </Box>
                                                }
                                                secondaryTypographyProps={{ component: 'span' }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    {index < chats.length - 1 && <Divider sx={{ mx: 2 }} />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}
            </Box>
        </PremiumCard>
    )
}

export default MyChats;
