import { Outlet, useLocation } from 'react-router-dom'
import useStore from "./store"
import { Box, useTheme, useMediaQuery } from '@mui/material'
import SideRail from './components/SideRail/SideRail';
import './Layout.css'
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import useAuth from './hooks/useAuth';

const Layout = () => {
    const { platform } = useStore();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { userID, setSocket } = useStore();
    const { auth } = useAuth();

    // Keep the latest access token available to the socket without reconnecting on every refresh.
    const accessTokenRef = useRef(auth?.accessToken);
    useEffect(() => {
        accessTokenRef.current = auth?.accessToken;
    }, [auth?.accessToken]);

    useEffect(() => {
        const { socket, backendURL } = useStore.getState();
        if (userID && !socket) {
            // The server rejects connections without a valid token. `auth` is a function so each
            // (re)connection attempt sends the current token.
            const newSocket = io(backendURL, {
                auth: (cb) => cb({ token: accessTokenRef.current }),
            });
            let retryTimeout;
            newSocket.on('connect', () => newSocket.emit("setup"));
            // An expired token is refused by the server and socket.io won't retry by itself;
            // try again shortly, by which time the token has usually been refreshed.
            newSocket.on('connect_error', () => {
                clearTimeout(retryTimeout);
                retryTimeout = setTimeout(() => newSocket.connect(), 5000);
            });
            setSocket(newSocket);

            return () => {
                clearTimeout(retryTimeout);
                newSocket.disconnect();
                setSocket(null);
            }
        }
    }, [userID, setSocket]);

    return (
        <Box
            component="main"
            className={`App Layout-${platform}`}
            sx={{
                // Always add bottom padding on mobile for bottom nav (64px nav + safe area)
                pb: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : 0,
                // Add left padding on desktop for SideRail
                pl: isMobile ? 0 : '96px',
                minHeight: '100dvh',
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
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
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