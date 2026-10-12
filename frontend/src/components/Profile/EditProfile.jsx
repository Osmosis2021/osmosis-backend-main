import {
    Button,
    Container,
    Stack,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    Box,
    Card,
    CardContent,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import PaymentIcon from '@mui/icons-material/Payment';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';

import React, { useState, useEffect } from 'react';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useToast } from '../../ui/feedback';
import { Link, useNavigate } from "react-router-dom";
import UploadProfilePicture from './UploadProfilePicture';
import useStore from '../../store';
import useAuth from '../../hooks/useAuth';
import useLogout from '../../hooks/useLogout';
import useSession from '../../hooks/useSession';
import TopNavBar from '../TopNavBar/TopNavBar';
import useKeyboard from '../../hooks/useKeyboard';


function EditProfile() {
    const { auth, setAuth, persist } = useAuth();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const logout = useLogout();
    const startSession = useSession();

    const {
        userID, userName, isTeacher, firstName, setFirstName, lastName, setLastName,
        email, setEmail, description, setDescription, setProfileImage
    } = useStore();

    const [userInfo, setUserInfo] = useState({});
    const [firstName_, setFirstName_] = useState(firstName || '');
    const [lastName_, setLastName_] = useState(lastName || '');
    const [userName_, setUserName_] = useState(userName || '');
    const [email_, setEmail_] = useState(email || '');
    const [description_, setDescription_] = useState(description || '');
    const manageKeyboard = useKeyboard();
    const [deleteSequence, setDeleteSequence] = useState(false);
    const [confirmUserName, setConfirmUserName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { showToast } = useToast();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        manageKeyboard('editProfileFieldGrid'); // hide bottomnav when mobile keyboard showing
    }, [manageKeyboard]);

    useEffect(() => {
        if (!userName) return undefined;
        const controller = new AbortController();
        axiosPrivate.get(`user/getUserInfo/${userName}`, { signal: controller.signal })
            .then(({ data }) => {
                setUserInfo(data);
                // Fill in anything the store didn't have, without overwriting what the user typed.
                setFirstName_((prev) => prev || data.firstName || '');
                setLastName_((prev) => prev || data.lastName || '');
                setUserName_((prev) => prev || data.userName || '');
                setEmail_((prev) => prev || data.email || '');
                setDescription_((prev) => prev || data.description || '');
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                console.error('Error loading profile:', err);
                showToast("We couldn't load your profile. Please refresh the page.", 'error');
            });
        return () => controller.abort();
    }, [userName, axiosPrivate, showToast]);

    const changeFirstName = e => setFirstName_(e.target.value);
    const changeLastName = e => setLastName_(e.target.value);
    const changeUserName = e => setUserName_(e.target.value);
    const changeEmail = e => setEmail_(e.target.value);
    const changeDescription = e => setDescription_(e.target.value);
    const changeConfirmUserName = e => setConfirmUserName(e.target.value);
    const changeConfirmPassword = e => setConfirmPassword(e.target.value);

    const openDeletionFields = () => {
        setConfirmUserName('');
        setConfirmPassword('');
        setDeleteSequence(true);
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        const next = {
            firstName: firstName_.trim(),
            lastName: lastName_.trim(),
            userName: userName_.trim(),
            email: email_.trim(),
            description: description_.trim(),
        };
        const current = { firstName, lastName, userName, email, description: description || '' };
        const newInfo = {};
        Object.keys(next).forEach((field) => {
            // The bio may be cleared; the other fields can't be empty.
            if (next[field] === current[field]) return;
            if (field !== 'description' && !next[field]) return;
            newInfo[field] = next[field];
        });

        if (Object.keys(newInfo).length === 0) {
            showToast('Nothing has changed yet.', 'info');
            return;
        }

        setIsSaving(true);
        try {
            const { data } = await axiosPrivate.put(`user/updateProfile/${userID}`, { newInfo });
            const user = data?.user || {};
            if (data?.accessToken) {
                // Username changed: the server issued new tokens tied to the new name.
                startSession({ ...user, accessToken: data.accessToken, roles: auth.roles }, { persist });
            } else {
                if (newInfo.firstName !== undefined) setFirstName(user.firstName ?? newInfo.firstName);
                if (newInfo.lastName !== undefined) setLastName(user.lastName ?? newInfo.lastName);
                if (newInfo.description !== undefined) setDescription(user.description ?? newInfo.description);
                if (newInfo.email !== undefined) setEmail(user.email ?? newInfo.email);
            }
            setFirstName_(next.firstName);
            setLastName_(next.lastName);
            setUserName_(next.userName);
            setEmail_(next.email);
            setDescription_(next.description);
            if (newInfo.email) {
                // Same as Settings: a new email has to be verified before carrying on.
                setAuth((prev) => ({ ...prev, isEmailVerified: false, email: user.email || newInfo.email }));
                showToast('Profile saved. Please verify your new email.', 'warning');
                navigate('/verify-email');
                return;
            }
            showToast('Profile saved.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || "We couldn't save your changes. Please try again.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteProfile = async (e) => {
        e.preventDefault();
        try {
            await axiosPrivate.delete(`user/deleteProfile/${userInfo._id}`, { data: { password: confirmPassword } });
            showToast('Successfully DELETED your profile', 'success');
            setTimeout(() => {
                logout("/");
            }, 1500);
        } catch (err) {
            if (err.response?.status === 401) {
                showToast('Incorrect password, please try again', 'error');
            } else {
                showToast('DELETION failed, please try again later', 'error');
            }
            setDeleteSequence(false);
        }
    };

    const SettingOptions = [
        { name: 'Account', icon: <AccountCircleIcon />, key: 0, link: '/edit' },
        { name: 'Privacy', icon: <PrivacyTipIcon />, key: 1, link: '/privacy' },
        { name: 'Orders and Payments', icon: <PaymentIcon />, key: 2, link: '/ordersandpayments' },
        { name: 'Security', icon: <LockIcon />, key: 3, link: '/edit' }, // fallback
        { name: 'Notifications', icon: <NotificationsIcon />, key: 4, link: '/edit' }, // fallback
        { name: 'About', icon: <InfoIcon />, key: 5, link: '/edit' }, // fallback
        { name: 'Help', icon: <HelpIcon />, key: 6, link: '/edit' }, // fallback
        { name: 'Logout', icon: <LogoutIcon />, key: 7, link: '/', func: () => logout("/") }
    ];

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <TopNavBar
                title="Edit Profile"
                back={isTeacher ? `/teachers/${userName}` : `/students/${userName}`}
                rightAction={
                    <IconButton onClick={() => setIsDrawerOpen(true)} color="inherit" sx={{ p: 1 }}>
                        <MenuIcon sx={{ fontSize: 24, color: 'text.primary' }} />
                    </IconButton>
                }
            />

            <Container maxWidth="sm" sx={{ mt: 4, px: 2 }}>
                <Stack spacing={4}>
                    {/* Profile Picture Card */}
                    <Card variant="outlined">
                        <CardContent sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <UploadProfilePicture
                                imageUrl={userInfo?.profileImage?.url}
                                onUploaded={(profileImage) => {
                                    setUserInfo((prev) => ({ ...prev, profileImage }));
                                    setProfileImage(profileImage?.url || '');
                                }}
                            />
                            <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
                                {firstName_ || userInfo.firstName} {lastName_ || userInfo.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                @{userName_ || userInfo.userName}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Edit Form */}
                    <Box component="form" onSubmit={updateProfile} id="editProfileFieldGrid">
                        <Stack spacing={3}>
                            {/* Personal Info Card */}
                            <Card variant="outlined">
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Personal Information
                                    </Typography>
                                    <Divider sx={{ mb: 2.5 }} />

                                    <Stack spacing={2.5}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>First Name</Typography>
                                                <TextField
                                                    onChange={changeFirstName}
                                                    placeholder={firstName || 'Enter first name'}
                                                    value={firstName_}
                                                    fullWidth
                                                    required
                                                />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Last Name</Typography>
                                                <TextField
                                                    onChange={changeLastName}
                                                    placeholder={lastName || 'Enter last name'}
                                                    value={lastName_}
                                                    fullWidth
                                                    required
                                                />
                                            </Box>
                                        </Stack>

                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Bio</Typography>
                                            <TextField
                                                multiline
                                                rows={3}
                                                fullWidth
                                                placeholder={description || 'Tell students about your studio/skills...'}
                                                value={description_}
                                                onChange={changeDescription}
                                            />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Account Credentials Card */}
                            <Card variant="outlined">
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                        Account Details
                                    </Typography>
                                    <Divider sx={{ mb: 2.5 }} />

                                    <Stack spacing={2.5}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Username</Typography>
                                            <TextField
                                                id='userNameInput'
                                                fullWidth
                                                placeholder={userName}
                                                value={userName_}
                                                onChange={changeUserName}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Email Address</Typography>
                                            <TextField
                                                type="email"
                                                fullWidth
                                                placeholder={email || 'your-email@domain.com'}
                                                value={email_}
                                                onChange={changeEmail}
                                            />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Primary Action Buttons */}
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<SaveRoundedIcon />}
                                sx={{ py: 1.5, fontSize: '1rem', borderRadius: '12px' }}
                                fullWidth
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving…' : 'Save changes'}
                            </Button>

                            {/* Danger Zone Card */}
                            <Card variant="outlined" sx={{ borderColor: 'error.light', bgcolor: 'rgba(239, 68, 68, 0.02)' }}>
                                <CardContent sx={{ p: 3 }}>
                                    {!deleteSequence ? (
                                        <Stack spacing={2} alignItems="flex-start">
                                            <Box>
                                                <Typography variant="subtitle1" color="error" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    Danger Zone
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    Permanently delete your account and all associated data. This action is irreversible.
                                                </Typography>
                                            </Box>
                                            <Button
                                                onClick={openDeletionFields}
                                                color='error'
                                                variant="outlined"
                                                startIcon={<DeleteForeverRoundedIcon />}
                                                sx={{ mt: 1, borderRadius: '8px', textTransform: 'none' }}
                                            >
                                                Delete My Account
                                            </Button>
                                        </Stack>
                                    ) : (
                                        <Stack spacing={2.5}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <WarningAmberRoundedIcon color="error" />
                                                <Box>
                                                    <Typography variant="subtitle1" color="error" sx={{ fontWeight: 700 }}>
                                                        Are you absolutely sure?
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Please confirm your credentials to permanently delete your account.
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} color="error">Confirm Username</Typography>
                                                <TextField
                                                    id='confirmUserNameInput'
                                                    fullWidth
                                                    placeholder={userName}
                                                    value={confirmUserName}
                                                    onChange={changeConfirmUserName}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} color="error">Enter Password</Typography>
                                                <TextField
                                                    id='confirmPasswordInput'
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder='Enter your account password'
                                                    value={confirmPassword}
                                                    onChange={changeConfirmPassword}
                                                    fullWidth
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />
                                            </Box>

                                            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                                                <Button
                                                    onClick={() => setDeleteSequence(false)}
                                                    type='button'
                                                    variant="outlined"
                                                    sx={{ flex: 1, borderRadius: '8px' }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={deleteProfile}
                                                    type='submit'
                                                    color='error'
                                                    variant="contained"
                                                    sx={{ flex: 1, borderRadius: '8px' }}
                                                    disabled={!((userName === confirmUserName) && (confirmPassword.length > 0))}
                                                >
                                                    Confirm Delete
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        </Stack>
                    </Box>
                </Stack>
            </Container>

            {/* Modern Settings Drawer */}
            <Drawer
                anchor='bottom'
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        maxHeight: '80vh',
                        bgcolor: 'background.paper',
                        px: 1,
                        py: 2
                    }
                }}
            >
                <Box sx={{ width: '100%', maxWidth: '480px', mx: 'auto' }} role='presentation'>
                    {/* Drawer Grab Handle */}
                    <Box sx={{ width: '40px', height: '4px', bgcolor: 'divider', borderRadius: '2px', mx: 'auto', mb: 2 }} />
                    <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 700, mb: 1, fontFamily: 'Outfit' }}>
                        Account Settings
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <List sx={{ width: '100%', px: 1 }}>
                        {SettingOptions.map(setting => (
                            <ListItem key={setting.key} disablePadding>
                                <ListItemButton
                                    component={setting.func ? 'button' : Link}
                                    to={setting.link}
                                    onClick={() => {
                                        setIsDrawerOpen(false);
                                        if (setting.func) setting.func();
                                    }}
                                    sx={{
                                        borderRadius: '12px',
                                        mb: 0.5,
                                        '&:hover': {
                                            bgcolor: 'rgba(10, 10, 10, 0.04)',
                                            '& .MuiListItemIcon-root': { color: 'primary.main' }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 44, color: 'text.secondary', transition: 'color 0.2s' }}>
                                        {setting.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={setting.name}
                                        primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.95rem' } }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

        </Box>
    );
}

export default EditProfile;