import React, { useEffect } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import useStore from '../../../store';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';
import SessionScheduler from '../../SessionScheduler/SessionScheduler';
import DurationSelect from '../../SessionScheduler/DurationSelect';
import { browserTimeZone } from '../../../utils/sessionTime';

let draftKey = 0;

/**
 * Wizard step: how long a session is, and when sessions happen. Nothing is saved until
 * "Go live"; sessions are kept in the store as { key, date: 'YYYY-MM-DD', startTime: 'HH:mm' }.
 */
const AvailabilityStep = ({ setIsNextDisabled }) => {
    const { newCourseDuration, setNewCourseDuration, newCourseTimeslots, setNewCourseTimeslots } = useStore();
    // Drop anything left over from the old scheduler format.
    const drafts = (newCourseTimeslots || []).filter((slot) => slot?.date && slot?.startTime);

    useEffect(() => {
        setIsNextDisabled(drafts.length === 0);
    }, [drafts.length, setIsNextDisabled]);

    return (
        <Box sx={{ py: 4, pb: 16 }}>
            <PremiumSectionHeader
                title="When can guests come?"
                subtitle="Set how long each session lasts, then add the dates you're hosting."
                align="center"
            />
            <Container maxWidth="sm" sx={{ mt: 4, px: { xs: 0, sm: 2 } }}>
                <Stack spacing={4}>
                    <Box>
                        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 1.5 }}>Session length</Typography>
                        <DurationSelect value={newCourseDuration} onChange={setNewCourseDuration} />
                    </Box>
                    <SessionScheduler
                        mode="draft"
                        sessions={drafts}
                        durationMinutes={newCourseDuration}
                        timezone={browserTimeZone()}
                        onAdd={(entries) => {
                            const added = entries.map((entry) => ({ ...entry, key: `draft-${draftKey++}` }));
                            setNewCourseTimeslots([...drafts, ...added]);
                        }}
                        onRemove={(slot) => setNewCourseTimeslots(drafts.filter((d) => d.key !== slot.key))}
                    />
                </Stack>
            </Container>
        </Box>
    );
};

export default AvailabilityStep;
