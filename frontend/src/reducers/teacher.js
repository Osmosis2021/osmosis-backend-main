import {
	LOGIN_SUCCESS,
	LOGIN_FAIL,
	USER_LOADED_SUCCESS,
	USER_LOADED_FAIL,
	CREATE_COURSE_SUCCESS,
	AUTHENTICATED_FAIL,
	PASSWORD_RESET_SUCCESS,
	PASSWORD_RESET_FAIL,
	PASSWORD_RESET_CONFIRM_SUCCESS,
	PASSWORD_RESET_CONFIRM_FAIL,
	SIGNUP_SUCCESS,
	SIGNUP_FAIL,
	ACTIVATION_SUCCESS,
	ACTIVATION_FAIL,
	LOGOUT,
} from '../actions/types';

const initialState = {
	industry: localStorage.getItem('indusrty'),
	generalTag: localStorage.getItem('tag'),
	duration: localStorage.getItem('duration'),
	time: localStorage.getItem('time'),
	loaction: localStorage.getItem('location'),
	user: sessionStorage.getItem('user'),
};

export default function (state = initialState, action) {
	const { type, payload } = action;

	switch (type) {
		case CREATE_COURSE_SUCCESS:
			return {
				...state,
				isAuthenticated: true,
			};
		case LOGIN_SUCCESS:
		case SIGNUP_SUCCESS:
			return {
				...state,
				isAuthenticated: false,
			};
		case USER_LOADED_SUCCESS:
			return {
				...state,
				user: payload,
			};
		case AUTHENTICATED_FAIL:
			return {
				...state,
				isAuthenticated: false,
			};
			localStorage.removeItem('access');
			localStorage.removeItem('refresh');
			return {
				...state,
				access: null,
				refresh: null,
				isAuthenticated: false,
				user: null,
			};
		default:
			return state;
	}
}