import RequireAuth from './RequireAuth';
import axios from 'axios'
import PersistLogin from './components/Profile/PersistLogin'
import { Routes, Route } from 'react-router-dom';
import { Opening, Role } from './components/index';
import UpdatedProgressBar from './components/TopNavBar/UpdatedProgressBar';
import Major from './components/Student/Major.jsx';
import StudentProfile from './components/Profile/StudentProfile/StudentProfile';
import TeacherProfile from './components/Profile/TeacherProfile/TeacherProfile';
import Signup from './components/Auth/Signup';
import MapOpen from './components/OpeningMap/MapOpen';
import Course from './components/Course/Course';
import Forgot from './components/Auth/ForgotPassword/ForgotPassword';
import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme.js';
import Settings from './components/Settings/Settings';
import ToggleDays from './components/SessionCreation/ToggleDays/ToggleDays';
import EditProfile from './components/Profile/EditProfile';
import Explore from './components/Explore/Explore';
import EditCourse from './components/Profile/TeacherProfile/EditCourse';
import EditPhotos from './components/Profile/TeacherProfile/EditPhotos';
import Confirm from './components/Course/Confirm';
import BookingPage from './components/Booking/BookingPage';
import SingleBookingPage from './components/Booking/SingleBookingPage';
import TermsOfService from './components/Settings/TermsOfService';
import Payment from './components/Course/Payment';
import SingleBookingPageForStudent from './components/Booking/SingleBookingPageForStudent';
import Privacy from './components/Settings/Privacy';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import OrdersAndPayments from './components/Profile/OrdersAndPayments';
import Chat from './components/Chat/Chat';
import Layout from './Layout'
import Unauthorized from './components/Unauthorized'
import StripeOnboarding from './components/SessionCreation/StripeOnboarding/StripeOnboarding';
import Calendar from './components/Calendar/Calendar.jsx';
import LandingPage from './components/LandingPage/LandingPage.jsx';

axios.defaults.withCredentials = true;

function App() {
	let stripePromise
	if (process.env.NODE_ENV === 'production') {
		stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY)
	} else {
		stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_TEST_KEY)
	}
	// const [isAuthenticating, setIsAuthenticating] = useState(true);
	// const {setAuth, persist, setPersist} = useAuth()

	// // Effectively persist the user login by checking for it in this top-level component
	// useEffect(async () => {
	// 	const authResult = await axios.get(`user/persistCheck`, 
	// 		{headers: {'Content-Type': 'application/json'}, withCredentials: true})
	// 	if (authResult) {
	// 		setAuth(authResult);
	// 	}
	// 	setIsAuthenticating(false);

	// 	if (isAuthenticating) {
	// 		return null; // or loading or whatever
	// 	}
	// }, [])


	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Routes>
				<Route path='/' element={<Layout />} >
					<Route element={<PersistLogin />} >
						{/* Public routes */}
						<Route path='/' element={<Opening />} />
						<Route path='/role' element={<Role />} />
						<Route path='/majors' element={<Major />} />
						<Route path='/termsofservice' element={<TermsOfService />} />
						<Route path='/privacy' element={<Privacy />} />
						<Route path='/forgot' element={<Forgot />} />
						<Route path='landing' element={<LandingPage />} />
						<Route path='/explore' element={<Explore />} />
						<Route path='/sign-up' element={<Signup isTeacher={true} />} />
						<Route path='/student-sign-up' element={<Signup isStudent={true} />} />
						<Route path='/unauthorized' element={<Unauthorized />} />

						{/* Public Profile Viewers */}
						<Route path='/teachers/:userName' element={<TeacherProfile />} />
						<Route path='/teachers/:userName/:course' element={<Course />} />
						<Route path='/students/:userName' element={<StudentProfile />} />
						<Route path='/students' element={<h1 style={{ padding: '10px' }}>This is where your personal page will be when you sign up.</h1>} />

						{/* <Route path='/passwordreset' element={<PasswordReset />} /> */}
						{/* Authenticated routes (Any User) */}
						<Route element={<RequireAuth allowedRoles={[2119]} />} >
							<Route path='/chat' element={<Chat />} />
							<Route path='/settings' element={<Settings />} />
							<Route path='/edit' element={<EditProfile />} />
							<Route path='/ordersandpayments' element={<OrdersAndPayments />} />
							<Route path='/bookings' element={<BookingPage />} />
							<Route path='/calendar' element={<Calendar />} />
							<Route path='/payment' element={<Payment />} />
							<Route path='/confirm' element={
								<Elements stripe={stripePromise}>
									<Confirm />
								</Elements>
							} />
							<Route path='/usersonly' element={<p>This pages is for users only (teachers and students).</p>} />
						</Route>

						{/* Teacher Only Routes */}
						<Route element={<RequireAuth allowedRoles={[205]} />} >
							<Route path='/editcourse/:courseID' element={<EditCourse />} />
							<Route path='/editphotos' element={<EditPhotos />} />
							<Route path='/stripeonboarding/:userName' element={<StripeOnboarding />} />
							<Route path='teacher/bookings/:id' element={<SingleBookingPage />} />
							<Route path='/availability' element={<ToggleDays />} />
							<Route path='/FLOW' element={<UpdatedProgressBar />} />
							<Route path='/teachersonly' element={<p>This pages is for teachers only.</p>} />
						</Route>

						{/* Student Only Routes */}
						<Route element={<RequireAuth allowedRoles={[1920]} />} >
							<Route path='student/bookings/:id' element={<SingleBookingPageForStudent />} />
							<Route path='/studentsonly' element={<p>This pages is for students only.</p>} />
						</Route>

						{/* Admin Only Routes */}
						<Route element={<RequireAuth allowedRoles={[1413]} />} >
							{/* Admin specific routes here */}
						</Route>

						{/* Catch all 404 page */}
						<Route path='*' element={<h1>We couldn't find that page.</h1>} />
					</Route>
				</Route>
			</Routes>
		</ThemeProvider>
	);
}

export default App;
