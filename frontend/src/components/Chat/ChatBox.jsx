import React from 'react'
import SingleChat from './SingleChat';
import { PremiumCard } from '../../ui/PremiumCard';

const ChatBox = ({ fetchAgain, setFetchAgain }) => {

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