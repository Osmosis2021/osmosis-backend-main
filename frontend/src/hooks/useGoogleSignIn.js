import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../actions/axios';
import useSession, { getLandingPath } from './useSession';
import { getAuthErrorMessage } from '../utils/authErrors';

/**
 * Handles a Google credential end to end: sign in, ask a brand-new user whether they are an
 * artist or a guest (if `role` isn't known yet), start the session and go to the right page.
 *
 * @param {{ role?: string, from?: string }} options
 *   role: 'artist' | 'guest' when the page already knows it (signup form)
 *   from: path to return to after signing in
 */
const useGoogleSignIn = ({ role, from } = {}) => {
    const navigate = useNavigate();
    const startSession = useSession();
    const pendingCredential = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [rolePrompt, setRolePrompt] = useState({ open: false, firstName: '' });

    const submit = useCallback(async (credential, chosenRole) => {
        setIsSubmitting(true);
        setError('');
        try {
            const { data } = await axios.post('user/google-login', { credential, role: chosenRole || undefined });
            if (data.needsRole) {
                pendingCredential.current = credential;
                setRolePrompt({ open: true, firstName: data.firstName });
                return;
            }
            pendingCredential.current = null;
            setRolePrompt({ open: false, firstName: '' });
            startSession(data);
            navigate(getLandingPath(data, from), { replace: true });
        } catch (err) {
            setRolePrompt({ open: false, firstName: '' });
            setError(getAuthErrorMessage(err, "We couldn't sign you in with Google. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    }, [from, navigate, startSession]);

    const handleCredential = useCallback((credential) => submit(credential, role), [submit, role]);

    const confirmRole = useCallback((chosenRole) => {
        if (pendingCredential.current) submit(pendingCredential.current, chosenRole);
    }, [submit]);

    const cancelRole = useCallback(() => {
        pendingCredential.current = null;
        setRolePrompt({ open: false, firstName: '' });
    }, []);

    return { handleCredential, isSubmitting, error, setError, rolePrompt, confirmRole, cancelRole };
};

export default useGoogleSignIn;
