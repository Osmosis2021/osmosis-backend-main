import { Avatar, Box, CircularProgress, IconButton } from '@mui/material';
import { useState } from 'react';
import useStore from '../../store';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useToast } from '../../ui/feedback';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const MAX_FILE_MB = 10;

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

/**
 * Profile photo with a camera button. Picking a photo uploads it straight away;
 * the new photo shows immediately and rolls back if the upload fails.
 *
 * @param {string} imageUrl                    the current photo
 * @param {(profileImage) => void} onUploaded  called with { public_id, url } after a successful upload
 */
export default function UploadProfilePicture({ imageUrl, onUploaded }) {
    const { userID } = useStore();
    const axiosPrivate = useAxiosPrivate();
    const toast = useToast();
    const [preview, setPreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleImage = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = ''; // allow picking the same file again
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file.');
            return;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            toast.error(`Photos must be under ${MAX_FILE_MB} MB.`);
            return;
        }

        setIsUploading(true);
        try {
            const image = await readAsDataUrl(file);
            setPreview(image);
            const { data } = await axiosPrivate.put(`user/updateProfileImage/${userID}`, { image });
            onUploaded?.(data?.userUpdate?.profileImage);
            toast.success('Profile photo updated.');
        } catch (err) {
            console.error('Error uploading profile photo:', err);
            toast.error("We couldn't update your profile photo. Please try again.");
        } finally {
            setPreview('');
            setIsUploading(false);
        }
    };

    return (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar src={preview || imageUrl} alt="Your profile photo" sx={{ width: 100, height: 100, opacity: isUploading ? 0.6 : 1 }} />
            {isUploading && (
                <CircularProgress
                    size={36}
                    aria-label="Uploading profile photo"
                    sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-18px', ml: '-18px' }}
                />
            )}
            <IconButton
                color='primary'
                aria-label={imageUrl ? 'Change profile photo' : 'Add profile photo'}
                component='label'
                disabled={isUploading}
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
                    },
                    '&:focus-within': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                }}
            >
                <input hidden type='file' accept='image/*' onChange={handleImage} />
                <CameraAltIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            </IconButton>
        </Box>
    );
}
