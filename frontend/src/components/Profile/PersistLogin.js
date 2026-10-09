import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useRefreshToken from '../../hooks/useRefreshToken'
import useAuth from '../../hooks/useAuth'
import { Box, CircularProgress } from '@mui/material'

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true)
    const refresh = useRefreshToken()
    const { auth, persist } = useAuth()

    useEffect(() => {
        let isMounted = true
        const verifyRefreshToken = async () => {
            try {
                await refresh()
            } catch (err) {
                // No valid session (expired, or signed out elsewhere): continue as a visitor.
                console.error(err)
            } finally {
                isMounted && setIsLoading(false)
            }
        }
        !auth?.accessToken && persist ? verifyRefreshToken() : setIsLoading(false)
        return () => isMounted = false
    }, [auth, persist, refresh])

    if (persist && isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }} role="status">
                <CircularProgress aria-label="Loading your account" />
            </Box>
        )
    }

    return <Outlet />
}

export default PersistLogin
