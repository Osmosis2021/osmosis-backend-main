import { useNavigate } from "react-router-dom"
import axios from "../actions/axios"
import useAuth from "./useAuth"
import useStore from "../store"

const useLogout = () => {
    const { setAuth, setPersist } = useAuth()
    const navigate = useNavigate()
    const {
        setUserID, setUserName, setIsTeacher, setIsStudent, setFirstName, setLastName, setIsRegistered,
        setEmail, setDescription, setRoles, setCustomerStripeID, setPaymentMethodID, setChats, setSelectedChat,
    } = useStore()

    const logout = async (redirect = '/') => {
        // Clear local state first so the user is signed out even if the request below fails.
        setAuth({})
        setPersist(false)
        try {
            localStorage.setItem('persist', false)
        } catch (e) {
            // Storage can be unavailable in private browsing.
        }
        setUserID('')
        setUserName('')
        setIsTeacher(false)
        setIsStudent(false)
        setFirstName('')
        setLastName('')
        setEmail('')
        setDescription('')
        setRoles([])
        setCustomerStripeID([])
        setPaymentMethodID([])
        setIsRegistered(false)
        setChats([])
        setSelectedChat(null)
        try {
            await axios.get('user/logout')
        } catch (err) {
            console.error(err)
        } finally {
            navigate(redirect)
        }
    }
    return logout
}

export default useLogout
