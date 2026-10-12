import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useStore from '../store';
import useAxiosPrivate from './useAxiosPrivate';
import { useToast } from '../ui/feedback';

/** Number of conversations with messages the user hasn't read (for the nav badge). */
export const unreadConversations = (chats) => (chats || []).filter((chat) => chat.unreadCount > 0).length;

/**
 * Keeps the inbox (`chats` in the store) up to date for the whole app: loads it on sign-in and
 * applies live messages from the socket, so unread badges are right on every page.
 * The open conversation adds live messages itself (see SingleChat).
 */
const useMessagingSync = () => {
    const { userID, socket } = useStore();
    const axiosPrivate = useAxiosPrivate();
    const location = useLocation();
    const toast = useToast();
    const onChatPage = location.pathname.startsWith('/chat');

    useEffect(() => {
        if (!userID) return undefined;
        let cancelled = false;
        axiosPrivate.get(`chat/fetchChats/${userID}`)
            .then(({ data }) => { if (!cancelled) useStore.getState().setChats(Array.isArray(data) ? data : []); })
            .catch((err) => console.error('Error loading conversations:', err.message));
        return () => { cancelled = true; };
    }, [userID, axiosPrivate]);

    useEffect(() => {
        if (!socket) return undefined;
        const handleMessage = (message) => {
            const chatId = message?.chat?._id;
            if (!chatId) return;
            const { chats, setChats, selectedChat } = useStore.getState();
            const isOpen = onChatPage && selectedChat?._id === chatId;
            const existing = chats.find((c) => c._id === chatId);
            const updated = {
                ...(existing || message.chat),
                latestMessage: message,
                unreadCount: isOpen ? 0 : (existing?.unreadCount || 0) + 1,
            };
            setChats([updated, ...chats.filter((c) => c._id !== chatId)]);
            if (!onChatPage) {
                toast.info(`New message from ${message.sender?.firstName || 'someone'}`);
            }
        };
        socket.on('messageReceived', handleMessage);
        return () => socket.off('messageReceived', handleMessage);
    }, [socket, onChatPage, toast]);
};

export default useMessagingSync;
