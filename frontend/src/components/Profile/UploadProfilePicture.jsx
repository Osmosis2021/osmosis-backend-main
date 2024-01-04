import { Button, IconButton, Stack } from '@mui/material';
import useStore from '../../store';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Prof from './Prof';
import { axiosPrivate } from '../../actions/axios';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
// import PhotoCamera from '@mui/icons-material/PhotoCamera';
// import TopNavBar from '../../../TopNavBar/TopNavBar';
// import { useParams } from 'react-router-dom';
// import useStore from '../../../../store';


export default function UploadProfilePicture() {
 
	const [image, setImage] = useState('');
	const {userID, userName, backendURL} = useStore()
	const [userInfo, setUserInfo] = useState('');
	// const User = useParams();

	// HAS TO BE A BETTER WAY, WE MAKE THIS CALL IN EDIT PROFILE TOO, JUST TRYING TO GET AND DISPLAY THEIR ORIGINAL PROFILE IMAGE 

	useEffect(() => {
		fetch(`${backendURL}user/getUserInfo/${userName}`)
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
			axiosPrivate.put(`${backendURL}user/updateProfileImage/${userID}`, { image }, {withCredentials: true}
			).then(res => {
				alert('Image updated')
		})
    }
	
	return (
		<div>
			<Stack style={{ alignItems: 'center' }}>
				
				
				<form
					onSubmit={uploadFile}
					method='POST'
					encType='multipart/form-data'
					action=''
					style={{display: 'flex', flexDirection: 'column'}}>

						<IconButton
							// style={{ height: 100, width: 100, border:'#00aeef solid 1px' }}
							color='primary'
							variant='outlined'
							aria-label='upload picture'
							component='label'>
								<input
									hidden
									type='file'
									multiple
									accept='image/*'
									onChange={handleImage}
								/>
								<CameraAltIcon style={{ position:'absolute', top:'30%', zIndex:'10', fontSize:'40px' }} />
				<Prof avatar={image || userInfo?.profileImage?.url}/>
							{/* Change Profile */}
						</IconButton>

						<Button variant='contained' type="submit" style={{color:'white'}}>Confirm Photo</Button>

				</form>

			</Stack>
		</div>
	);
}
