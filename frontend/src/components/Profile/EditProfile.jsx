import { Button, Container, Grid, Stack, TextField, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useNavigate, useLocation } from "react-router-dom";
import UploadProfilePicture from './UploadProfilePicture';
import useStore from '../../store';
import TopProfileBar from '../TopNavBar/TopProfileBar';
const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'

function EditProfile() {
    const { userID, userName, setUserName, isTeacher, setFirstName, setLastName } = useStore()
    const [userInfo, setUserInfo] = useState({});
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const location = useLocation();

    // TODO: check this function
    const getUser = (userName) => {
        for (let i = 0; i < userName.length; i++) {
            if (userName[i].userName === userName) {
                setUserInfo(userName[i]);
            }
        }
    }

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

		// getUser(userName);
		// axiosPrivate(`${backendURL}user/getUserInfo/${userName}`)
		// .then((res) => {
		// 	return res.json();
		// }).then((data) => {
		// 	setUserInfo(data);
		// }).catch((err) => {
		// 	console.log('Error getting users info:\n', err);
		// });

        const getUserInfo = async () => {
            try {
                const response = await axiosPrivate.get(`user/getUserInfo/${userName}`, {
                    signal: controller.signal
                });
                console.log(response.data);
                isMounted && setUserInfo(response.data);
            } catch (err) {
                console.error(err);
                navigate('/', { state: { from: location }, replace: true });
            }
        }

        getUserInfo()
        return () => {
            isMounted = false;
            controller.abort();
        }
    }, [userName])


    const changeFirstName = e => {
        setUserInfo(prev => ({...prev, firstName: e.target.value}))
    }

    const changeLastName = e => {
        setUserInfo(prev => ({...prev, lastName: e.target.value}))
    }

    const changeUserName = e => {
        setUserInfo(prev => ({...prev, userName: e.target.value}))
    }

    const changeEmail = e => {
        setUserInfo(prev => ({...prev, email: e.target.value}))
    }

    const changeDescription = e => {
        setUserInfo(prev => ({...prev, description: e.target.value}))
        console.log(userInfo)
    }

    // async function updateProfile () {
    //     const { firstName, lastName, description, userName, email } = userInfo;
    //     console.log(userID)
    //     await axios.put(`${backendURL}user/updateProfile/${userID}`, {
    //         firstName, lastName, description, userName, email
    //     })
    //     navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
    // }

    const updateProfile = async (e) => {
        e.preventDefault();
        const { firstName, lastName, description, userName, email } = userInfo
        
        try {
            await fetch (`${backendURL}user/updateProfile/${userID}`, {
                body: JSON.stringify(userInfo),
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            }).then(() => {
                console.log('successfully updated profile');
                setFirstName(userInfo.firstName)  // TODO: is this using the right firstName etc?
                setLastName(userInfo.lastName)
                setUserName(userInfo.userName)
                alert('Successfully updated your profile')
                navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
            })
        } catch (err) {
            alert('Update failed, please try again later')
            console.log('Error updating user:\n', err);
        };
    }

    const deleteProfile = async (e) => {
        e.preventDefault();
		try {
			await fetch (`${backendURL}user/deleteProfile/${userInfo._id}`, {
				method: 'DELETE'
			}).then(() => {
				alert('Successfully DELETED your profile')
				navigate('/')
			})
		} catch (err) {
			alert('DELETION failed, please try again later')
			console.log('Error deleting user:\n', err);
		};
	}
        
        
        
        

  return (
        <div>
            <TopProfileBar userName={userName}/>
            <br/>
            <br/>
            <Container style={{textAlign:'center'}}>
                <UploadProfilePicture />
                <Stack>
                    <Container align='center' style={{width:"80vw"}} sx={{ py: 2, }}>
                        <form>
                        
                            <Grid container direction='row' spacing={2}>

                                <Grid item xs={12}>
                                    <Typography variant='h6'>{`${userInfo.firstName} ${userInfo.lastName}`} </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    
                                    <Grid item>
                                        <Typography style={{textAlign:'left'}} variant="body1">{userInfo.firstName}</Typography>
                                    </Grid>

                                    <Grid item>
                                        <TextField
                                            onChange={changeFirstName}
                                            placeholder='Change First Name'
                                            fullWidth
                                            required
                                            id="outlined-required"
                                        />
                                    </Grid>

                                </Grid>

                                <Grid item xs={6}>

                                    <Grid item>
                                        <Typography style={{textAlign:'left'}} variant="body1">{userInfo.lastName}</Typography>
                                    </Grid>
                                
                                    <Grid item>
                                        <TextField 
                                            onChange={changeLastName}
                                            placeholder='Change Last Name'
                                            fullWidth
                                            required
                                            id="outlined-required"
                                        />
                                    </Grid>

                                </Grid>

                            </Grid>

                            <Grid container justifyContent='center' py={2}>

                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Bio</Typography>
                                    <TextField multiline fullWidth placeholder='Edit your bio' onChange={changeDescription}></TextField>
                                </Grid>
                            
                                <Grid item>
                                    <Typography variant='h6'>{userInfo.userName} </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Username</Typography>
                                    <TextField id='userNameInput' fullWidth placeholder='Change Your Username' onChange={changeUserName}></TextField>
                                </Grid>
                                
                            </Grid>

                            <Grid container justifyContent='center'>

                                <Grid item>
                                    <Typography variant='h6'>{userInfo.email} </Typography>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Email</Typography>
                                    <TextField   fullWidth placeholder='Change Your Email' onChange={changeEmail}></TextField>
                                </Grid>

                            </Grid>

                            {/* <Grid container py={2} justifyContent='center'>
                                
                                <Grid item>
                                    <Typography variant='h6'>**********</Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Password</Typography>
                                    <TextField  fullWidth placeholder='Change Your Password'></TextField>
                                </Grid>

                            </Grid> */}

                            <br/>
                            <br/>

                            {/* <LinkRouter to='/profile' align='center' style={{textDecoration: 'none'}}> */}
                                <Button onClick={updateProfile} type='submit' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                                    Update Profile
                                </Button>
                            {/* </LinkRouter> */}

                                <Button onClick={deleteProfile} type='submit' color='error' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white', marginBottom:'36px', marginTop:'16px'}} fullWidth>
                                    Delete Profile
                                </Button>

                        </form>
                    </Container>
                </Stack>
            </Container>
        </div>
    )
}

export default EditProfile