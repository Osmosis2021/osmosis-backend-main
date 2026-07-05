import React from 'react';
import { Box, Stack, IconButton, Typography, Tooltip, Avatar } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import useStore from '../../store';
import studioTimeIcon from '../../assets/studio_time_icon.png';


const NavItem = ({ to, icon, label, isActive }) => (
    <Tooltip title={label} placement="right" arrow>
        <Box
            component={Link}
            to={to}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? 'primary.main' : 'text.secondary',
                width: 68,
                height: 68,
                borderRadius: '12px',
                bgcolor: isActive ? 'rgba(10, 10, 10, 0.06)' : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    bgcolor: isActive ? 'rgba(10, 10, 10, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                    color: 'primary.main',
                    transform: 'translateY(-1px)'
                },
                '&:active': {
                    transform: 'scale(0.95)'
                }
            }}
        >
            {React.cloneElement(icon, { sx: { fontSize: 24 } })}
            <Typography variant="caption" sx={{ mt: 0.75, fontWeight: 500, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                {label}
            </Typography>
        </Box>
    </Tooltip>
);

const SideRail = () => {
    const location = useLocation();
    const { userID, userName, platform, isTeacher } = useStore();

    const profileLink = userName ? `/${isTeacher ? 'teachers' : 'students'}/${userName}` : '/sign-up';

    const navItems = [
        { to: '/', icon: <HomeIcon />, label: 'Home' },
        { to: '/explore', icon: <SearchIcon />, label: 'Explore' },
        { to: '/chat', icon: <ChatBubbleOutlineIcon />, label: 'Messages' },
        {
            to: profileLink,
            icon: <PersonOutlineIcon />,
            label: 'Profile'
        }
    ];

    return (
        <Box
            sx={{
                width: 96,
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                borderRight: '1px solid #E5E5E5',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                zIndex: 1200
            }}
        >
            {/* Logo area */}
            <Box sx={{ mb: 6 }}>
                <Avatar
                    src={studioTimeIcon}
                    variant="rounded"
                    sx={{ width: 44, height: 44, borderRadius: '10px' }}
                />
            </Box>

            {/* Nav Items */}
            <Stack spacing={2.5} sx={{ mb: 'auto' }}>
                {navItems.map((item) => (
                    <NavItem
                        key={item.label}
                        {...item}
                        isActive={location.pathname === item.to || (location.pathname.startsWith(item.to) && item.to !== '/')}
                    />
                ))}
            </Stack>

            {/* Bottom Actions */}
            <Stack spacing={2}>
                <NavItem
                    to="/settings"
                    icon={<SettingsOutlinedIcon />}
                    label="Settings"
                    isActive={location.pathname === '/settings'}
                />
            </Stack>
        </Box>
    );
};

export default SideRail;
