import { Box, FormControl, CircularProgress, Typography, TextField } from '@mui/material'
import React, {useState, useEffect} from 'react'
import axios from 'axios';
import useStore from '../../store';
import ScrollableChat from './ScrollableChat';
import io from 'socket.io-client';
import { axiosPrivate } from '../../actions/axios';


var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {

    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newMessage, setNewMessage] = useState();
    // const [isTyping, setIsTyping] = useState(false);
    // const [typing, setTyping] = useState(false);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const {backendURL, userID, selectedChat, chat, notification, setNotification} = useStore();

    const getSender = (userID, users) => {
        return (users?.[0]?._id === userID ? users?.[1]?.userName : users?.[0]?.userName)
    }

    const fetchMessages = async (e) => {
        if (!selectedChat || selectedChat._id === undefined) return;
        try {
            setIsLoading(true)
            const {data} = await axiosPrivate.get(`${backendURL}message/allMessages/${selectedChat?._id}`);
            setMessages(data)
            setIsLoading(false)
            socket.emit('joinChat', selectedChat._id);
        } catch (error) {
            console.log('Error', error)
        }
    }

    const sendMessage = async (e) => {
        if(e.key === 'Enter' && newMessage) {
            // socket.emit('stopTyping', selectedChat._id);
            try {
                setNewMessage('');
                const {data} = await axiosPrivate.post('message/sendMessage', {
                    content: newMessage,
                    chatId: selectedChat,
                    _id: userID
                });
                socket.emit('newMessage', data);
                setMessages([...messages, data]);
            } catch (error) {
                console.log('Error....', error)
            }
        }
    }

    useEffect(() => {
        socket = io(backendURL);
        socket.emit("setup", userID);
        socket.on('connected', () => setIsSocketConnected(true));
        // socket.on('typing', () => setIsTyping(true));
        // socket.on('stopTyping', () => setIsTyping(false));
        return () => {
            socket.disconnect();            
        };
    }, [])

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat])

    useEffect(() => {
        socket.on('messageReceived', (newMessageReceived) => {
            if ( !selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id ) {
                if ( !notification.includes(newMessageReceived) ) {
                    setNotification([newMessageReceived, ...notification]);
                    setFetchAgain(!fetchAgain);
                }
            } else {
                setMessages([...messages, newMessageReceived]);
            }
            return () => {
                socket.off('messageReceived');
            };
        })
    }, [selectedChatCompare, notification])

    const typingHandler = (e) => {
        setNewMessage(e.target.value);
    //     if (!isSocketConnected) return;
    //     if (!typing) {
    //         setTyping(true)
    //         socket.emit('typing', selectedChat._id);
    //     }
    //     let lastTypingTime = new Date().getTime()
    //     var timerLength = 3000;
    //     setTimeout(() => {
    //         var timeNow = new Date().getTime()
    //         var timeDiff = timeNow - lastTypingTime;
    //         if (timeDiff >= timerLength && typing) {
    //             socket.emit("stopTyping", selectedChat._id);
    //             setTyping(false);
    //         }
    //     }, timerLength);
    }
    
    return (
        <>
            {
                selectedChat ? (
                    <>
                        <Typography
                            variant='h6'
                            style={{paddingTop:'23px', paddingLeft:'23px', justifyContent:'space-between', alignItems:"center"}}
                            fullWidth
                            >
                            {getSender(userID, selectedChat?.users)}
                        </Typography>

                        <Box
                            justifyContent="flex-end"
                            p={1}
                            sx={{width:"100%", height:"100%", overflowY:"hidden"}}
                            >
                            {
                                isLoading ? (
                                    <CircularProgress 
                                        size="xl"
                                        w={20}
                                        h={20}
                                        style={{justifyContent:"center", alignItems:'center'}}
                                        margin="auto"
                                    />
                                    ) : (
                                    <div style={{ height:'90%', padding:'5%', border: '#00aeef 1px solid', borderRadius:'7px', display: 'flex',flexDirection: 'column', overflowY: 'scroll', scrollbarWidth: 'none' }}>
                                        <ScrollableChat messages={messages} />
                                        <FormControl mt={3}>
                                            <TextField
                                                style={{paddingTop:'2%'}}
                                                variant="outlined"
                                                required
                                                placeholder="Enter a message.."
                                                value={newMessage}
                                                onChange={typingHandler}
                                                onKeyDown={sendMessage}
                                            />
                                        </FormControl>
                                    </div>
                                )
                            }
                        </Box>
                    </>
                ) : (
                    <Box style={{backgroundColor:'#00aeef'}} alignItems="center" justifyContent="center">
                        <Typography fontSize="3xl" pb={3} pt={7} fontFamily="Work sans">
                            Click on a user to start chatting
                        </Typography>
                    </Box>
                )
            }
        </>
    )
}

export default SingleChat;