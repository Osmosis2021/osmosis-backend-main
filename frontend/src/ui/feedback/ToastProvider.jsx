import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = { success: 4000, info: 4000, warning: 6000, error: 7000 };

/**
 * App-wide toast notifications (short, non-blocking feedback such as "Saved" or "Couldn't upload").
 * Toasts are queued and shown one at a time, above the mobile bottom navigation.
 *
 * Use confirmations (useConfirm) for anything the user must decide, and inline field errors
 * for form validation; toasts are for the outcome of an action.
 */
export const ToastProvider = ({ children }) => {
    const queue = useRef([]);
    const nextId = useRef(0);
    const currentRef = useRef(null);
    const [current, setCurrent] = useState(null);
    const [open, setOpen] = useState(false);

    const display = useCallback((toast) => {
        currentRef.current = toast;
        setCurrent(toast);
        setOpen(Boolean(toast));
    }, []);

    // Called when a toast has finished animating out.
    const showNext = useCallback(() => {
        display(queue.current.shift() || null);
    }, [display]);

    /**
     * @param {string} message
     * @param {'success'|'error'|'info'|'warning'} [severity]
     * @param {{ duration?: number, action?: { label: string, onClick: () => void } }} [options]
     */
    const showToast = useCallback((message, severity = 'success', options = {}) => {
        if (!message) return;
        queue.current.push({
            id: nextId.current++,
            message,
            severity,
            duration: options.duration ?? DEFAULT_DURATION_MS[severity] ?? 4000,
            action: options.action,
        });
        // If nothing is showing, show it now; otherwise it waits its turn.
        if (!currentRef.current) showNext();
    }, [showNext]);

    const api = useMemo(() => ({
        showToast,
        success: (message, options) => showToast(message, 'success', options),
        error: (message, options) => showToast(message, 'error', options),
        info: (message, options) => showToast(message, 'info', options),
        warning: (message, options) => showToast(message, 'warning', options),
    }), [showToast]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <Snackbar
                key={current?.id}
                open={open && Boolean(current)}
                autoHideDuration={current?.duration}
                onClose={handleClose}
                TransitionProps={{ onExited: showNext }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{
                    // Sit above the floating bottom navigation on phones.
                    bottom: { xs: 'calc(100px + env(safe-area-inset-bottom))', md: 24 },
                    left: { xs: 16, sm: '50%' },
                    right: { xs: 16, sm: 'auto' },
                    zIndex: 200001,
                }}
            >
                {current ? (
                    <Alert
                        onClose={handleClose}
                        severity={current.severity}
                        variant="filled"
                        role={current.severity === 'error' || current.severity === 'warning' ? 'alert' : 'status'}
                        action={current.action ? (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => {
                                    current.action.onClick();
                                    setOpen(false);
                                }}
                                sx={{ fontWeight: 700 }}
                            >
                                {current.action.label}
                            </Button>
                        ) : undefined}
                        sx={{ width: '100%', borderRadius: '12px', fontWeight: 600, boxShadow: 3, alignItems: 'center' }}
                    >
                        {current.message}
                    </Alert>
                ) : <span />}
            </Snackbar>
        </ToastContext.Provider>
    );
};

/** Returns { showToast, success, error, info, warning }. */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used inside <ToastProvider>');
    return context;
};
