import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

export const axiosPrivate = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});
