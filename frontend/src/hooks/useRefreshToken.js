import { useCallback } from 'react';
import axios from '../actions/axios'
import useSession from './useSession'
import useAuth from './useAuth'

const useRefreshToken = () => {
    const startSession = useSession()
    const { persist } = useAuth()

    const refresh = useCallback(async () => {
        const response = await axios.get('user/refresh', {
            withCredentials: true,
        })
        startSession(response.data, { persist })
        return response.data.accessToken
    }, [startSession, persist]);
    return refresh
}

export default useRefreshToken
