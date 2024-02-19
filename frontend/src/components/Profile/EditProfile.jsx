import { Button, Container, Grid, Stack, TextField, Typography } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import React, { useState, useEffect } from 'react';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useNavigate, useLocation } from "react-router-dom";
import UploadProfilePicture from './UploadProfilePicture';
import useStore from '../../store';
import useAuth from '../../hooks/useAuth'
import TopProfileBar from '../TopNavBar/TopProfileBar';
import useKeyboard from '../../hooks/useKeyboard'


function EditProfile() {
	const {auth} = useAuth()
    const axiosPrivate = useAxiosPrivate()
    const navigate = useNavigate()
    const location = useLocation()
    const { userID, userName, setUserName, isTeacher, firstName, setFirstName, lastName, setLastName,
            email, setEmail, description, setDescription, backendURL} = useStore()
    const [userInfo, setUserInfo] = useState({})
    const [firstName_, setFirstName_] = useState(firstName || '')
    const [lastName_, setLastName_] = useState(lastName || '')
    const [userName_, setUserName_] = useState(userName || '')
    const [email_, setEmail_] = useState(email || '')
    const [description_, setDescription_] = useState(description || '')
	const manageKeyboard = useKeyboard()
    const [deleteSequence, setDeleteSequence] = useState(false)
    const [confirmUserName, setConfirmUserName] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

	useEffect(() => {
		manageKeyboard('editProfileFieldGrid') // hide bottomnav when mobile keyboard showing and scroll editProfileFieldGrid into view
	}, [])

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const getUserInfo = async () => {
            try {
                const response = await axiosPrivate.get(`user/getUserInfo/${userName}`, {
                    signal: controller.signal
                });
                isMounted && setUserInfo(response.data);
            } catch (err) {
                navigate('/', { state: { from: location }, replace: true });
            }
        }

        getUserInfo()
        return () => {
            isMounted = false;
            controller.abort();
        }
    }, [userName])

    const changeFirstName = e => setFirstName_(e.target.value)
    const changeLastName = e => setLastName_(e.target.value)
    const changeUserName = e => setUserName_(e.target.value)
    const changeEmail = e => setEmail_(e.target.value)
    const changeDescription = e => setDescription_(e.target.value)
    const changeConfirmUserName = e => setConfirmUserName(e.target.value)
    const changeConfirmPassword = e => setConfirmPassword(e.target.value)

    const openDeletionFields = () => {
        setConfirmUserName('')
        setConfirmPassword('')
        setDeleteSequence(true)
    }

    // async function updateProfile () {
    //     const { firstName, lastName, description, userName, email } = userInfo;
    //     await axios.put(`${backendURL}user/updateProfile/${userID}`, {
    //         firstName, lastName, description, userName, email
    //     })
    //     navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
    // }

    const updateProfile = async (e) => {
        e.preventDefault();
        const newInfo = {}
        if (firstName !== firstName_) newInfo['firstName'] = firstName_
        if (lastName !== lastName_) newInfo['lastName'] = lastName_
        if (userName !== userName_) newInfo['userName'] = userName_
        if (description !== description_) newInfo['description'] = description_
        if (email !== email_) newInfo['email'] = email_

        if (Object.keys(newInfo).length === 0) {
            alert('There are no updates to make.')
            return
        }
        const updateObj = {auth, newInfo, userID}
        try {
            await fetch (`${backendURL}user/updateProfile/${userID}`, {
                body: JSON.stringify(updateObj),
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            }).then(() => {
                newInfo?.firstName && setFirstName(newInfo.firstName)
                newInfo?.lastName && setLastName(newInfo.lastName)
                newInfo?.userName && setUserName(newInfo.userName)
                newInfo?.description && setDescription(newInfo.description)
                newInfo?.email && setEmail(newInfo.email)
                alert('Successfully updated your profile')
                navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
            })
        } catch (err) {
            alert('Update failed, please try again later')
        };
    }

    const deleteProfile = async (e) => {
        e.preventDefault();
		try {
			const response = await fetch (`${backendURL}user/deleteProfile/${userInfo._id}/${confirmPassword}`, {
				method: 'DELETE'
			})
            if (response.status === 401) {
                alert('Incorrect password, please try again')
                setDeleteSequence(false)
            } else if (response.status === 200) {
                alert('Successfully DELETED your profile')
                navigate('/')
            }
		} catch (err) {
			alert('DELETION failed, please try again later')
            setDeleteSequence(false)
		};
	}


  return (
        <div>
            <TopProfileBar userName={userName}/>
            <Container style={{textAlign:'center', padding: '16px'}}>
                <UploadProfilePicture />
                <Container align='center' style={{width:"80vw"}} sx={{ py: 2, }}>
                    <form style={{display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '450px'}}>
                        {!deleteSequence
                        ?   <>
                                <Grid container direction='row' spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant='h6'>{`${userInfo.firstName} ${userInfo.lastName}`} </Typography>
                                    </Grid>
                                </Grid>

                                <Grid id='editProfileFieldGrid' item style={{display: 'flex', gap: '10px', flexDirection: 'row', width: '100%'}} xs={12}>
                                    <Grid>
                                        <Typography style={{textAlign:'left'}} variant="body1">First Name</Typography>
                                        <TextField
                                            onChange={changeFirstName}
                                            placeholder={firstName}
                                            fullWidth
                                            required
                                            id="outlined-required"
                                        />
                                    </Grid>

                                    <Grid>
                                        <Typography style={{textAlign:'left'}} variant="body1">Last Name</Typography>
                                        <TextField 
                                            onChange={changeLastName}
                                            placeholder={lastName}
                                            fullWidth
                                            required
                                            id="outlined-required"
                                        />
                                    </Grid>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Bio</Typography>
                                    <TextField multiline fullWidth placeholder={description || 'Edit your bio'} onChange={changeDescription}></TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Username</Typography>
                                    <TextField id='userNameInput' fullWidth placeholder={userName} onChange={changeUserName}></TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Email</Typography>
                                    <TextField   fullWidth placeholder={email || 'Change your email'} onChange={changeEmail}></TextField>
                                </Grid>

                                <Button onClick={updateProfile} type='submit' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                                    Update Profile
                                </Button>

                                <Button onClick={openDeletionFields} type='submit' color='error' variant="contained" size="large" align='center' style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                                    Delete Profile
                                </Button>
                            </>
                        :   <>
                                <Typography style={{textAlign:'left'}} variant="body1" color='red'>
                                    Please confirm your username and password to permanently delete your account
                                </Typography>
                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Username</Typography>
                                    <TextField id='confirmUserNameInput' fullWidth placeholder={userName} onChange={changeConfirmUserName}></TextField>
                                </Grid>
                        
                                <Grid item xs={12}>
                                    <Typography style={{textAlign:'left'}} variant="body1">Password</Typography>
                                    <TextField id='confirmPasswordInput' type={showPassword ? "text" : "password"}
                                        placeholder='Enter your password' onChange={changeConfirmPassword} fullWidth
                                        InputProps={{endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )}}
                                    />
                                </Grid>
                        
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Button onClick={() => {setDeleteSequence(false)}} type='button' variant="contained" size="large" align='center'
                                            style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth>
                                            Cancel
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button onClick={deleteProfile} type='submit' color='error' variant="contained" size="large" align='center'
                                            style={{fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth
                                            disabled={!((userName === confirmUserName) && (confirmPassword.length))}>
                                            Delete
                                        </Button>
                                    </Grid>
                                </Grid>
                            </>
                        }
                    </form>
                </Container>
            </Container>
        </div>
    )
}

export default EditProfile