import axios from "axios"
const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://studiotime.app/' : 'http://localhost:8126/'

export default axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});