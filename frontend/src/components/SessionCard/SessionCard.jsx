import React from 'react';
import { Avatar, Box, CardContent, CardMedia, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { PremiumCard } from '../../ui/PremiumCard';
import { PremiumChip } from '../../ui/PremiumChip';
import { formatDuration, formatSessionDate, formatClockTime } from '../../utils/sessionTime';
import { industryIcon } from '../../utils/industryIcon';

function SessionCard(props) {
    const {
        images,
        courseTitle,
        industry,
        tags,
        price,
        capacity,
        firstName,
        lastName,
        city,
        profileImage,
        duration,
        nextSession,       // { startDate, startTime, spotsLeft } or null; undefined hides the line
        paymentsReady = true, // false while the artist finishes payout setup
    } = props;

    const nextLine = nextSession === undefined ? null
        : !paymentsReady ? 'Bookings open soon'
        : nextSession
            ? `${formatSessionDate(nextSession, { weekday: 'short', month: 'short', day: 'numeric' })} · ${formatClockTime(nextSession.startTime)}${nextSession.spotsLeft <= 2 ? ` · ${nextSession.spotsLeft} ${nextSession.spotsLeft === 1 ? 'spot' : 'spots'} left` : ''}`
            : 'New dates coming soon';

    const renderImage = () => {
        if (images) {
            return (
                // Every card's photo has the same shape (4:3), whatever the original photo's size.
                <CardMedia
                    component="img"
                    image={images}
                    alt=""
                    sx={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '4 / 3',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                    }}
                />
            );
        }

        return (
            <Box
                sx={{
                    aspectRatio: '4 / 3',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    textAlign: 'center'
                }}
            >
                <img
                    src={industryIcon(industry)}
                    alt={industry}
                    style={{ width: '48px', height: '48px', opacity: 0.5, marginBottom: '12px' }}
                />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {courseTitle}
                </Typography>
            </Box>
        );
    };

    return (
        <PremiumCard hoverable sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                {renderImage()}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: 'primary.main',
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    ${price}<Box component="span" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.75rem' }}> / guest</Box>
                </Box>
            </Box>

            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Stack spacing={1.5}>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                lineHeight: 1.3,
                                mb: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                height: '2.6em'
                            }}
                        >
                            {courseTitle}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                                src={profileImage}
                                sx={{ width: 20, height: 20 }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {firstName} {lastName}
                            </Typography>
                        </Stack>
                    </Box>

                    {/* Each fact stays on one line; the row wraps between facts on narrow cards. */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        sx={{
                            color: 'text.secondary',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            flexWrap: 'wrap',
                            columnGap: 1.5,
                            rowGap: 0.25,
                            '& > *': { whiteSpace: 'nowrap' },
                        }}
                    >
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <AccessTimeIcon sx={{ fontSize: 16 }} aria-hidden />
                            <Typography variant="inherit">{formatDuration(duration || 60)}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <PeopleIcon sx={{ fontSize: 16 }} aria-hidden />
                            <Typography variant="inherit">Up to {capacity}</Typography>
                        </Stack>
                        {city && (
                            <>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                    <LocationOnIcon sx={{ fontSize: 16 }} aria-hidden />
                                    <Typography variant="inherit">{city}</Typography>
                                </Stack>
                            </>
                        )}
                    </Stack>

                    {nextLine && (
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: nextSession && paymentsReady ? 'text.primary' : 'text.secondary' }}>
                            <EventAvailableIcon sx={{ fontSize: 18 }} aria-hidden />
                            <Typography variant="body2" sx={{ fontWeight: nextSession && paymentsReady ? 700 : 500 }}>
                                {nextSession && paymentsReady ? `Next: ${nextLine}` : nextLine}
                            </Typography>
                        </Stack>
                    )}

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {tags?.slice(0, 3).map((tag, index) => (
                            <PremiumChip key={index} label={tag} />
                        ))}
                        {tags?.length > 3 && (
                            <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', fontWeight: 600 }}>
                                +{tags.length - 3}
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </PremiumCard>
    );
}

export default SessionCard;