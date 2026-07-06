import React, { useEffect } from 'react';
import {
	Box,
	IconButton,
	Stack,
	Typography,
	Grid,
	Container,
	Fade
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import useStore from '../../../../store';
import { PremiumSectionHeader } from '../../../../ui/PremiumSectionHeader';
import { PremiumCard } from '../../../../ui/PremiumCard';

export default function UploadPhotos(props) {
	const { images, setImages } = useStore();

	useEffect(() => {
		// Validation is handled via the store (images array)
		props.setIsNextDisabled(images.length === 0);
	}, [images, props]);

	//Handle and convert image to base 64 
	const addImage = (e) => {
		const files = Array.from(e.target.files);
		const currentImages = Array.isArray(images) ? images : [];
		let newImages = [...currentImages];

		let counter = 0;
		files.forEach(file => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onloadend = () => {
				newImages.push(reader.result);
				counter++;
				if (counter === files.length) {
					setImages(newImages);
				}
			};
		});
	};

	//Remove image from array
	function removeImage(indexToRemove) {
		const currentImages = Array.isArray(images) ? images : [];
		const updatedImages = currentImages.filter((_, index) => index !== indexToRemove);
		setImages(updatedImages);
	}

	return (
		<Box sx={{ py: 4, pb: 12 }}>
			<PremiumSectionHeader
				title="Studio Photos"
				subtitle="Show guests what the space and experience feel like."
				align="center"
			/>

			<Container maxWidth="md" sx={{ mt: 6 }}>
				<Stack spacing={4}>

					{/* Upload Dropzone Area */}
					<PremiumCard nohover sx={{
						p: 0,
						border: '2px dashed rgba(0,0,0,0.1)',
						bgcolor: 'rgba(0,0,0,0.02)',
						textAlign: 'center',
						borderRadius: 4,
						position: 'relative',
						transition: 'all 0.2s ease',
						'&:hover': {
							borderColor: 'rgba(0,0,0,0.2)',
							bgcolor: 'rgba(0,0,0,0.03)'
						}
					}}>
						<Box
							component="label"
							sx={{
								py: 8,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								cursor: 'pointer',
								width: '100%'
							}}
						>
							<input
								hidden
								type="file"
								accept="image/*"
								multiple
								onChange={addImage}
							/>
							<AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
							<Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
								Tap to upload photos
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
								High-quality JPG or PNG preferred
							</Typography>
						</Box>
					</PremiumCard>

					{/* Cover Image Reassurance */}
					{(Array.isArray(images) && images.length > 0) && (
						<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', fontStyle: 'italic' }}>
							The first photo will appear as your cover image.
						</Typography>
					)}

					{/* Image Gallery Grid */}
					<Grid container spacing={2}>
						{(Array.isArray(images) ? images : []).map((item, index) => (
							<Grid item xs={6} sm={4} md={3} key={`upload-${index}`}>
								<Fade in={true} timeout={400}>
									<Box sx={{
										position: 'relative',
										borderRadius: 3,
										overflow: 'hidden',
										aspectRatio: '4/3',
										border: '1px solid rgba(0,0,0,0.05)',
										boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
										'&:hover .delete-btn': { opacity: 1 }
									}}>
										<img
											src={item}
											alt={`Studio ${index}`}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>

										{/* Cover Label */}
										{index === 0 && (
											<Box sx={{
												position: 'absolute',
												top: 8,
												left: 8,
												bgcolor: 'text.primary',
												color: 'background.paper',
												px: 1,
												py: 0.25,
												borderRadius: 1,
												fontSize: '0.65rem',
												fontWeight: 800,
												letterSpacing: 0.5,
												textTransform: 'uppercase'
											}}>
												Cover
											</Box>
										)}

										{/* Delete Action */}
										<IconButton
											className="delete-btn"
											size="small"
											onClick={() => removeImage(index)}
											sx={{
												position: 'absolute',
												top: 4,
												right: 4,
												bgcolor: 'rgba(255,255,255,0.8)',
												color: 'error.main',
												opacity: { xs: 1, md: 0 },
												transition: 'opacity 0.2s',
												'&:hover': { bgcolor: 'background.paper' }
											}}
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</Box>
								</Fade>
							</Grid>
						))}
					</Grid>
				</Stack>
			</Container>
		</Box>
	);
}
