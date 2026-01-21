import React from 'react'
import useStore from '../../store';
import { Box } from '@mui/material';
import SingleChat from './SingleChat';
import { PremiumCard } from '../../ui/PremiumCard';

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
    const { selectedChat } = useStore();

    return (
        <PremiumCard
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                p: 0,
                bgcolor: 'white'
            }}
        >
            <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        </PremiumCard>
    );
};

export default ChatBox;