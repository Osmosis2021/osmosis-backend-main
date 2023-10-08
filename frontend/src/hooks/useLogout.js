import { useNavigate } from "react-router-dom"
import axios from "../actions/axios"
import useAuth from "./useAuth"
import useStore from "../store"

const useLogout = () => {
    const {setAuth} = useAuth()
    const navigate = useNavigate()
    const {setUserID, userName, setUserName, setIsTeacher, setIsStudent, setFirstName, setLastName, setIsRegistered} = useStore()

    const logout = async (redirect='/') => {
        setAuth({})
        try {
            await axios('user/logout', {userName}, {withCredentials: true})
            setUserID('')
            setUserName('')
            setIsTeacher(false)
            setIsStudent(false)
            setFirstName('')
            setLastName('')
            setIsRegistered(false)
            navigate(redirect)
        } catch (err) {
            console.error(err) 
        }
    }
    return logout
}

export default useLogout