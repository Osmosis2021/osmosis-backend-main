import { Box, Typography, Stack, IconButton, Grid, Skeleton } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useEffect, useState } from 'react'
import useStore from '../../../store';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import { useConfirm, useToast } from '../../../ui/feedback';


const EditPhotos = () => {
	const { images, setImages, userName } = useStore();
	const axiosPrivate = useAxiosPrivate();
	const confirm = useConfirm();
	const toast = useToast();
	const [teacherData, setTeacherData] = useState({});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const currentBackendURL = useStore.getState().backendURL;
		fetch(`${currentBackendURL}course/getCourses/${userName}`)
			.then((res) => {
				return res.json();
			}).then((data) => {
				setTeacherData(...data);
				setIsLoading(false)
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
		const removed = await confirm({
			title: 'Remove this photo?',
			description: 'It will no longer appear on your listing. You can upload it again later.',
			confirmLabel: 'Remove photo',
			destructive: true,
			errorMessage: "We couldn't remove the photo. Please try again.",
			onConfirm: () => axiosPrivate.put(`course/deletePhoto/${teacherData._id}`, { image }),
		})
		if (removed) {
			setTeacherData(prev => ({ ...prev, images: (prev.images || []).filter(item => item._id !== image._id) }))
			toast.success('Photo removed.')
		}
	}

	const addUploadedImage = async () => {
		if (!images.length) {
			toast.info('Choose a photo first.')
			return
		}
		try {
			const { data } = await axiosPrivate.put(`course/updatePhoto/${teacherData._id}`, { images })
			if (data?.photoUpdate?.images) {
				setTeacherData(prev => ({ ...prev, images: data.photoUpdate.images }))
			}
			setImages([])
			toast.success(images.length === 1 ? 'Photo uploaded.' : 'Photos uploaded.')
		} catch (err) {
			console.error('Error uploading photos:', err)
			toast.error("We couldn't upload your photos. Please try again.")
		}
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
							isLoading ? <Skeleton style={{ height: 125, width: 150 }} /> : teacherData?.images.map((image, index) => {
								return (
									<>
										<Grid item xs={6}>
											<img src={image.url} style={{ height: 125, width: 150 }} alt='photos uploaded' />
											<div style={{ position: 'relative', bottom: 50, right: 0 }}>
												<IconButton type="button" color='error' aria-label='Remove this photo' onClick={() => removeAlreadyUploadedImage(image)}>
													<DeleteIcon style={{ height: 25, width: 25, background: 'white', opacity: '.75', borderRadius: '50%', padding: '1px' }} />
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
								style={{ display: 'flex', flexDirection: 'column' }}
							>
								<IconButton
									style={{ height: 150, width: 150 }}
									color='primary'
									aria-label='upload picture'
									component='label'>
									<input
										style={{ zIndex: 10 }}
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
								<div style={{ position: 'relative' }} key={item}>
									<img src={item} alt="" style={{ width: '250px', height: '125px', objectFit: 'cover' }} />

									<div style={{ position: 'relative', bottom: 50, right: 0 }}>
										<IconButton type="button" color='error' aria-label='Remove this photo before uploading' onClick={() => removeImage(index)}>
											<DeleteIcon style={{ zIndex: 10, height: 25, width: 25, background: 'white', opacity: '.75', borderRadius: '50%', padding: '1px' }} />
										</IconButton>
									</div>
								</div>
							)
						}
						)}

					<IconButton type='button' aria-label='Upload selected photos' onClick={addUploadedImage}>
						<CheckCircleIcon />
					</IconButton>
				</Stack>
			</Box>
		</div>
	)
}

export default EditPhotos