import { useCallback, useEffect, useState } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

/**
 * The signed-in host's Stripe payout setup.
 * status.state: not_started | in_progress | action_needed | pending_review | ready
 */
const usePayouts = ({ load = true } = {}) => {
    const axiosPrivate = useAxiosPrivate();
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(load);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState('');

    const reload = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const { data } = await axiosPrivate.get('stripe/payouts/status');
            setStatus(data);
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't check your payout setup. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    useEffect(() => { if (load) reload(); }, [load, reload]);

    // Sends the host to Stripe (a fresh link each time; links expire after a few minutes).
    const goToStripe = useCallback(async (endpoint) => {
        setIsRedirecting(true);
        setError('');
        try {
            const { data } = await axiosPrivate.post(endpoint);
            if (!data?.url) throw new Error('No link returned');
            window.location.assign(data.url);
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't open Stripe. Please try again.");
            setIsRedirecting(false);
        }
    }, [axiosPrivate]);

    const startOnboarding = useCallback(() => goToStripe('stripe/payouts/onboarding-link'), [goToStripe]);
    const openDashboard = useCallback(() => goToStripe('stripe/payouts/dashboard-link'), [goToStripe]);

    return { status, isLoading, isRedirecting, error, reload, startOnboarding, openDashboard };
};

export default usePayouts;
