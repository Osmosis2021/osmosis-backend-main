import React, { useEffect } from 'react'
import useStore from '../../store';
import { styled } from '@mui/material/styles';
import { Badge, Box, Container, Card, Grid, Typography, Avatar } from '@mui/material';
import SideDrawer from './SearchUsers';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';


const MyChats = () => {
    const axiosPrivate = useAxiosPrivate()
    const {backendURL, selectedChat, setSelectedChat, chats, setChats, userID, notification} = useStore();

    const fetchChats = async (userID) => {
        try {
            const {data} = await axiosPrivate.get(`${backendURL}chat/fetchChats/${userID}`)
            setChats(data)
            console.log('inside MyChats with setChats as ...', data)
        } catch (err) {
            console.error('Error while accessing chat:', err.message); 
        }
    }

    const getSender = (userID, users) => {
        return (users[0]._id === userID ? users[1]?.userName : users[0]?.userName);
    }

    useEffect(() => {
        fetchChats(userID);
    }, [userID])

    const hasNotification = (chatId) => {
        return Object.keys(notification).some(
          (notifId) => notification[notifId]?.chat?._id === chatId
        );
    };

    const StyledBadge = styled(Badge)(({ theme }) => ({
        '& .MuiBadge-badge': {
            backgroundColor: '#00aeef',
            color: '#00aeef',
            boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
            '&::after': {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                // animation: 'ripple 1.2s infinite ease-in-out',
                border: '1px solid currentColor',
                content: '""',
            },
        },
        '@keyframes ripple': {
            '0%': {
                transform: 'scale(.8)',
                opacity: 1,
            },
            '100%': {
                transform: 'scale(2.4)',
                opacity: 0,
            },
        },
    }));

    return (
        <Container style={{paddingTop:'20px', height:'100%', backgroundColor:"#00aeef"}}>
            <Box>
                <SideDrawer/>
                <br/>
                <Typography variant='h5' style={{color:'white', textAlign:'center'}}>My chats</Typography>
                <br/>
                <Container style={{display:'flex', justifyContent:'center'}}>
                    <Box>
                        {
                            chats?.map((chat) => {
                                const chatHasNotification = hasNotification(chat._id);

                                return (
                                    <>
                                        <Card 
                                            onClick={() => {setSelectedChat(chat)}}
                                            style={{ cursor: 'pointer', backgroundColor:`${selectedChat === chat ? 'white' : '#00aeef'}`, color:`${selectedChat === chat ? '#00aeef' : 'white'}`}}
                                            key={chat._id} >
                                            <Grid container='row' spacing={1} padding={1} wrap="nowrap" justifyContent='center' alignItems='center'>
                                                {
                                                    chatHasNotification ? (
                                                        <Grid item>
                                                            <StyledBadge
                                                            overlap="circular"
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                            variant="dot"
                                                            >
                                                            <Avatar
                                                                src={
                                                                chat.users[0]._id === userID
                                                                    ? chat.users[1]?.profileImage?.url
                                                                    : chat.users[0]?.profileImage?.url
                                                                }
                                                            />
                                                            </StyledBadge>
                                                        </Grid>
                                                    ) : (
                                                        <Grid item>
                                                            <Avatar
                                                            src={
                                                                chat.users[0]._id === userID
                                                                ? chat.users[1]?.profileImage?.url
                                                                : chat.users[0]?.profileImage?.url
                                                            }
                                                            />
                                                        </Grid>
                                                    )
                                                }
                                                <Grid item>
                                                    <Typography variant="h6">{getSender(userID, chat.users)}</Typography>
                                                </Grid>
                                            </Grid>

                                        </Card>
                                        <br />
                                    </>
                                )
                            })
                        }
                    </Box>
                </Container>
            </Box>
        </Container>   
    )
}

export default MyChats