import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAxiosPrivate from './useAxiosPrivate';
import useStore from '../store';
import { useToast } from '../ui/feedback';

/**
 * Opens (or creates) a conversation with another user and goes to Messages.
 * Shared by every "Message artist / guest / host" button.
 *
 * Visitors who aren't signed in are sent to log in and brought back to this page afterwards.
 */
const useStartChat = () => {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    return useCallback(async (otherUserId, { personLabel = 'this person' } = {}) => {
        const { userID } = useStore.getState();
        if (!userID) {
            toast.info(`Log in to message ${personLabel}.`);
            navigate('/', { state: { from: location } });
            return;
        }
        if (!otherUserId) {
            toast.error(`We couldn't find ${personLabel}. Please refresh and try again.`);
            return;
        }
        if (String(otherUserId) === String(userID)) return; // never message yourself

        try {
            const { data } = await axiosPrivate.get(`chat/accessChats/${otherUserId}`);
            const { chats, setChats, setSelectedChat } = useStore.getState();
            if (!chats.find((c) => c._id === data._id)) {
                setChats([data, ...chats]);
            }
            setSelectedChat(data);
            navigate('/chat');
        } catch (err) {
            console.error('Error opening chat:', err);
            toast.error("We couldn't open the conversation. Please try again.");
        }
    }, [axiosPrivate, navigate, location, toast]);
};

export default useStartChat;
