import {Outlet} from 'react-router-dom'
import {useState, useEffect} from 'react'
import useRefreshToken from '../../hooks/useRefreshToken'
import useAuth from '../../hooks/useAuth'
import { CircularProgress } from '@mui/material'

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true)
    const refresh = useRefreshToken()
    const {auth, persist} = useAuth()

    useEffect(() => {
        let isMounted = true
        const verifyRefreshToken = async () => {
            try {
                await refresh()
            } catch (err) {
                console.error(err)
            } finally {
                isMounted && setIsLoading(false)
            }
        }
        !auth?.accessToken && persist ? verifyRefreshToken() : setIsLoading(false)
        return () => isMounted = false
    }, [])

    return(
        <>
            {!persist
                ? <Outlet />
                : isLoading
                    ?  (
                            <CircularProgress 
                                size="xl"
                                w={20}
                                h={20}
                                style={{display:'flex', justifyContent:"center", alignItems:'center', height:'70vh'}}
                                margin="auto"
                            />
                        )
                    : <Outlet />
            }
        </>
    )
}

export default PersistLogin