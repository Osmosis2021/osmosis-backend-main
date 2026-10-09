import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    useMediaQuery,
    useTheme,
} from '@mui/material';

const ConfirmContext = createContext(null);

/**
 * App-wide confirmation dialog, replacing window.confirm().
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *       title: 'Delete this studio time?',
 *       description: 'Guests will no longer be able to find or book it. This can't be undone.',
 *       confirmLabel: 'Delete',
 *       destructive: true,
 *       onConfirm: async () => { await api.delete(...) },   // optional
 *   });
 *
 * With `onConfirm`, the dialog stays open with a spinner while it runs and shows the error
 * inline if it throws, so the user can retry or cancel. Resolves true once confirmed
 * (and `onConfirm` succeeded), false if cancelled.
 */
export const ConfirmProvider = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const resolver = useRef(null);
    const [options, setOptions] = useState(null);
    const [isWorking, setIsWorking] = useState(false);
    const [error, setError] = useState('');

    const confirm = useCallback((opts) => new Promise((resolve) => {
        // Only one confirmation at a time; a new one cancels the previous.
        resolver.current?.(false);
        resolver.current = resolve;
        setError('');
        setIsWorking(false);
        setOptions(opts);
    }), []);

    const finish = (result) => {
        resolver.current?.(result);
        resolver.current = null;
        setOptions(null);
    };

    const handleCancel = () => {
        if (isWorking) return;
        finish(false);
    };

    const handleConfirm = async () => {
        if (!options?.onConfirm) {
            finish(true);
            return;
        }
        setIsWorking(true);
        setError('');
        try {
            await options.onConfirm();
            setIsWorking(false);
            finish(true);
        } catch (err) {
            setIsWorking(false);
            setError(
                (typeof options.errorMessage === 'function' ? options.errorMessage(err) : options.errorMessage)
                || err?.response?.data?.message
                || 'Something went wrong. Please try again.'
            );
        }
    };

    const {
        title,
        description,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        destructive = false,
    } = options || {};

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Dialog
                open={Boolean(options)}
                onClose={handleCancel}
                maxWidth="xs"
                fullWidth
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                PaperProps={{ sx: { borderRadius: '20px', m: 2, width: isMobile ? 'calc(100% - 32px)' : undefined } }}
                sx={{ zIndex: 200002 }}
            >
                <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 800, fontFamily: 'Outfit', pb: 1 }}>
                    {title}
                </DialogTitle>
                <DialogContent>
                    {description && (
                        <DialogContentText id="confirm-dialog-description" component="div" sx={{ color: 'text.secondary' }}>
                            {description}
                        </DialogContentText>
                    )}
                    {error && (
                        <Alert severity="error" role="alert" sx={{ mt: 2, borderRadius: '12px' }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: isMobile ? 'column-reverse' : 'row', '& > :not(:first-of-type)': { ml: isMobile ? 0 : 1 } }}>
                    <Button
                        onClick={handleCancel}
                        disabled={isWorking}
                        variant="outlined"
                        fullWidth={isMobile}
                        // For destructive actions, the safe choice gets focus first.
                        autoFocus={destructive}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: 'text.primary', borderColor: 'divider' }}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isWorking}
                        variant="contained"
                        color={destructive ? 'error' : 'primary'}
                        fullWidth={isMobile}
                        autoFocus={!destructive}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', minWidth: 120 }}
                    >
                        {isWorking ? <CircularProgress size={20} color="inherit" aria-label="Working" /> : confirmLabel}
                    </Button>
                </DialogActions>
            </Dialog>
        </ConfirmContext.Provider>
    );
};

/** Returns confirm(options) => Promise<boolean>. See ConfirmProvider for options. */
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used inside <ConfirmProvider>');
    return context;
};
