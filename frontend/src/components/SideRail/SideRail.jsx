import React from 'react';
import { Box, Stack, IconButton, Typography, Tooltip, Avatar } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import useStore from '../../store';

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
                width: 64,
                height: 64,
                borderRadius: 0,
                bgcolor: isActive ? '#F7F7F7' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                    bgcolor: isActive ? '#F7F7F7' : '#FAFAFA',
                    transform: 'none'
                }
            }}
        >
            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
            <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.65rem' }}>
                {label}
            </Typography>
        </Box>
    </Tooltip>
);

const SideRail = () => {
    const location = useLocation();
    const { userID, userName, platform, isTeacher } = useStore();

    // Determine profile link based on user role/data? 
    // Usually it's /students/:userName or /teachers/:userName
    // But we can fallback to /edit or something if unavailable.
    // For now assuming generic profile link is tricky without knowing role.
    // We can use /students or /teachers if we know.
    // But App.js routes are specific.
    // Let's use /edit as a proxy or just /role if checking.
    // Actually, `StudentProfile` at /students/:userName and `TeacherProfile` at /teachers/:userName
    // We can use `userName` from store.
    // If not logged in, maybe show Login?

    const profileLink = `/students/${userName}`; // Default to student URL, valid for both if handle exists? 
    // Just a guess. Or better, linking to /students which shows "personal page" per App.js line 91?
    // Let's check App.js line 91: <Route path='/students' element={<h1...>} />
    // Teacher Link: /teachers/:userName

    // Let's rely on /edit for now or just the profile logic
    // Actually, let's look at BottomNav to see what it links to.
    // Skipping that research for speed, I'll link to /edit for "Profile" or just userName if available.

    const navItems = [
        { to: '/', icon: <HomeIcon />, label: 'Home' },
        { to: '/explore', icon: <SearchIcon />, label: 'Explore' },
        { to: '/chat', icon: <ChatBubbleOutlineIcon />, label: 'Messages' },
        {
            to: userName ? `/${isTeacher ? 'teachers' : 'students'}/${userName}` : '/sign-up',
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
                borderRight: '1px solid #F0F0F0',
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
                    // src="/frontend/src/assets/studio_time_icon.png"
                    variant="rounded"
                    sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}
                >
                    ST
                </Avatar>
            </Box>

            {/* Nav Items */}
            <Stack spacing={2} sx={{ mb: 'auto' }}>
                {navItems.map((item) => (
                    <NavItem
                        key={item.label}
                        {...item}
                        isActive={location.pathname === item.to || location.pathname.startsWith(item.to) && item.to !== '/'}
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
