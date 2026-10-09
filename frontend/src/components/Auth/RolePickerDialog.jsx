import React, { useState } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import RoleOptions from './RoleOptions';

/**
 * Shown after a brand-new user signs in with Google, so we create the right kind of account
 * instead of guessing.
 */
const RolePickerDialog = ({ open, firstName, isSubmitting, onConfirm, onCancel }) => {
    const [role, setRole] = useState('');

    return (
        <Dialog open={open} onClose={isSubmitting ? undefined : onCancel} maxWidth="xs" fullWidth aria-labelledby="role-picker-title">
            <DialogTitle id="role-picker-title" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                {firstName ? `Welcome, ${firstName}!` : 'Welcome to Studio Time!'}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    One quick question to set up your account. You can't change this later, so pick the one that fits best.
                </Typography>
                <RoleOptions value={role} onChange={setRole} labelId="role-picker-label" />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onCancel} disabled={isSubmitting} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => onConfirm(role)}
                    disabled={!role || isSubmitting}
                    sx={{ textTransform: 'none', fontWeight: 700, minWidth: 140 }}
                >
                    {isSubmitting ? <CircularProgress size={20} color="inherit" aria-label="Creating your account" /> : 'Create account'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RolePickerDialog;
