import {
    Avatar,
    Box,
    Button,
    Dialog,
    IconButton,
    InputAdornment,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Skeleton,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import useStore from '../../store';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useToast } from '../../ui/feedback';

const MIN_SEARCH_LENGTH = 2;

/** "New message": find someone by name or username and open a conversation with them. */
const SearchUsers = () => {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { setSelectedChat } = useStore();
    const axiosPrivate = useAxiosPrivate();
    const toast = useToast();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const close = () => {
        setOpen(false);
        setSearch('');
        setResults([]);
    };

    // Search as you type (after a short pause).
    useEffect(() => {
        const query = search.trim();
        if (query.length < MIN_SEARCH_LENGTH) {
            setResults([]);
            setIsLoading(false);
            return undefined;
        }
        setIsLoading(true);
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const { data } = await axiosPrivate.get('chat/allUsers', { params: { search: query }, signal: controller.signal });
                setResults(Array.isArray(data) ? data : []);
            } catch (err) {
                if (controller.signal.aborted) return;
                setResults([]);
                toast.error("Search isn't working right now. Please try again.");
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }, 300);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [search, axiosPrivate, toast]);

    const openChat = async (person) => {
        try {
            const { data } = await axiosPrivate.get(`chat/accessChats/${person._id}`);
            const { chats, setChats } = useStore.getState();
            if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
            setSelectedChat(data);
            close();
        } catch (err) {
            console.error('Error opening chat:', err.message);
            toast.error("We couldn't open the conversation. Please try again.");
        }
    };

    const query = search.trim();

    return (
        <>
            <Button
                variant="outlined"
                fullWidth
                startIcon={<EditOutlinedIcon />}
                onClick={() => setOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', py: 1 }}
            >
                New message
            </Button>

            <Dialog
                open={open}
                onClose={close}
                fullScreen={isMobile}
                fullWidth
                maxWidth="xs"
                aria-labelledby="new-message-title"
                sx={{ zIndex: 200000 }}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px', minHeight: isMobile ? undefined : 420 } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1 }}>
                    <Typography id="new-message-title" variant="h6" component="h2" sx={{ fontWeight: 800 }}>New message</Typography>
                    <IconButton onClick={close} aria-label="Close" size="small" sx={{ bgcolor: 'background.paper' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ px: 2, pb: 1 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        placeholder="Search by name or username"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        inputProps={{ 'aria-label': 'Search people by name or username', autoCapitalize: 'none', autoCorrect: 'off' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 2 }} aria-live="polite">
                    {isLoading ? (
                        [0, 1, 2].map((i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1, py: 1.25 }} aria-hidden>
                                <Skeleton variant="circular" width={44} height={44} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton width="50%" />
                                    <Skeleton width="30%" />
                                </Box>
                            </Box>
                        ))
                    ) : query.length < MIN_SEARCH_LENGTH ? (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 2 }}>
                            Find an artist or guest to message. Type at least {MIN_SEARCH_LENGTH} letters of their name.
                        </Typography>
                    ) : results.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 2 }}>
                            No one found for "{query}". Check the spelling, or try their username.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {results.map((person) => (
                                <ListItemButton key={person._id} onClick={() => openChat(person)} sx={{ borderRadius: '12px' }}>
                                    <ListItemAvatar>
                                        <Avatar src={person.profileImage?.url} alt="" sx={{ width: 44, height: 44 }} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={[person.firstName, person.lastName].filter(Boolean).join(' ') || person.userName}
                                        secondary={`@${person.userName}${person.isTeacher ? ' · Artist' : ''}`}
                                        primaryTypographyProps={{ fontWeight: 700 }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Box>
            </Dialog>
        </>
    )
}

export default SearchUsers;
