import { create } from "zustand"
import { Capacitor } from '@capacitor/core'

const useStore = create(set => ({
    platform: Capacitor.getPlatform() || 'ios',  //  'web', 'ios' or 'android'

    backendURL: (() => {
        let url = process.env.REACT_APP_API_URL;
        if (url) {
            return url.endsWith('/') ? url : url + '/';
        }
        return process.env.NODE_ENV === 'production' ? 'https://getstudiotime.com/' : 'http://localhost:8126/';
    })(),

    firstName: '',
    setFirstName: firstName => set({ firstName }),

    lastName: '',
    setLastName: lastName => set({ lastName }),

    userName: '',
    setUserName: userName => set({ userName }),

    userID: '',
    setUserID: userID => set({ userID }),

    description: '',
    setDescription: description => set({ description }),

    email: '',
    setEmail: email => set({ email }),

    isTeacher: false,
    setIsTeacher: isTeacher => set({ isTeacher }),

    isStudent: false,
    setIsStudent: isStudent => set({ isStudent }),

    roles: [],
    setRoles: roles => set({ roles }),

    isRegistered: false,
    setIsRegistered: isRegistered => set({ isRegistered }),

    industry: '',
    setIndustry: industry => set({ industry }),

    icon: '',
    setIcon: icon => set({ icon }),

    guestsEntered: '',
    setGuestsEntered: guestsEntered => set({ guestsEntered }),

    tags: [],
    setTags: tags => set({ tags }),

    courseTitle: '',
    setCourseTitle: courseTitle => set({ courseTitle }),

    courseDescription: '',
    setCourseDescription: courseDescription => set({ courseDescription }),

    studioVibe: '',
    setStudioVibe: studioVibe => set({ studioVibe }),

    whatToBring: '',
    setWhatToBring: whatToBring => set({ whatToBring }),

    images: [],
    setImages: images => set({ images }),

    profileImage: '',
    setProfileImage: profileImage => set({ profileImage }),

    classDays: [],
    setClassDays: classDays => set({ classDays }),

    newCourseID: '',
    setNewCourseID: newCourseID => set({ newCourseID }),

    newCourseIndustry: '',
    setNewCourseIndustry: newCourseIndustry => set({ newCourseIndustry }),

    newCourseAddressLine1: '',
    setNewCourseAddressLine1: newCourseAddressLine1 => set({ newCourseAddressLine1 }),

    newCourseAddressLine2: '',
    setNewCourseAddressLine2: newCourseAddressLine2 => set({ newCourseAddressLine2 }),

    newCourseAddressCity: '',
    setNewCourseAddressCity: newCourseAddressCity => set({ newCourseAddressCity }),

    newCourseAddressZipcode: '',
    setNewCourseAddressZipcode: newCourseAddressZipcode => set({ newCourseAddressZipcode }),

    newCourseAddressState: '',
    setNewCourseAddressState: newCourseAddressState => set({ newCourseAddressState }),

    newCourseAddressCountry: '',
    setNewCourseAddressCountry: newCourseAddressCountry => set({ newCourseAddressCountry }),

    newCourseLongitude: -73.9569994,
    setNewCourseLongitude: newCourseLongitude => set({ newCourseLongitude }),

    newCourseLatitude: 40.7297027,
    setNewCourseLatitude: newCourseLatitude => set({ newCourseLatitude }),

    newCourseCost: '',
    setNewCourseCost: newCourseCost => set({ newCourseCost }),

    newCourseTimeslots: [],
    setNewCourseTimeslots: newCourseTimeslots => set({ newCourseTimeslots }),

    timeslotsToRemove: [],
    setTimeslotsToRemove: timeslotsToRemove => set({ timeslotsToRemove }),

    newCourseDuration: 60,
    setNewCourseDuration: newCourseDuration => set({ newCourseDuration }),

    capacity: 1,
    setCapacity: capacity => set({ capacity }),
    increaseCapacity: () => set(state => ({ capacity: state.capacity + 1 })),
    decreaseCapacity: () => set(state => ({ capacity: Math.max(1, state.capacity - 1) })),

    selectedChat: [],
    setSelectedChat: selectedChat => set({ selectedChat }),

    socket: null,
    setSocket: socket => set({ socket }),

    chats: [],
    setChats: chats => set({ chats }),

    notification: [],
    setNotification: notification => set({ notification }),

    paymentMethodID: [],
    setPaymentMethodID: paymentMethodID => set({ paymentMethodID }),

    customerStripeID: [],
    setCustomerStripeID: customerStripeID => set({ customerStripeID }),



}));

export default useStore;



