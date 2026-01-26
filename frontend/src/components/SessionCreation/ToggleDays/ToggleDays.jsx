import { Button, Container, Grid, Stack, Typography, useMediaQuery, useTheme, Box } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React, { useState, useEffect } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import LoopIcon from '@mui/icons-material/Loop';
import LengthOfSession from './LengthOfSession';
import { styled } from '@mui/material/styles';
import TimeSelector from './TimeSelector';
import { withStyles } from '@mui/styles';
import useStore from '../../../store';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';
import './ToggleDays.css';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    '& .MuiToggleButtonGroup-grouped': {
        margin: theme.spacing(2),
        '&:not(:first-of-type)': {
            border: '1px solid',
            borderColor: '#000000',
            borderRadius: '20%',
            height: '50px',
            width: '50px',
        },
        '&$selected': {
            color: 'white',
            background: '#000000',
        },
        '&:first-of-type': {
            border: '1px solid',
            borderColor: '#000000',
            borderRadius: '20%',
            height: '50px',
            width: '50px',
        },
    },
}));

const StyledToggle = withStyles({
    selected: {},
    root: {
        color: '#000000',
        borderRadius: '12px', // standard radius
        height: 'auto',
        width: 'auto',
        padding: '12px',
        border: '1px solid #EDEDED',
        '&$selected': {
            color: 'white',
            background: '#000000',
        },
        '&:hover': {
            borderColor: '#000000',
            color: 'white',
            background: '#000000',
        },
        '&:hover$selected': {
            borderColor: '#000000',
            background: '#000000',
        },
    },
})(ToggleButton);

const date = new Date();

const nextDayOfTheWeek = _index => {
    const today = new Date()
    const _date = new Date()
    let newDay = today.getDate() - today.getDay() + _index
    if (newDay <= today.getDate()) {
        newDay += 7
    }
    _date.setDate(newDay);
    return _date
}

const initialState = [

    {
        key: 'Mon',
        label: 'Mon',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(1).toDateString(),
        month: nextDayOfTheWeek(1).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(1).getDate(),
    },
    {
        key: 'Tues',
        label: 'Tue',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(2).toDateString(),
        month: nextDayOfTheWeek(2).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(2).getDate(),
    },
    {
        key: 'Wed',
        label: 'Wed',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(3).toDateString(),
        month: nextDayOfTheWeek(3).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(3).getDate(),
    },
    {
        key: 'Thur',
        label: 'Thu',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(4).toDateString(),
        month: nextDayOfTheWeek(4).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(4).getDate(),
    },
    {
        key: 'Fri',
        label: 'Fri',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(5).toDateString(),
        month: nextDayOfTheWeek(5).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(5).getDate(),
    },
    {
        key: 'Sat',
        label: 'Sat',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(6).toDateString(),
        month: nextDayOfTheWeek(6).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(6).getDate(),
    },
    {
        key: 'Sun',
        label: 'Sun',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(0).toDateString(),
        month: nextDayOfTheWeek(0).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(0).getDate(),
    }
];

const ToggleDays = (props) => {
    const [days, setDays] = useState([...initialState.slice((date.getDay() + 1) % 7), ...initialState.slice(0, (date.getDay() + 1) % 7)])
    const [courseStartTime, setCourseStartTime] = useState('12:00');
    const [selectedDay, setSelectedDay] = useState();
    const { setClassDays, capacity, newCourseTimeslots, setNewCourseTimeslots, timeslotsToRemove, setTimeslotsToRemove } = useStore();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (!props?.isExistingCourse) {
        props.setIsNextDisabled(!Boolean(newCourseTimeslots.length))
    }

    const toRemove = (startDate, i, _id, tempID) => {
        const timeslotEl = document.getElementById(`timeslot-${i}`)
        if (timeslotEl) {
            timeslotEl.classList.add('toRemove')
        }
        if ((_id !== undefined) && (timeslotsToRemove.indexOf(_id) < 0)) {
            setTimeslotsToRemove([...timeslotsToRemove, _id])
        }
        if ((_id === undefined) && (timeslotsToRemove.indexOf(tempID) < 0)) {
            setTimeslotsToRemove([...timeslotsToRemove, tempID])
        }
    }

    const _today = new Date()
    _today.setHours(0, 0, 0, 0)

    const insertNewTimeslotElements = (slot, i) => {
        const slotDate = new Date(slot.startDate)
        if (slotDate >= _today) {
            const dayContainer = document.getElementById(`${slot.dayOfWeek}-container`)
            if (dayContainer !== null) {
                const child = document.createElement('div')
                child.innerHTML = `
                <div id='timeslot-${i}' class='existingTimeslot'>
                <div>${slot.startTime}</div>
                <button class='toRemoveButton' id='remove-${slot.startDate}'>x</button>
                </div>`
                dayContainer.appendChild(child)
                setTimeout(() => {
                    const el = document.getElementById(`timeslot-${i}`)
                    if (el) {
                        el.addEventListener('click', (e) => {
                            e.preventDefault()
                            toRemove(slot.startDate, i, slot?._id, slot?.tempID)
                        })
                    }
                }, 250)

            }
        }
    }

    useEffect(() => {
        setTimeslotsToRemove([])
        if (Array.isArray(newCourseTimeslots)) {
            for (let i = 0; i < newCourseTimeslots.length; i++) {
                const slot = newCourseTimeslots[i];
                if (slot) insertNewTimeslotElements(slot, i);
            }
        }
    }, [])

    const handleSave = (index, isRepeating, dayKey) => {
        if (!days[index]) return;

        const activeBtn = document.getElementById(`datePickerButton-${dayKey}`)
        if (activeBtn) {
            const child = document.createElement('div')
            child.innerHTML = '<div class="addedTimeslotIndicator"></div>'
            activeBtn.appendChild(child)
        }
        const timestamp = new Date()

        const course_timeslot = {
            startTime: courseStartTime,
            endTime: days[index]['End Time'],
            dayOfWeek: days[index]['key'],
            startDate: days[index]['fullDate'],
            capacity,
            enrolledStudents: [],
            enrollment: 0,
            isRepeating,
            tempID: timestamp.getTime()
        }
        insertNewTimeslotElements(course_timeslot, newCourseTimeslots.length)
        let _updatedTimeslots = [...(newCourseTimeslots || []), course_timeslot]

        // Robust sorting
        _updatedTimeslots.sort((a, b) => {
            if (!a.startTime || !b.startTime) return 0;
            return a.startTime.localeCompare(b.startTime);
        });

        setSelectedDay(undefined)
        setNewCourseTimeslots(_updatedTimeslots)
    }

    useEffect(() => {
        if (typeof setClassDays === 'function') {
            setClassDays(days);
        }
    }, [days, setClassDays]);

    function handleChange(event, newValue) {
        if (newValue !== null && newValue !== undefined) {
            setSelectedDay(newValue);
        }
    }

    return (
        <Box sx={{ py: 4, pb: 12 }}>
            <PremiumSectionHeader
                title="Availability"
                subtitle="Set your session length and weekly hosting schedule."
                align="center"
            />

            <Box sx={{ mt: 4 }}>
                {!props?.isExistingCourse && <LengthOfSession />}

                <Container maxWidth="md">
                    {/* Day Selection Section */}
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 2, display: 'block', textAlign: 'center' }}>
                            Select Days
                        </Typography>
                        <StyledToggleButtonGroup
                            value={selectedDay}
                            exclusive
                            onChange={handleChange}
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: 1,
                                '& .MuiToggleButtonGroup-grouped': {
                                    margin: 0,
                                    border: '1px solid #EDEDED !important',
                                    borderRadius: '12px !important',
                                    flex: { xs: '1 0 30%', sm: '0 0 auto' },
                                    minWidth: '64px',
                                    height: 'auto',
                                    py: 1.5
                                }
                            }}
                        >
                            {(Array.isArray(days) ? days : []).map((day, index) => (
                                <StyledToggle
                                    key={day?.key ?? index}
                                    value={index}
                                    aria-label={day?.key}
                                >
                                    <Stack alignItems="center" spacing={0.5}>
                                        <Typography variant="caption" sx={{ lineHeight: 1, color: 'text.secondary', fontSize: '0.65rem' }}>{day?.month} {day?.dayNum}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1, fontSize: '0.9rem' }}>{isMobile ? day?.label : day?.key}</Typography>
                                    </Stack>
                                </StyledToggle>
                            ))}
                        </StyledToggleButtonGroup>
                    </Box>

                    {/* Active Day Time Selector Area */}
                    {selectedDay !== undefined && selectedDay !== null && days[selectedDay] && (
                        <Box sx={{
                            p: 4,
                            bgcolor: 'rgba(0,0,0,0.02)',
                            borderRadius: 4,
                            mb: 6,
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}>
                                {days[selectedDay].key}
                            </Typography>

                            <Grid container alignItems="center" spacing={3} justifyContent="center">
                                <Grid item xs={12} sm={6} md={5}>
                                    <TimeSelector
                                        courseStartTime={courseStartTime}
                                        setCourseStartTime={setCourseStartTime}
                                        dayIndex={selectedDay}
                                        label='Start Time'
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={5}>
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            variant='outlined'
                                            fullWidth
                                            size='large'
                                            endIcon={<LoopIcon />}
                                            onClick={e => { handleSave(selectedDay, true, days[selectedDay].key) }}
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                borderColor: 'rgba(0,0,0,0.1)',
                                                color: 'text.primary'
                                            }}
                                        >
                                            Repeat
                                        </Button>
                                        <Button
                                            variant='contained'
                                            fullWidth
                                            size='large'
                                            onClick={e => { handleSave(selectedDay, false, days[selectedDay].key) }}
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                bgcolor: 'text.primary',
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                                            }}
                                        >
                                            Save
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                {/* Timeslots are injected into the 'Weekly Schedule' containers below */}
                            </Box>
                        </Box>
                    )}

                    {/* Weekly Schedule Preview */}
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 2, display: 'block', textAlign: 'center' }}>
                            Your Schedule
                        </Typography>
                        {(newCourseTimeslots?.length === 0 || !Array.isArray(newCourseTimeslots)) && (
                            <Typography variant="body2" color="text.secondary" align="center">No timeslots added yet.</Typography>
                        )}
                        <Grid container spacing={2}>
                            {(Array.isArray(days) ? days : []).map((day, idx) => {
                                if (!day) return null;
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={day.key ?? idx}>
                                        <Box
                                            id={`${day.key}-container`}
                                            sx={{
                                                p: 2.5,
                                                border: '1px solid rgba(0,0,0,0.05)',
                                                borderRadius: 3,
                                                minHeight: '120px',
                                                bgcolor: 'background.paper'
                                            }}
                                        >
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.85rem' }}>{day.key}</Typography>
                                            {/* DOM injection happens here */}
                                        </Box>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Box>

                </Container>
            </Box>
        </Box>
    );
};

export default ToggleDays;