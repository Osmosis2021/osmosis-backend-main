import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Badge,
    useTheme,
    useMediaQuery,
    Box
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import useStore from '../store';

export const PremiumBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { isTeacher, userName, notification } = useStore();

    // Simple rule: show on mobile, hide on desktop
    if (!isMobile) return null;

    const getActiveValue = () => {
        if (location.pathname.includes('/explore')) return 'explore';
        if (location.pathname.includes('/MapOpen')) return 'map';
        if (location.pathname.includes('/chat')) return 'messages';
        if (location.pathname.includes('/students/') || location.pathname.includes('/teachers/')) return 'profile';
        return 'explore';
    };

    const handleChange = (event, newValue) => {
        switch (newValue) {
            case 'explore':
                navigate('/explore');
                break;
            case 'map':
                navigate('/MapOpen');
                break;
            case 'messages':
                navigate('/chat');
                break;
            case 'profile':
                navigate(`${isTeacher ? '/teachers' : '/students'}/${userName}`);
                break;
            default:
                break;
        }
    };

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1100, // Base nav layer
                borderRadius: 0,
                borderTop: '1px solid #E8E8E8',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
                pb: 'env(safe-area-inset-bottom)',
                bgcolor: 'white'
            }}
            elevation={0}
        >
            <BottomNavigation
                value={getActiveValue()}
                onChange={handleChange}
                showLabels={false}
                sx={{
                    height: 64,
                    bgcolor: 'transparent',
                    '& .MuiBottomNavigationAction-root': {
                        minWidth: 'auto',
                        padding: '8px 12px',
                        color: 'text.secondary',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:active': {
                            transform: 'scale(0.92)',
                        },
                        '&.Mui-selected': {
                            color: 'primary.main',
                            '& .MuiSvgIcon-root': {
                                transform: 'scale(1.08)',
                            }
                        },
                        '& .MuiSvgIcon-root': {
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }
                    }
                }}
            >
                <BottomNavigationAction
                    value="explore"
                    icon={<HomeRoundedIcon sx={{ fontSize: 26 }} />}
                />
                <BottomNavigationAction
                    value="map"
                    icon={<ExploreRoundedIcon sx={{ fontSize: 26 }} />}
                />
                <BottomNavigationAction
                    value="messages"
                    icon={
                        <Badge
                            badgeContent={notification?.length}
                            color="primary"
                            sx={{
                                '& .MuiBadge-badge': {
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                    minWidth: 18,
                                    height: 18,
                                }
                            }}
                        >
                            <ForumRoundedIcon sx={{ fontSize: 26 }} />
                        </Badge>
                    }
                />
                <BottomNavigationAction
                    value="profile"
                    icon={<AccountCircleRoundedIcon sx={{ fontSize: 26 }} />}
                />
            </BottomNavigation>
        </Paper>
    );
};
