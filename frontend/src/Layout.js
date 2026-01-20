import { Outlet, useLocation } from 'react-router-dom'
import useStore from "./store"
import { Box, useTheme, useMediaQuery } from '@mui/material'
import SideRail from './components/SideRail/SideRail';
import './Layout.css'
import { useEffect } from 'react';
import io from 'socket.io-client';

const Layout = () => {
    const { platform } = useStore();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { userID, backendURL, socket, setSocket } = useStore();

    useEffect(() => {
        if (userID && !socket) {
            const newSocket = io(backendURL);
            newSocket.emit("setup", userID);
            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                setSocket(null);
            }
        }
    }, [userID]);

    return (
        <Box
            component="main"
            className={`App Layout-${platform}`}
            sx={{
                // Always add bottom padding on mobile for bottom nav (64px nav + safe area)
                pb: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : 0,
                // Add left padding on desktop for SideRail
                pl: isMobile ? 0 : '96px',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {!isMobile && <SideRail />}

            {/* Global page transition wrapper keyed by pathname */}
            <Box
                key={location.pathname}
                sx={{
                    flex: 1,
                    animation: 'fadeSlideIn 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    '@keyframes fadeSlideIn': {
                        '0%': {
                            opacity: 0,
                            transform: 'translateY(8px)',
                        },
                        '100%': {
                            opacity: 1,
                            transform: 'translateY(0)',
                        },
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none',
                    },
                }}
            >
                <Outlet />
            </Box>
        </Box>
    )
}

export default Layout