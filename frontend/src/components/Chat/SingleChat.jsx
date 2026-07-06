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
import React, { useState, useEffect, useRef, useCallback } from 'react'
import useStore from '../../store';
import ScrollableChat from './ScrollableChat';
import useAxiosPrivate from '../../hooks/useAxiosPrivate'; // Task 1
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageIcon from '@mui/icons-material/Message';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PremiumEmptyState from '../../ui/PremiumEmptyState';

// var socket; // Removed

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const { userID, selectedChat, setSelectedChat, socket } = useStore(); // Get socket from store
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const axiosPrivate = useAxiosPrivate(); // Task 1: Use hook

    // Ref to track selected chat for socket listener without re-binding
    const selectedChatRef = useRef(selectedChat);

    const getSender = (userID, users) => {
        return (users?.[0]?._id === userID ? users?.[1] : users?.[0])
    }

    const fetchMessages = useCallback(async () => {
        if (!selectedChat?._id) return;

        const chatId = selectedChat._id;
        console.log(`[MobileDebug] Fetching messages for ${chatId}`); // Task 4: Debug log

        try {
            const { data } = await axiosPrivate.get(`message/allMessages/${chatId}`); // Task 1: Relative path

            console.log(`[MobileDebug] Fetched ${data.length} messages for ${chatId}`); // Task 4

            // Race-safe check
            if (selectedChatRef.current?._id === chatId) {
                setMessages(data);
                setIsLoading(false);
                if (socket) {
                    socket.emit('joinChat', chatId);
                }
            } else {
                console.log(`[MobileDebug] Discarding stale response for ${chatId}`);
            }
        } catch (error) {
            console.log('Error fetching messages', error)
            if (selectedChatRef.current?._id === chatId) {
                setIsLoading(false);
            }
        }
    }, [axiosPrivate, socket, selectedChat?._id]);

    const sendMessage = async (e) => {
        if (e.type === 'click' || (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            if (newMessage.trim()) {
                try {
                    const messageToSend = newMessage;
                    setNewMessage(''); // Clear input immediately
                    const { data } = await axiosPrivate.post('message/sendMessage', { // Task 1: Relative path
                        content: messageToSend,
                        chatId: selectedChat._id,
                        _id: userID
                    });

                    if (socket) {
                        socket.emit('newMessage', data);
                    }
                    setMessages(prev => [...prev, data]);
                } catch (error) {
                    console.log('Error sending message', error)
                }
            }
        }
    }

    // ... socket effect ...

    useEffect(() => {
        // Task 3: Key effect strictly to ID and move reset logic here
        const chatId = selectedChat?._id;
        if (chatId) {
            console.log(`[MobileDebug] Chat changed to ${chatId}`);
            selectedChatRef.current = selectedChat;
            setMessages([]);
            setIsLoading(true);
            fetchMessages();
        }
    }, [selectedChat?._id, selectedChat, fetchMessages]); // Task 3: Dependency only ID

    // Removed the separate socket.on('messageReceived') effect block to avoid re-binding loops

    const typingHandler = (e) => {
        setNewMessage(e.target.value);
    }

    const sender = selectedChat ? getSender(userID, selectedChat.users) : null;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {selectedChat ? (
                <>
                    {/* Chat Header */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {isMobile && (
                                <IconButton onClick={() => setSelectedChat(null)} size="small">
                                    <ArrowBackIcon />
                                </IconButton>
                            )}
                            <Avatar src={sender?.profileImage?.url} sx={{ width: 40, height: 40 }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                    {sender?.firstName} {sender?.lastName}
                                </Typography>
                                <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                                    Online
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton size="small">
                            <MoreVertIcon />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    {/* Messages Area */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress size={40} />
                            </Box>
                        ) : (
                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                <ScrollableChat messages={messages} />
                            </Box>
                        )}
                    </Box>

                    {/* Chat Input */}
                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #F0F0F0' }}>
                        <Paper
                            elevation={0}
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
                                sx={{ ml: 1, flex: 1, fontSize: '0.95rem' }}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={typingHandler}
                                onKeyDown={sendMessage}
                                multiline
                                maxRows={4}
                            />
                            <IconButton
                                color="primary"
                                sx={{ p: '10px' }}
                                onClick={sendMessage}
                                disabled={!newMessage.trim()}
                            >
                                <SendIcon />
                            </IconButton>
                        </Paper>
                    </Box>
                </>
            ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                    <PremiumEmptyState
                        title="Your Inbox"
                        subtitle="Select a conversation from the list to start messaging."
                        icon={<MessageIcon sx={{ fontSize: 60, color: 'primary.light', opacity: 0.5 }} />}
                    />
                </Box>
            )}
        </Box>
    )
}

export default SingleChat;