import axios from "axios";

const getBaseUrl = () => {
    let url = process.env.REACT_APP_API_URL
    if (url && !url.endsWith('/')) {
        url += '/';
    }
    return url;
};

const BASE_URL = getBaseUrl();

export default axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});