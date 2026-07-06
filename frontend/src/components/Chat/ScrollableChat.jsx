import React from 'react';
import ScrollableFeed from 'react-scrollable-feed';
import useStore from '../../store';
import { Avatar, Box, Typography, Stack } from '@mui/material';

const ScrollableChat = ({ messages }) => {
    const { userID } = useStore();

    const isSameSender = (messages, m, i, userID) => {
        return (
            i < messages?.length - 1 && (
                messages[i + 1]?.sender?._id !== m?.sender?._id ||
                (messages[i + 1]?.sender?._id === undefined &&
                messages[i + 1]?.sender?._id !== userID)
            )
        )
    }

    const isLastMessage = (messages, i, userID) => {
        return (
            i === messages?.length - 1 &&
            messages[messages?.length - 1]?.sender?._id !== userID &&
            messages[messages?.length - 1]?.sender?._id
        )
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <ScrollableFeed>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {messages && messages?.map((m, i) => {
                    const isMe = m?.sender?._id === userID;
                    const showAvatar = !isMe && (isSameSender(messages, m, i, userID) || isLastMessage(messages, i, userID));
                    const nextIsSame = i < messages.length - 1 && messages[i + 1]?.sender?._id === m?.sender?._id;

                    return (
                        <Box
                            key={m?._id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                mb: nextIsSame ? 0.2 : 1.5,
                                px: 1
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ maxWidth: '80%' }}>
                                {showAvatar && (
                                    <Avatar
                                        src={m?.sender?.profileImage?.url}
                                        sx={{ width: 28, height: 28, mb: 0.5 }}
                                    />
                                )}
                                {!isMe && !showAvatar && <Box sx={{ width: 36 }} />}

                                <Box
                                    sx={{
                                        bgcolor: isMe ? 'primary.main' : 'white',
                                        color: isMe ? 'white' : 'text.primary',
                                        p: '10px 16px',
                                        borderRadius: isMe
                                            ? '20px 20px 4px 20px'
                                            : '20px 20px 20px 4px',
                                        boxShadow: 'none',
                                        border: isMe ? 'none' : '1px solid #EDEDED'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
                                        {m.content}
                                    </Typography>
                                </Box>
                            </Stack>

                            {!nextIsSame && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        mt: 0.5,
                                        mx: isMe ? 1 : 6,
                                        color: 'text.secondary',
                                        fontSize: '0.65rem',
                                        fontWeight: 600
                                    }}
                                >
                                    {formatTime(m.createdAt)}
                                </Typography>
                            )}
                        </Box>
                    )
                })}
            </Box>
        </ScrollableFeed>
    )
}

export default ScrollableChat;