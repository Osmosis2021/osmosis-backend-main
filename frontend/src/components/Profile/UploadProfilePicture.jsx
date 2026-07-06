import { Button, IconButton, Stack, Box } from '@mui/material';
import useStore from '../../store';
import { useState, useEffect } from 'react';
import Prof from './Prof';
import { axiosPrivate } from '../../actions/axios';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
// import PhotoCamera from '@mui/icons-material/PhotoCamera';
// import TopNavBar from '../../../TopNavBar/TopNavBar';
// import { useParams } from 'react-router-dom';
// import useStore from '../../../../store';


export default function UploadProfilePicture(props) {

    const [image, setImage] = useState('');
    const { userID, userName, backendURL } = useStore()
    const [userInfo, setUserInfo] = useState('');
    // const User = useParams();

    // HAS TO BE A BETTER WAY, WE MAKE THIS CALL IN EDIT PROFILE TOO, JUST TRYING TO GET AND DISPLAY THEIR ORIGINAL PROFILE IMAGE 

    useEffect(() => {
        const currentBackendURL = useStore.getState().backendURL;
        fetch(`${currentBackendURL}user/getUserInfo/${userName}`)
            .then((res) => {
                return res.json();
            }).then((data) => {
                setUserInfo(data);
            }).catch((err) => {
                console.log('Error getting users info:\n', err);
            });
    }, [userName]);

    const handleImage = (e) => {
        const file = e.target.files[0];
        setFileToBase(file);
    }

    const setFileToBase = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setImage(reader.result);
        }
    }

    const uploadFile = async (e) => {
        e.preventDefault();
        if (!image) return;

        axiosPrivate.put(`${backendURL}user/updateProfileImage/${userID}`, { image }, { withCredentials: true }
        ).then(res => {
            if (props.showToast) {
                props.showToast('Profile picture updated successfully!', 'success');
            } else {
                alert('Image updated');
            }
            // Clear base64 selected image state once confirmed
            setImage('');
        }).catch(err => {
            if (props.showToast) {
                props.showToast('Failed to update profile picture.', 'error');
            } else {
                alert('Upload failed');
            }
        });
    }

    return (
        <div>
            <Stack sx={{ alignItems: 'center' }}>
                <form
                    onSubmit={uploadFile}
                    method='POST'
                    encType='multipart/form-data'
                    action=''
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Prof avatar={image || userInfo?.profileImage?.url} />

                        <IconButton
                            color='primary'
                            aria-label='upload picture'
                            component='label'
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                bgcolor: 'white',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                width: 36,
                                height: 36,
                                '&:hover': {
                                    bgcolor: '#F8FAFC',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }
                            }}
                        >
                            <input
                                hidden
                                type='file'
                                accept='image/*'
                                onChange={handleImage}
                            />
                            <CameraAltIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        </IconButton>
                    </Box>

                    {image && (
                        <Button
                            variant='contained'
                            type="submit"
                            size="small"
                            sx={{
                                borderRadius: '20px',
                                px: 3,
                                py: 0.75,
                                fontSize: '0.85rem',
                                color: 'white',
                                animation: 'fadeIn 0.2s ease-out'
                            }}
                        >
                            Confirm Photo
                        </Button>
                    )}
                </form>
            </Stack>
        </div>
    );
}
