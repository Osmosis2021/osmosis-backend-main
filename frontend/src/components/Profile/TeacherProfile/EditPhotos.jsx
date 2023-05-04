import { Box, Typography, Stack, IconButton, Grid, Skeleton } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import React, {useEffect, useState} from 'react'
import useStore from '../../../store';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://osmosis.herokuapp.com/' : 'http://localhost:8126/'


const EditPhotos = () => {

	const {images, setImages, userName} = useStore();
	// const [newImages, setNewImages] = useState({});
	const [teacherData, setTeacherData] = useState({});
	const [isLoading, setIsLoading] = useState(true);
	// const navigate = useNavigate();


	useEffect(() => {
		fetch(`${backendURL}course/getCourses/${userName}`)
		.then((res) => {
			return res.json();
		}).then((data) => {
			setTeacherData(...data);
			setIsLoading(false)
			console.log(data);
		}).catch((err) => {
			console.log('Error getting teacher info:\n', err);
		});
	}, [userName]);

	//Handle and convert image to base 64 
	const addImage = (e) => {
		e.preventDefault()
		const files = Array.from(e.target.files);
		files.forEach(file => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onloadend = () => {
				// setNewImages([...images, reader.result])
				setImages([...images, reader.result])
			}
		}) 
	}

	function removeImage(e) {
		const remove = images.filter((item, index) => index !== e);
		setImages(remove);
	}

	const removeAlreadyUploadedImage = async (image) => {
		// e.preventDefault();
		console.log(image)
		await axios.put(`${backendURL}course/deletePhoto/${teacherData._id}`, {
			image
		}).then(res => {
			alert('Uploaded Image was deleted?')
			// navigate('/editcourse')
		})
	}

	const addUploadedImage = async () => {
		// e.preventDefault();
		axios.put(`${backendURL}course/updatePhoto/${teacherData._id}`, {
			images
		}).then(res => {
			alert('Image(s) uploaded successfully?')
			// navigate('/editcourse')
		})
	}

	return (
		<div>
				<Box>
					<Typography variant='h6' mt={8} align='left' fontSize={21}>
						Edit your Photos:
					</Typography>

					<Stack style={{ alignItems: 'center' }}>
						
								
						<Grid container>
								{
									isLoading ? <Skeleton style={{height: 125, width: 150}}/> : teacherData?.images.map((image, index) => {
										return (
											<>
												<Grid item xs={6}>
													<img src={image.url} style={{height: 125, width: 150}} alt='photos uploaded'/>
													<div style={{position:'relative', bottom: 50, right: 0}}>
														<IconButton type="button" color='error' onClick={()=>removeAlreadyUploadedImage(image)}>
															<DeleteIcon style={{height:25, width:25, background:'white', opacity:'.75', borderRadius:'50%', padding:'1px'}}/>
														</IconButton>
													</div>
												</Grid>
											</>
										)
									})  
								}
							<Grid item xs={6}>
								<form
									method='POST'
									encType='multipart/form-data'
									action='uploadfile'
									style={{display: 'flex', flexDirection: 'column'}}
									>
									<IconButton
										style={{ height: 150, width: 150 }}
										color='primary'
										aria-label='upload picture'
										component='label'>
										<input
										style={{zIndex:10}}
										size='large'
										hidden
										type="file"
										className="form-control"
										onChange={addImage}
									/>
										<PhotoCamera />
									</IconButton>

								</form>
							</Grid>
						</Grid>


							{
								images.map((item, index) => {
								return (
									<div style={{position: 'relative'}} key={item}>
										<img src={item} alt="" style={{width:'250px', height:'125px', objectFit:'cover'}}/>
										
										<div style={{position:'relative', bottom: 50, right: 0}}>
											<IconButton type="button" color='error' onClick={() => removeImage(index)}>
												<DeleteIcon style={{zIndex:10, height:25, width:25, background:'white', opacity:'.75', borderRadius:'50%', padding:'1px'}}/>
											</IconButton>
										</div>
									</div>
								)}
							)}

							<IconButton type='button' onClick={addUploadedImage}>
								<CheckCircleIcon/>
							</IconButton>
					</Stack>
				</Box>
		</div>
  )
}

export default EditPhotos