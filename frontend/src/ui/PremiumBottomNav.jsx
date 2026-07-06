import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Paper,
    Badge,
    useTheme,
    useMediaQuery,
    Box,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import useStore from '../store';

export const PremiumBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { isTeacher, userName, notification } = useStore();

    if (!isMobile) return null;

    const navItems = [
        {
            id: 'home',
            path: '/',
            icon: <HomeIcon />,
            label: 'Home'
        },
        {
            id: 'explore',
            path: '/explore',
            icon: <SearchIcon />,
            label: 'Explore'
        },
        {
            id: 'messages',
            path: '/chat',
            icon: <ChatBubbleOutlineIcon />,
            label: 'Messages',
            badge: notification?.length
        },
        {
            id: 'profile',
            path: userName ? `/${isTeacher ? 'teachers' : 'students'}/${userName}` : '/sign-up',
            icon: <PersonOutlineIcon />,
            label: 'Profile'
        }
    ];

    const isActive = (item) => {
        if (item.path === '/') return location.pathname === '/';
        return location.pathname.startsWith(item.path);
    };

    return (
        <Box
            id="BottomNav"
            sx={{
                position: 'fixed',
                bottom: 'calc(16px + env(safe-area-inset-bottom))',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 48px)',
                maxWidth: '420px',
                zIndex: 1300, // Above most elements including sticky bars usually
                pointerEvents: 'none', // Allow clicks through empty space
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    pointerEvents: 'auto', // Re-enable for the dock itself
                    bgcolor: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '32px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    px: 1,
                    py: 0.75,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center'
                }}
            >
                {navItems.map((item) => {
                    const active = isActive(item);
                    return (
                        <Box
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                height: '48px',
                                cursor: 'pointer',
                                borderRadius: '24px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                bgcolor: active ? 'rgba(10, 10, 10, 0.08)' : 'transparent',
                                '&:active': {
                                    transform: 'scale(0.92)',
                                    bgcolor: 'rgba(10, 10, 10, 0.14)'
                                }
                            }}
                        >
                            <Box sx={{ position: 'relative', display: 'flex' }}>
                                <Badge
                                    badgeContent={item.badge}
                                    color="primary"
                                    overlap="circular"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontWeight: 700,
                                            fontSize: '0.65rem',
                                            minWidth: 16,
                                            height: 16,
                                            top: 2,
                                            right: 2
                                        }
                                    }}
                                >
                                    {React.cloneElement(item.icon, {
                                        sx: {
                                            fontSize: 26,
                                            color: active ? 'primary.main' : 'text.secondary',
                                            transition: 'color 0.2s ease',
                                        }
                                    })}
                                </Badge>
                            </Box>

                            {/* Subtle dot or underline if active */}
                            {active && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 6,
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main'
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Paper>
        </Box>
    );
};

