import { useCallback } from 'react';
import axios from '../actions/axios'
import useAuth from './useAuth'
import useStore from "../store"

const useRefreshToken = () => {
    const { setAuth } = useAuth()
    const {setUserID, setUserName, setIsTeacher, setIsStudent, setFirstName, setLastName, setIsRegistered} = useStore()
    
    const refresh = useCallback(async () => {
        const response = await axios.get('user/refresh', {
            withCredentials: true,
        })
        const userDoc = response.data
        setAuth(prev => {
            return {userName: userDoc.userName,
                    roles: response.data.roles,
                    accessToken: response.data.accessToken
            }
        })
        setUserID(userDoc._id)
        setUserName(userDoc.userName)
        setIsTeacher(userDoc.isTeacher)
        setIsStudent(userDoc.isStudent)
        setFirstName(userDoc.firstName)
        setLastName(userDoc.lastName)
        setIsRegistered(true)
        return response.data.accessToken
    }, [setAuth, setUserID, setUserName, setIsTeacher, setIsStudent, setFirstName, setLastName, setIsRegistered]);
    return refresh
}

export default useRefreshToken
