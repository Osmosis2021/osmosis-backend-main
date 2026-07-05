import {useLocation, Navigate, Outlet} from 'react-router-dom'
import useAuth from './hooks/useAuth'

const RequireAuth = ({allowedRoles}) => {
    const {auth} = useAuth()
    const location = useLocation()

    if (auth?.userName && auth?.isEmailVerified === false) {
        return <Navigate to='/verify-email' state={{from: location}} replace />
    }

    return(
        auth?.roles?.find(role => allowedRoles?.includes(role))
            ? <Outlet />
            : auth?.userName
                ? <Navigate to='/unauthorized' state={{from: location}} replace />
                : <Navigate to='/' state={{from: location}} replace />
    )
}

export default RequireAuth