import { Routes, Route } from 'react-router-dom';
import { 
	Opening, 
	Role, 
	// PageNotFound, 
	// GetClasses
} from './components/index';

import UpdatedProgressBar from './components/TopNavBar/UpdatedProgressBar';
import Major from './components/Student/Major.jsx';
// import GetCourse from './components/Student/GetCourse';

// import Login from './components/Auth/Login';


import StudentProfile from './components/Profile/StudentProfile/StudentProfile';
import TeacherProfile from './components/Profile/TeacherProfile/TeacherProfile';
import Signup from './components/Auth/Signup';
import MapOpen from './components/OpeningMap/MapOpen';
import Course from './components/Course/Course';
import Carousel from './components/SessionCreation/PhotoHandling/Carousel/Carousel';

// import StudentviewingTeacherProfile from './components/studentViewingTeacherProfile';

// import Profile from './teacherComponents/Profile/Profile';
import Forgot from './components/Auth/ForgotPassword/ForgotPassword';

import './App.css';

import { ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
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
import axios from 'axios';
import Payment from './components/Course/Payment';
import SingleBookingPageForStudent from './components/Booking/SingleBookingPageForStudent';
import Privacy from './components/Settings/Privacy';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

axios.defaults.withCredentials = true;

function App() {
	const stripePromise = loadStripe('pk_live_51NEDr1EXMtM9g584AK4nAQEYtR0SPnJe9j26tOFo1NuIQo1oYCgltKv3RNp7mHKDIMIRpo98lU3it2MPCCTfJJay002KYxktGX');
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<main>
				<Routes>
					<Route path='/' element={<Opening />} />
					<Route path='/role' element={<Role />} />
					<Route path='/majors' element={<Major />} />
					{/* <Route path='/classes' element={<GetClasses />} /> */}
					{/* <Route path='/classes/:course' element={<GetCourse />} /> */}
					{/* <Route path='/*' element={<PageNotFound />} /> */}

					{/* TEACHER */}

					<Route path='/teachers/:userName' element={<TeacherProfile />} />

					<Route path='/teachers/:userName/:course' element={<Course />} />

					<Route path='/editcourse/:courseID' element={<EditCourse />} />

					<Route path='/editphotos' element={<EditPhotos />} />

					{/* STUDENT */}

					<Route path='/students/:userName' element={<StudentProfile />} />

					<Route path='/settings' element={<Settings />} />

					<Route path='/edit' element={<EditProfile />} />
					<Route path='/confirm' element={
						<Elements stripe={stripePromise}>
                            <Confirm />
                        </Elements>
					} />
					
				
					<Route path='/bookings' element={<BookingPage />} />

					<Route path='teacher/bookings/:id' element={<SingleBookingPage />} />
					<Route path='student/bookings/:id' element={<SingleBookingPageForStudent />} />

					<Route path='/payment' element={<Payment />} />

					<Route path='/termsofservice' element={<TermsOfService />} />
					<Route path='/privacy' element={<Privacy />} />

					{/* <Route path='/passwordreset' element={<PasswordReset />} /> */}
					{/* <Route path='/src/teacherComponents/Map/Map' element={<Maap/>}/> */}
					{/* <Route path='/teacherComponents/Calendar' element={<Calendar/>} /> */}

					<Route path='/forgot' element={<Forgot />} />

					{/* TO RENDER TEACHER FLOW INPUT ELEMENTS FOR PRODUCTION */}
					<Route path='/availability' element={<ToggleDays />} />
					<Route path='/FLOW' element={<UpdatedProgressBar />} />

					<Route path='/explore' element={<Explore />} />
					{/* SIGN UP PROMPT FOR TEACHERS*/}
					<Route path='/sign-up' element={<Signup isTeacher={true}/>} />
					{/* SIGN UP PROMPT FOR STUDENTS*/}
					<Route path='/student-sign-up' element={<Signup isStudent={true}/>} />

					{/* MAP */}
					<Route path='/MapOpen' element={<MapOpen />} />
				</Routes>
			</main>
		</ThemeProvider>
	);
}

export default App;
