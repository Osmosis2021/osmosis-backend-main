import React from 'react'
import useStore from '../../store';
import { Box } from '@mui/material';
import SingleChat from './SingleChat';

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
    
    const { selectedChat } = useStore();

    return (
        <Box 
            display={{ lg: selectedChat ? "flex" : "none", md: "flex" }}
            alignItems="center"
            style={{height:'94vh'}}
            xs={{ width: "100%",  }}
            >

            <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />

        </Box>
    );
};

export default ChatBox;