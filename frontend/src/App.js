import RequireAuth from './RequireAuth';
import axios from 'axios'
import PersistLogin from './components/Profile/PersistLogin'
import { Routes, Route } from 'react-router-dom';
import { Opening } from './components/index';
import UpdatedProgressBar from './components/TopNavBar/UpdatedProgressBar';
import StudentProfile from './components/Profile/StudentProfile/StudentProfile';
import TeacherProfile from './components/Profile/TeacherProfile/TeacherProfile';
import Signup from './components/Auth/Signup';
import Course from './components/Course/Course';
import Forgot from './components/Auth/ForgotPassword/ForgotPassword';
import VerifyEmail from './components/Auth/VerifyEmail/VerifyEmail';
import ClaimAccount from './components/Auth/ClaimAccount';
import AdminArtists from './components/Admin/AdminArtists';
import './App.css';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme.js';
import Settings from './components/Settings/Settings';
import EditProfile from './components/Profile/EditProfile';
import Explore from './components/Explore/Explore';
import EditCourse from './components/Profile/TeacherProfile/EditCourse';
import EditPhotos from './components/Profile/TeacherProfile/EditPhotos';
import MyBookingsRedirect from './components/Booking/MyBookingsRedirect';
import PageNotFound from './components/PageNotFound';
import SingleBookingPage from './components/Booking/SingleBookingPage';
import TermsOfService from './components/Settings/TermsOfService';
import SingleBookingPageForStudent from './components/Booking/SingleBookingPageForStudent';
import Privacy from './components/Settings/Privacy';
import OrdersAndPayments from './components/Profile/OrdersAndPayments';
import Chat from './components/Chat/Chat';
import Layout from './Layout'
import Unauthorized from './components/Unauthorized'
import PayoutSetup from './components/Payouts/PayoutSetup';
import Calendar from './components/Calendar/Calendar.jsx';
import LandingPage from './components/LandingPage/LandingPage.jsx';
import { ToastProvider, ConfirmProvider } from './ui/feedback';

axios.defaults.withCredentials = true;

function App() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<ToastProvider>
			<ConfirmProvider>
			<Routes>
				<Route path='/' element={<Layout />} >
					<Route element={<PersistLogin />} >
						{/* Public routes */}
						<Route path='/' element={<Opening />} />
						<Route path='/termsofservice' element={<TermsOfService />} />
						<Route path='/privacy' element={<Privacy />} />
						<Route path='/forgot' element={<Forgot />} />
						<Route path='/verify-email' element={<VerifyEmail />} />
						<Route path='/claim-account' element={<ClaimAccount />} />
						<Route path='landing' element={<LandingPage />} />
						<Route path='/explore' element={<Explore />} />
						<Route path='/sign-up' element={<Signup />} />
						<Route path='/student-sign-up' element={<Signup initialRole='guest' />} />
						<Route path='/unauthorized' element={<Unauthorized />} />

						{/* Public Profile Viewers */}
						<Route path='/teachers/:userName' element={<TeacherProfile />} />
						<Route path='/teachers/:userName/:course' element={<Course />} />
						<Route path='/students/:userName' element={<StudentProfile />} />

						{/* Authenticated routes (Any User) */}
						<Route element={<RequireAuth allowedRoles={[2119]} />} >
							<Route path='/chat' element={<Chat />} />
							<Route path='/settings' element={<Settings />} />
							<Route path='/edit' element={<EditProfile />} />
							<Route path='/ordersandpayments' element={<OrdersAndPayments />} />
							<Route path='/bookings' element={<MyBookingsRedirect />} />
							<Route path='/calendar' element={<Calendar />} />
						</Route>

						{/* Teacher Only Routes */}
						<Route element={<RequireAuth allowedRoles={[205]} />} >
							<Route path='/editcourse/:courseID' element={<EditCourse />} />
							<Route path='/editphotos' element={<EditPhotos />} />
							<Route path='/stripeonboarding/:userName' element={<PayoutSetup />} />
							<Route path='/payouts' element={<PayoutSetup />} />
							<Route path='/payouts/return' element={<PayoutSetup mode='returned' />} />
							<Route path='/payouts/refresh' element={<PayoutSetup mode='refresh' />} />
							<Route path='teacher/bookings/:id' element={<SingleBookingPage />} />
							<Route path='/flow' element={<UpdatedProgressBar />} />
						</Route>

						{/* Student Only Routes */}
						<Route element={<RequireAuth allowedRoles={[1920]} />} >
							<Route path='student/bookings/:id' element={<SingleBookingPageForStudent />} />
						</Route>

						{/* Admin Only Routes */}
						<Route element={<RequireAuth allowedRoles={[1413]} />} >
							<Route path='/admin' element={<AdminArtists />} />
						</Route>

						{/* Catch all 404 page */}
						<Route path='*' element={<PageNotFound />} />
					</Route>
				</Route>
			</Routes>
			</ConfirmProvider>
			</ToastProvider>
		</ThemeProvider>
	);
}

export default App;
