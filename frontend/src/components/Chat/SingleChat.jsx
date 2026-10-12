import {
    Box,
    CircularProgress,
    Typography,
    Stack,
    Avatar,
    IconButton,
    InputBase,
    Paper,
    useTheme,
    useMediaQuery
} from '@mui/material'
import React, { useState, useEffect, useCallback } from 'react'
import { Link as RouterLink } from 'react-router-dom';
import useStore from '../../store';
import ScrollableChat from './ScrollableChat';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PremiumEmptyState from '../../ui/PremiumEmptyState';

const otherPerson = (userID, users) => (users?.[0]?._id === userID ? users?.[1] : users?.[0]);

const SingleChat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const { userID, firstName, selectedChat, setSelectedChat, socket } = useStore();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const axiosPrivate = useAxiosPrivate();
    const chatId = selectedChat?._id;

    // Marks the conversation as read here and in the inbox badge.
    const markRead = useCallback((id) => {
        const { chats, setChats } = useStore.getState();
        setChats(chats.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)));
        axiosPrivate.post(`message/read/${id}`).catch(() => { /* the next inbox load corrects the count */ });
    }, [axiosPrivate]);

    const fetchMessages = useCallback(async (id) => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const { data } = await axiosPrivate.get(`message/allMessages/${id}`);
            if (useStore.getState().selectedChat?._id !== id) return; // switched conversations meanwhile
            setMessages(data);
            markRead(id);
        } catch (error) {
            console.error('Error fetching messages', error);
            if (useStore.getState().selectedChat?._id === id) setLoadError(true);
        } finally {
            if (useStore.getState().selectedChat?._id === id) setIsLoading(false);
        }
    }, [axiosPrivate, markRead]);

    useEffect(() => {
        setMessages([]);
        if (chatId) fetchMessages(chatId);
    }, [chatId, fetchMessages]);

    // Live messages for this conversation.
    useEffect(() => {
        if (!socket || !chatId) return undefined;
        socket.emit('joinChat', chatId);
        const handleMessage = (message) => {
            if (message?.chat?._id !== chatId) return;
            setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
            markRead(chatId);
        };
        socket.on('messageReceived', handleMessage);
        return () => socket.off('messageReceived', handleMessage);
    }, [socket, chatId, markRead]);

    const deliver = async (pending) => {
        try {
            const { data } = await axiosPrivate.post('message/sendMessage', { content: pending.content, chatId });
            socket?.emit('newMessage', data);
            setMessages((prev) => prev.map((m) => (m._id === pending._id ? data : m)));
            const { chats, setChats } = useStore.getState();
            const current = chats.find((c) => c._id === chatId) || selectedChat;
            setChats([{ ...current, latestMessage: data }, ...chats.filter((c) => c._id !== chatId)]);
        } catch (error) {
            console.error('Error sending message', error);
            setMessages((prev) => prev.map((m) => (m._id === pending._id ? { ...m, status: 'failed' } : m)));
        }
    };

    const sendMessage = (e) => {
        if (e.type === 'keydown' && !(e.key === 'Enter' && !e.shiftKey)) return;
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !chatId) return;
        // Show it straight away; it's marked if it doesn't go through.
        const pending = {
            _id: `pending-${Date.now()}`,
            content,
            sender: { _id: userID, firstName },
            createdAt: new Date().toISOString(),
            status: 'sending',
        };
        setMessages((prev) => [...prev, pending]);
        setNewMessage('');
        deliver(pending);
    };

    const retry = (message) => {
        setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, status: 'sending' } : m)));
        deliver(message);
    };

    const person = selectedChat ? otherPerson(userID, selectedChat.users) : null;
    const personName = [person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.userName || 'Studio Time member';
    const profilePath = person?.userName ? `/${person.isTeacher ? 'teachers' : 'students'}/${person.userName}` : null;

    if (!selectedChat) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <PremiumEmptyState
                    title="Your inbox"
                    subtitle="Pick a conversation to read and reply."
                    sx={{ border: 'none' }}
                />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {/* Header */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', bgcolor: 'white' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    {isMobile && (
                        <IconButton onClick={() => setSelectedChat(null)} size="small" aria-label="Back to messages">
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Box
                        component={profilePath ? RouterLink : 'div'}
                        to={profilePath || undefined}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, color: 'inherit', textDecoration: 'none' }}
                    >
                        <Avatar src={person?.profileImage?.url} alt="" sx={{ width: 40, height: 40 }} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>{personName}</Typography>
                            {profilePath && (
                                <Typography variant="caption" color="text.secondary">
                                    {person?.isTeacher === true ? 'Artist · view profile' : person?.isTeacher === false ? 'Guest' : 'View profile'}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Stack>
            </Box>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, minHeight: 0, p: { xs: 1, md: 2 }, bgcolor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress size={32} aria-label="Loading messages" />
                    </Box>
                ) : loadError ? (
                    <Box sx={{ m: 'auto', textAlign: 'center' }}>
                        <Typography color="text.secondary" sx={{ mb: 1 }}>We couldn't load this conversation.</Typography>
                        <Typography component="button" onClick={() => fetchMessages(chatId)}
                            sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', font: 'inherit' }}>
                            Try again
                        </Typography>
                    </Box>
                ) : messages.length === 0 ? (
                    <Typography color="text.secondary" sx={{ m: 'auto', textAlign: 'center', px: 3 }}>
                        Say hello to {person?.firstName || 'them'}. Ask about the session, what to bring or anything else.
                    </Typography>
                ) : (
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <ScrollableChat messages={messages} onRetry={retry} />
                    </Box>
                )}
            </Box>

            {/* Composer */}
            <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: 'white', borderTop: '1px solid #F0F0F0' }}>
                <Paper
                    elevation={0}
                    component="form"
                    onSubmit={sendMessage}
                    sx={{
                        p: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 4,
                        border: '1px solid #E0E0E0',
                        bgcolor: '#F8F9FA',
                        '&:focus-within': { borderColor: 'primary.main', bgcolor: 'white' }
                    }}
                >
                    <InputBase
                        sx={{ ml: 1, flex: 1, fontSize: '1rem' }}
                        placeholder={`Message ${person?.firstName || ''}`.trim()}
                        inputProps={{ 'aria-label': `Message ${personName}`, maxLength: 2000 }}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={sendMessage}
                        multiline
                        maxRows={4}
                    />
                    <IconButton
                        type="submit"
                        color="primary"
                        sx={{ p: '10px' }}
                        disabled={!newMessage.trim()}
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </IconButton>
                </Paper>
            </Box>
        </Box>
    )
}

export default SingleChat;
