import { Navigate } from 'react-router-dom';
import useStore from '../../store';

// Bookings are listed on each person's profile; /bookings just takes them there.
const MyBookingsRedirect = () => {
    const { isTeacher, userName } = useStore();
    if (!userName) return <Navigate to="/" replace />;
    return <Navigate to={`/${isTeacher ? 'teachers' : 'students'}/${userName}`} replace />;
};

export default MyBookingsRedirect;
