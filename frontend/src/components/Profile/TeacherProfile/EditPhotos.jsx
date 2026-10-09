import React, { useState } from 'react'
import { Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Link } from 'react-router-dom';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import { useConfirm, useToast } from '../../../ui/feedback';

const MAX_FILE_MB = 10;
const MAX_PHOTOS = 12;

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve(reader.result);
	reader.onerror = reject;
	reader.readAsDataURL(file);
});

const tileSx = {
	position: 'relative',
	aspectRatio: '4 / 3',
	borderRadius: '12px',
	overflow: 'hidden',
	bgcolor: 'background.paper',
};

const removeButtonSx = {
	position: 'absolute',
	top: 6,
	right: 6,
	bgcolor: 'rgba(255,255,255,0.9)',
	'&:hover': { bgcolor: 'white' },
};

/**
 * Photos of one studio time: remove existing ones, pick and upload new ones.
 *
 * @param {string} courseId
 * @param {{ _id: string, url: string }[]} images  photos already on the listing
 * @param {(images) => void} onChange              called with the updated list after a change
 */
const EditPhotos = ({ courseId, images = [], onChange }) => {
	const axiosPrivate = useAxiosPrivate();
	const confirm = useConfirm();
	const toast = useToast();
	const [pending, setPending] = useState([]); // data URLs chosen but not uploaded yet
	const [isUploading, setIsUploading] = useState(false);

	if (!courseId) {
		return (
			<Typography variant="body2" color="text.secondary">
				Open one of your studio times from <Link to="/">your profile</Link> to edit its photos.
			</Typography>
		);
	}

	const addFiles = async (event) => {
		const files = Array.from(event.target.files || []);
		event.target.value = ''; // allow picking the same file again
		const tooBig = files.filter((file) => file.size > MAX_FILE_MB * 1024 * 1024);
		const usable = files.filter((file) => file.type.startsWith('image/') && file.size <= MAX_FILE_MB * 1024 * 1024);
		if (tooBig.length) toast.error(`Photos must be under ${MAX_FILE_MB} MB. ${tooBig.length === 1 ? 'One photo was' : `${tooBig.length} photos were`} skipped.`);
		const room = MAX_PHOTOS - images.length - pending.length;
		if (usable.length > room) toast.info(`A listing can have up to ${MAX_PHOTOS} photos.`);
		const dataUrls = await Promise.all(usable.slice(0, Math.max(room, 0)).map(readAsDataUrl));
		setPending((prev) => [...prev, ...dataUrls]);
	};

	const upload = async () => {
		setIsUploading(true);
		try {
			const { data } = await axiosPrivate.put(`course/updatePhoto/${courseId}`, { images: pending });
			onChange?.(data?.photoUpdate?.images || images);
			toast.success(pending.length === 1 ? 'Photo added to your listing.' : `${pending.length} photos added to your listing.`);
			setPending([]);
		} catch (err) {
			console.error('Error uploading photos:', err);
			toast.error("We couldn't upload your photos. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	const removeExisting = async (image) => {
		const removed = await confirm({
			title: 'Remove this photo?',
			description: 'It will no longer appear on your listing. You can upload it again later.',
			confirmLabel: 'Remove photo',
			destructive: true,
			errorMessage: "We couldn't remove the photo. Please try again.",
			onConfirm: () => axiosPrivate.put(`course/deletePhoto/${courseId}`, { image }),
		});
		if (removed) {
			onChange?.(images.filter((item) => item._id !== image._id));
			toast.success('Photo removed.');
		}
	};

	return (
		<Stack spacing={2}>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
				{images.map((image, index) => (
					<Box key={image._id || image.url} sx={tileSx}>
						<Box component="img" src={image.url} alt={`Listing photo ${index + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						<IconButton size="small" sx={removeButtonSx} aria-label={`Remove photo ${index + 1}`} onClick={() => removeExisting(image)}>
							<DeleteOutlineIcon fontSize="small" />
						</IconButton>
					</Box>
				))}
				{pending.map((dataUrl, index) => (
					<Box key={dataUrl.slice(-32) + index} sx={{ ...tileSx, outline: '2px dashed', outlineColor: 'primary.main', outlineOffset: -2 }}>
						<Box component="img" src={dataUrl} alt={`New photo ${index + 1}, not uploaded yet`} sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
						<IconButton size="small" sx={removeButtonSx} aria-label={`Discard new photo ${index + 1}`} disabled={isUploading}
							onClick={() => setPending((prev) => prev.filter((_, i) => i !== index))}>
							<CloseIcon fontSize="small" />
						</IconButton>
					</Box>
				))}
				{images.length + pending.length < MAX_PHOTOS && (
					<Button
						component="label"
						disabled={isUploading}
						sx={{ ...tileSx, border: '2px dashed', borderColor: 'divider', flexDirection: 'column', textTransform: 'none', color: 'text.secondary', gap: 0.5 }}
					>
						<AddPhotoAlternateIcon />
						Add photos
						<input hidden type="file" accept="image/*" multiple onChange={addFiles} />
					</Button>
				)}
			</Box>
			{images.length === 0 && pending.length === 0 && (
				<Typography variant="body2" color="text.secondary">Listings with 3 or more photos get far more bookings.</Typography>
			)}
			{pending.length > 0 && (
				<Button
					variant="contained"
					onClick={upload}
					disabled={isUploading}
					sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}
				>
					{isUploading
						? <CircularProgress size={20} color="inherit" aria-label="Uploading photos" />
						: `Upload ${pending.length} ${pending.length === 1 ? 'photo' : 'photos'}`}
				</Button>
			)}
		</Stack>
	)
}

export default EditPhotos
