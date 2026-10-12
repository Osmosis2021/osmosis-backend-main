import React, { useEffect, useState } from 'react'
import { Grid, Box, Container, useTheme, useMediaQuery } from '@mui/material/';
import MyChats from './MyChats';
import ChatBox from './ChatBox';
import TopNavBar from '../TopNavBar/TopNavBar';
import useStore from '../../store';

const Chat = () => {
    const [fetchAgain, setFetchAgain] = useState(false);
    const { selectedChat } = useStore();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Coming back to Messages later opens the inbox, not the last conversation.
    useEffect(() => () => useStore.getState().setSelectedChat(null), []);

    return (
        <Box
            sx={{
                // Exactly the visible screen, so only the message list scrolls (on phones the
                // layout already leaves room for the bottom navigation).
                height: { xs: 'calc(100dvh - 80px - env(safe-area-inset-bottom))', md: '100dvh' },
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#FAFAFA',
                overflow: 'hidden',
            }}
        >
            {!(isMobile && selectedChat) && <TopNavBar />}
            <Container maxWidth="xl" sx={{ flex: 1, minHeight: 0, py: { xs: 1, md: 3 }, px: { xs: 1, md: 3 } }}>
                <Grid container spacing={{ xs: 0, md: 3 }} sx={{ height: '100%' }}>
                    {(!isMobile || !selectedChat) && (
                        <Grid item xs={12} md={4} lg={3} sx={{ height: '100%' }}>
                            <MyChats fetchAgain={fetchAgain} />
                        </Grid>
                    )}

                    {(!isMobile || selectedChat) && (
                        <Grid item xs={12} md={8} lg={9} sx={{ height: '100%' }}>
                            <ChatBox key={selectedChat?._id || 'empty'} fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
                        </Grid>
                    )}
                </Grid>
            </Container>
        </Box>
    )
}

export default Chat;
