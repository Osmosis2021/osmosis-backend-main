import React from 'react';
import ScrollableFeed from 'react-scrollable-feed';
import useStore from '../../store';
import { Avatar, Box, Typography, Stack } from '@mui/material';

const senderId = (m) => m?.sender?._id || m?.sender;

const formatTime = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '');

// "Today", "Yesterday", or "Friday, October 9".
const formatDay = (value) => {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const ScrollableChat = ({ messages, onRetry }) => {
    const { userID } = useStore();

    return (
        <ScrollableFeed>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 1 }} role="log" aria-live="polite" aria-label="Messages">
                {messages?.map((m, i) => {
                    const isMe = senderId(m) === userID;
                    const prev = messages[i - 1];
                    const next = messages[i + 1];
                    const nextIsSame = next && senderId(next) === senderId(m);
                    const newDay = m.createdAt && (!prev?.createdAt || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString());
                    const showAvatar = !isMe && !nextIsSame;
                    const failed = m.status === 'failed';

                    return (
                        <React.Fragment key={m?._id}>
                            {newDay && (
                                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', fontWeight: 700, my: 1.5 }}>
                                    {formatDay(m.createdAt)}
                                </Typography>
                            )}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start',
                                    mb: nextIsSame ? 0.2 : 1.5,
                                    px: 1
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ maxWidth: '82%' }}>
                                    {showAvatar && <Avatar src={m?.sender?.profileImage?.url} alt="" sx={{ width: 28, height: 28, mb: 0.5 }} />}
                                    {!isMe && !showAvatar && <Box sx={{ width: 28, flexShrink: 0 }} />}

                                    <Box
                                        component={failed ? 'button' : 'div'}
                                        onClick={failed ? () => onRetry?.(m) : undefined}
                                        sx={{
                                            bgcolor: isMe ? 'primary.main' : 'white',
                                            color: isMe ? 'white' : 'text.primary',
                                            p: '10px 16px',
                                            borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            border: isMe ? 'none' : '1px solid #EDEDED',
                                            opacity: m.status === 'sending' ? 0.7 : failed ? 0.55 : 1,
                                            textAlign: 'left',
                                            font: 'inherit',
                                            cursor: failed ? 'pointer' : 'default',
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'inherit' }}>
                                            {m.content}
                                        </Typography>
                                    </Box>
                                </Stack>

                                {(failed || m.status === 'sending' || (!nextIsSame && m.createdAt)) && (
                                    <Typography
                                        variant="caption"
                                        role={failed ? 'alert' : undefined}
                                        sx={{
                                            mt: 0.5,
                                            mx: isMe ? 1 : 5,
                                            color: failed ? 'error.main' : 'text.secondary',
                                            fontSize: '0.7rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {failed ? 'Not sent · Tap the message to try again' : m.status === 'sending' ? 'Sending…' : formatTime(m.createdAt)}
                                    </Typography>
                                )}
                            </Box>
                        </React.Fragment>
                    )
                })}
            </Box>
        </ScrollableFeed>
    )
}

export default ScrollableChat;
