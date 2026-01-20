import React, { useState } from 'react'
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

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FAFAFA' }}>
            <TopNavBar />
            <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3, overflow: 'hidden' }}>
                <Grid container spacing={3} sx={{ height: '100%' }}>
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