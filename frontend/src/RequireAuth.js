import {useLocation, Navigate, Outlet} from 'react-router-dom'
import useAuth from './hooks/useAuth'

const RequireAuth = ({allowedRoles}) => {
    const {auth} = useAuth()
    const location = useLocation()

    // (A team member working on an unclaimed artist's profile isn't asked to verify the artist's email.)
    if (auth?.userName && auth?.isEmailVerified === false && !auth?.actingAs) {
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