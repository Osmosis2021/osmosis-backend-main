import { useCallback } from 'react';
import useAuth from './useAuth';
import useStore from '../store';

// Where someone should land after signing in.
export const getLandingPath = (user, from) => {
    if (user?.isEmailVerified === false) return '/verify-email';
    if (from && from !== '/' && from !== '/sign-up') return from;
    if (user?.isTeacher) return `/teachers/${user.userName}`;
    return '/explore';
};

/**
 * Stores a signed-in user (the response from /user/login, /user/google-login or /user/refresh)
 * in the auth context and the app store. One place, so every sign-in path behaves the same.
 */
const useSession = () => {
    const { setAuth, setPersist } = useAuth();
    const {
        setUserID, setUserName, setIsTeacher, setIsStudent, setFirstName, setLastName, setRoles,
        setEmail, setDescription, setIsRegistered, setCustomerStripeID, setPaymentMethodID,
    } = useStore();

    // `actingAs` is set when a team member is working on an unclaimed artist's profile (admin tools).
    const startSession = useCallback((user, { persist = true, actingAs = null } = {}) => {
        try {
            localStorage.setItem('persist', persist);
        } catch (e) {
            // Private browsing can block storage; the session still works for this tab.
        }
        setPersist(persist);
        setAuth({
            userName: user.userName,
            accessToken: user.accessToken,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified,
            email: user.email,
            actingAs,
        });
        setRoles(user.roles);
        setUserID(user._id);
        setUserName(user.userName);
        setIsTeacher(Boolean(user.isTeacher));
        setIsStudent(Boolean(user.isStudent));
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setDescription(user.description || '');
        setIsRegistered(true);
        setCustomerStripeID(user.customerStripeID);
        setPaymentMethodID(user.paymentMethodID);
    }, [setAuth, setPersist, setRoles, setUserID, setUserName, setIsTeacher, setIsStudent, setFirstName,
        setLastName, setEmail, setDescription, setIsRegistered, setCustomerStripeID, setPaymentMethodID]);

    return startSession;
};

export default useSession;
