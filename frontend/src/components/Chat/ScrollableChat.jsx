import React from 'react';
import ScrollableFeed from 'react-scrollable-feed';
import useStore from '../../store';
import { Avatar } from '@mui/material';

const ScrollableChat = ({messages}) => {

    const { userID } = useStore();

    const isSameSender = (messages, m, i, userID) => {
        return (
            i < messages?.length - 1 && (
                messages[i+1]?.sender?._id !== m?.sender?._id ||
                messages[i+1]?.sender?._id === undefined &&
                messages[i+1]?.sender?._id !== userID
            )
        )
    }

    const isSameSenderMargin = (messages, m, i, userID) => {
        if ( i < messages?.length - 1 && 
                messages[i + 1]?.sender?._id === m?.sender?._id && 
                messages[i]?.sender?._id !== userID 
            ) return 33;
                else if ( 
                    (
                        i < messages?.length - 1 && 
                        messages[i + 1]?.sender?._id !== m?.sender?._id && 
                        messages[i]?.sender?._id !== userID
                    ) || 
                    (
                        i === messages?.length - 1 && 
                        messages[i]?.sender?._id !== userID
                    )
                ) return 0;
        else return "auto";
    }

    const isSameUser = (messages, m, i) => {
        return i > 0 && messages[i - 1]?.sender?._id === m?.sender?._id;
    };
      
    const isLastMessage = (messages, i, userID) => {
        return (
            i === messages?.length - 1 &&
            messages[messages?.length - 1]?.sender?._id !== userID &&
            messages[messages?.length - 1]?.sender?._id
        )
    }

    return (
        <ScrollableFeed>
            { 
                messages && messages?.map((m, i) => (
                    <div style={{ display: 'flex' }} key={m._id}>

                        {
                            (isSameSender(messages, m, i, userID) || isLastMessage(messages, i, userID))
                             && m?.sender?._id !== userID && (
                                <Avatar src={m?.sender?.profileImage?.url} />
                            )
                        }

                        <span 
                            style={{
                                backgroundColor: `${m?.sender?._id === userID ? '#00aeef' : '#7286D3'}`,
                                color: 'white',
                                borderRadius: '20px',
                                padding: '5px 15px',
                                maxWidth: '75%',
                                marginLeft: isSameSenderMargin(messages, m, i, userID),
                                marginTop: isSameUser(messages, m, i, userID) ? 3 : 10,
                            }} >
                            {m.content}
                        </span>

                        {
                            isSameSender(messages, m, i, userID) && m?.sender?._id === userID && (
                                <Avatar src={m?.sender?.profileImage?.url} />
                            )
                        }

                    </div>

                ))
            }
        </ScrollableFeed>
    )
}

export default ScrollableChat;