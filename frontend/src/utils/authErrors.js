// Turns an axios error from an auth request into a short, human message.
export const getAuthErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    if (!err?.response) {
        return "We couldn't reach Studio Time. Check your connection and try again.";
    }
    const { status, data } = err.response;
    if (status === 401 && (!data?.message || data.message === 'Unauthorized')) {
        return 'Incorrect email or password.';
    }
    if (status === 429) {
        return data?.message || 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (status >= 500 && !data?.message) {
        return 'Studio Time is having trouble right now. Please try again in a moment.';
    }
    return data?.message || fallback;
};
