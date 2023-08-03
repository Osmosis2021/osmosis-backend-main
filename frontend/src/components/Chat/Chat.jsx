import React from 'react'
import {Grid} from '@mui/material/';
import MyChats from './MyChats';
import ChatBox from './ChatBox';

const Chat = () => {
    return (
        <Grid container direction='row' style={{width:"100vw", display: 'flex' }} >

            <Grid item xs={4}>
                <MyChats/>
            </Grid>

            <Grid item xs={8}>
                <ChatBox />
            </Grid>

        </Grid>
    )
}

export default Chat;