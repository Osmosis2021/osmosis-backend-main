// Single source of truth for the API address.
// Set REACT_APP_API_URL at build time (Netlify → Site settings → Environment variables).
const normalize = (url) => (url.endsWith('/') ? url : `${url}/`);

const resolveApiBaseUrl = () => {
    const configured = process.env.REACT_APP_API_URL;
    if (configured) return normalize(configured);

    if (process.env.NODE_ENV === 'production') {
        // Without this the app would call its own (static) host and every request would fail.
        // eslint-disable-next-line no-console
        console.error('REACT_APP_API_URL is not set. API requests will go to this site\'s own origin, which only works if the API is served from the same domain.');
        return '/';
    }
    return 'http://localhost:8126/';
};

export const API_BASE_URL = resolveApiBaseUrl();
