import { Box, Button, InputAdornment, List, Modal, OutlinedInput, Grid, IconButton } from '@mui/material';
import React, { useState } from 'react'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import useStore from '../../store';
import UserListItem from './UserListItem';
import UsersLoading from './UsersLoading';
import { axiosPrivate } from '../../actions/axios';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/';

const SearchUsers = () => {

    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const { setSelectedChat, chats, setChats, userID } = useStore();

    const handleModalOpen = () => {
        setOpen(true);
    };

    const handleModalClose = () => {
        setOpen(false);
    };

    async function handleSearch(e) {
        if (e.key === 'Enter') {
            if (search) {
                try {
                    setIsLoading(true);
                    const response = await axiosPrivate.get(`${backendURL}chat/allUsers?search=${search}`, {withCredentials: true});
                    const data = response.data;
                    setIsLoading(false);
                    setSearchResult(data);
                } catch (err) {
                    alert('Failed to find user');
                    setIsLoading(false);
                    setSearchResult([]);
                }
            } else {
                alert('TYPE USER TO SEARCH');
            }
        }
    }

    const accessChats = async (searchedUserID) => {
        // prevent from creating chat if no message is sent 
        try {
            setLoadingChat(true)
            const {data} = await axios.get(`${backendURL}chat/accessChats/${searchedUserID}?userID=${userID}`, userID)
            if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
            setSelectedChat(data)
            setLoadingChat(false)
            setOpen(false)
        } catch (err) {
            console.log('Error while accessing chat:', err.message); 
        }
    }

    return (
        <>
            <Box style={{ justifyContent:'center', alignItems:'center'}} sx={{ display: 'flex'}}>
                <Button
                    variant='contained'
                    style={{color:'#00aeef', backgroundColor:'white'}}
                    aria-label="open drawer"
                    onClick={handleModalOpen}
                    edge="start"
                    endIcon={<AddIcon style={{color:'#00aeef'}} />}
                    sx={{ ...(open && { display: 'none' }) }}>
                    Create
                </Button>
      
                <Modal open={open} onClose={handleModalClose}>

                    <Box sx={{ backgroundColor:'#00aeef', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop:'20%', height: '100%' }}>
                        
                        <div style={{position:'absolute', top:'10px', right:'10px', color:'white'}} onClick={handleModalClose}><CloseIcon style={{fontSize:'36px'}}/></div>

                        <Grid container alignItems='center' justifyContent='center'>
                            <Grid item>
                                <OutlinedInput
                                    style={{color:'white', border:'1px solid white'}}
                                    variant="filled"
                                    placeholder="Search by userName"
                                    value={search}
                                    onKeyDown={handleSearch}
                                    onChange={(e) => setSearch(e.target.value)}
                                    endAdornment={<InputAdornment position="end"><IconButton onClick={handleSearch}><SearchRoundedIcon style={{color:'white', fontSize: '26px' }} /></IconButton></InputAdornment>}
                                />
                            </Grid>
                        </Grid> 
                        <List>

                            {
                                isLoading ? (
                                    <UsersLoading />
                                    ) : (
                                        searchResult?.map((user) => (
                                        <>
                                            <Grid item style={{cursor:'pointer'}}>
                                                <UserListItem
                                                key={user._id}
                                                user={user}
                                                handleFunction={() => accessChats(user._id)}/>
                                            </Grid>
                                            <br/>
                                        </>
                                    )   
                                ))
                            }

                        </List>

                    </Box>
                </Modal>
            </Box>

        </>
    )
}

export default SearchUsers;





