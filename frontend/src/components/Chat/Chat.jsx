import React from 'react'
import {Grid} from '@mui/material/';
import MyChats from './MyChats';
import ChatBox from './ChatBox';

const Chat = () => {
    return (
        <div style={{overflowY:'hidden', height:'93vh'}}>
            <Grid container direction='row' style={{height:"100%", display: 'flex' }} >

                <Grid item xs={5}>
                    <MyChats/>
                </Grid>

                <Grid item xs={7}>
                    <ChatBox />
                </Grid>

            </Grid>
        </div>
    )
}

export default Chat;