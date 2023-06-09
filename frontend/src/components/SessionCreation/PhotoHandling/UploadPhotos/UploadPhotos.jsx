import { useEffect } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import useStore from '../../../../store';

export default function UploadPhotos() {

	const {images, setImages} = useStore();

	useEffect(() => {
		setImages([])
	}, [])

	//Handle and convert image to base 64 
    const addImage = (e) =>{
        const files = Array.from(e.target.files);
        files.forEach(file => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onloadend = () => {
				setImages([...images, reader.result])
			}
		})
    }

	//Remove image from array
	function removeImage(e) {
    	const remove = images.filter((item, index) => index !== e);
    	setImages(remove);
  	}

	return (
		<div>
			<Box style={{marginBottom:'20px'}}>
				<Typography variant='h4' mt={2} mb={4} align='center' fontSize={21}>
					Upload <span style={{color:'#00aeef'}}> Photos: </span>
				</Typography>

				<Stack style={{ alignItems: 'center' }}>
					<form
						method='POST'
						encType='multipart/form-data'
						action='uploadfile'
						style={{display: 'flex', flexDirection: 'column'}}
						>
						<IconButton
							style={{ height: 150, width: 150, border: 'solid 1px'}}
							color='primary'
							aria-label='upload picture'
							component='label'>
							<input
							style={{zIndex:10}}
							hidden
							type="file"
							className="form-control"
							onChange={addImage}
						/>
							<PhotoCamera style={{fontSize:'95px'}}/>
						</IconButton>
					</form>
						{
							images.map((item, index) => {
								return (
									<div style={{position: 'relative', marginTop:'3%'}} key={item}>
										<img src={item} alt="" style={{width:'250px', height:'125px', objectFit:'cover'}}/>
										
										<div style={{position:'absolute', bottom: 0, right: 0}}>
											<IconButton type="button" color='error' onClick={() => removeImage(index)}>
												<DeleteIcon style={{height:25, width:25, background:'white', opacity:'.75', borderRadius:'50%', padding:'1px'}}/>
											</IconButton>
										</div>
									</div>
								)
							})
						}
				</Stack>
			</Box>
		</div>
	);
}
