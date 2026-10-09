import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import useStore from '../../store';
import { getInAppBrowserName } from '../../utils/browser';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const SCRIPT_TIMEOUT_MS = 8000;
const POLL_MS = 150;

// Google Identity Services must be initialized only once per page. Whichever button is on
// screen registers its handler here, and the single GIS callback forwards to it.
let isGoogleInitialized = false;
let activeCredentialHandler = null;

const initializeGoogle = () => {
    if (isGoogleInitialized) return;
    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => activeCredentialHandler?.(response.credential),
        ux_mode: 'popup',
        cancel_on_tap_outside: true,
    });
    isGoogleInitialized = true;
};

/** Whether the Google button can appear here (client ID configured, running on the web). */
export const useGoogleSignInAvailable = () => {
    const { platform } = useStore();
    return Boolean(GOOGLE_CLIENT_ID) && platform === 'web';
};

/**
 * The "Sign in with Google" button, shared by login, signup and account settings.
 *
 * Renders nothing when Google sign-in can't work (no client ID, or inside the native app),
 * and explains the problem in social-app browsers, where Google refuses to sign people in.
 *
 * @param {(credential: string) => void} onCredential  called with Google's ID token
 * @param {'signin_with'|'signup_with'|'continue_with'} text  button label variant
 */
const GoogleSignInButton = ({ onCredential, text = 'continue_with' }) => {
    const containerRef = useRef(null);
    const handlerRef = useRef(onCredential);
    const [status, setStatus] = useState('loading'); // loading | ready | failed
    const inAppBrowser = getInAppBrowserName();
    const isAvailable = useGoogleSignInAvailable();

    handlerRef.current = onCredential;

    useEffect(() => {
        if (!isAvailable) {
            if (!GOOGLE_CLIENT_ID) {
                // eslint-disable-next-line no-console
                console.warn('REACT_APP_GOOGLE_CLIENT_ID is not set, so the Google sign-in button is hidden.');
            }
            return undefined;
        }

        const handler = (credential) => handlerRef.current?.(credential);
        activeCredentialHandler = handler;

        let cancelled = false;
        let pollTimer;
        const startedAt = Date.now();

        const render = () => {
            if (cancelled) return;
            if (!window.google?.accounts?.id) {
                if (Date.now() - startedAt > SCRIPT_TIMEOUT_MS) {
                    setStatus('failed');
                    return;
                }
                pollTimer = setTimeout(render, POLL_MS);
                return;
            }
            const container = containerRef.current;
            if (!container) return;
            initializeGoogle();
            // GIS buttons accept a width between 200 and 400px.
            const width = Math.max(200, Math.min(400, Math.floor(container.offsetWidth || 320)));
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
                theme: 'outline',
                size: 'large',
                shape: 'pill',
                text,
                width,
                logo_alignment: 'center',
            });
            setStatus('ready');
        };

        render();

        return () => {
            cancelled = true;
            clearTimeout(pollTimer);
            if (activeCredentialHandler === handler) activeCredentialHandler = null;
        };
        // `onCredential` is read through a ref so the button isn't re-rendered on every parent render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAvailable, text]);

    if (!isAvailable) return null;

    return (
        <Box sx={{ width: '100%' }}>
            {inAppBrowser && (
                <Alert severity="info" sx={{ mb: 1.5, borderRadius: '12px', textAlign: 'left' }}>
                    Google sign-in doesn't work inside the {inAppBrowser} browser. Tap the <strong>⋯</strong> menu and choose
                    {' '}<strong>Open in browser</strong>, or use your email and password instead.
                </Alert>
            )}
            <Box
                ref={containerRef}
                sx={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center', colorScheme: 'light' }}
            />
            {status === 'failed' && (
                <Typography variant="caption" color="text.secondary" role="status" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                    Google sign-in couldn't load. Check your connection, or use your email and password.
                </Typography>
            )}
        </Box>
    );
};

export default GoogleSignInButton;
