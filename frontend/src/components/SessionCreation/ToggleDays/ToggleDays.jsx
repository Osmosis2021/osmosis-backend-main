import { Button, Container, Grid, Stack, Typography, useMediaQuery, useTheme, Box } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React, { useState, useMemo, useEffect } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import LoopIcon from '@mui/icons-material/Loop';
import LengthOfSession from './LengthOfSession';
import { styled } from '@mui/material/styles';
import TimeSelector from './TimeSelector';
import { withStyles } from '@mui/styles';
import useStore from '../../../store';
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
        key: 'Sunday',
        label: 'Sun',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(0).toDateString(),
        month: nextDayOfTheWeek(0).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(0).getDate(),
    },
    {
        key: 'Monday',
        label: 'Mon',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(1).toDateString(),
        month: nextDayOfTheWeek(1).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(1).getDate(),
    },
    {
        key: 'Tuesday',
        label: 'Tue',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(2).toDateString(),
        month: nextDayOfTheWeek(2).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(2).getDate(),
    },
    {
        key: 'Wednesday',
        label: 'Wed',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(3).toDateString(),
        month: nextDayOfTheWeek(3).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(3).getDate(),
    },
    {
        key: 'Thursday',
        label: 'Thu',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(4).toDateString(),
        month: nextDayOfTheWeek(4).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(4).getDate(),
    },
    {
        key: 'Friday',
        label: 'Fri',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(5).toDateString(),
        month: nextDayOfTheWeek(5).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(5).getDate(),
    },
    {
        key: 'Saturday',
        label: 'Sat',
        'Start Time': '',
        'End Time': '',
        fullDate: nextDayOfTheWeek(6).toDateString(),
        month: nextDayOfTheWeek(6).toLocaleString('default', { month: 'short' }),
        dayNum: nextDayOfTheWeek(6).getDate(),
    },
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
        timeslotEl.classList.add('toRemove')
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
                    document.getElementById(`timeslot-${i}`)
                        .addEventListener('click', (e) => {
                            e.preventDefault()
                            toRemove(slot.startDate, i, slot?._id, slot?.tempID)
                        })
                }, 250
                )

            }
        }
    }

    useEffect(() => {
        setTimeslotsToRemove([])
        for (let i = 0; i < newCourseTimeslots.length; i++) {
            const slot = newCourseTimeslots[i]
            insertNewTimeslotElements(slot, i)
        }
    }, [])

    const handleSave = (index, isRepeating, dayKey) => {
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
        let _updatedTimeslots = [...newCourseTimeslots, course_timeslot]
        _updatedTimeslots = _updatedTimeslots.sort((a, b) => a.startTime > b.startTime)
        setSelectedDay('')
        setNewCourseTimeslots(_updatedTimeslots)
    }

    useMemo(() => setClassDays(days), [days]);

    function handleChange(event, newValue) {
        if (newValue !== null) {
            setSelectedDay(newValue);
        }
    }

    return (
        <>
            {!props?.isExistingCourse && <LengthOfSession />}

            <Typography variant='h4' mb={-2} mt={2} align='center'>
                Enter your availability this week:
            </Typography>

            <Grid
                mt={2}
                container
                direction='column'
                justifyContent='center'
                alignItems='center'
            >

                <Container maxWidth="md">
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Select a day to add hours:</Typography>
                        <StyledToggleButtonGroup
                            value={selectedDay}
                            exclusive
                            onChange={handleChange}
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                '& .MuiToggleButtonGroup-grouped': {
                                    margin: 0,
                                    border: '1px solid #EDEDED !important',
                                    borderRadius: '12px !important',
                                    flex: '1 0 auto', // Grow to fill
                                    minWidth: '60px',
                                    height: 'auto',
                                    py: 1.5
                                }
                            }}
                        >
                            {days.map((day, index) => (
                                <StyledToggle
                                    key={day.key}
                                    value={index}
                                    aria-label={day.key}
                                >
                                    <Stack alignItems="center" spacing={0.5}>
                                        <Typography variant="caption" sx={{ lineHeight: 1, color: 'text.secondary' }}>{day.month} {day.dayNum}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1 }}>{isMobile ? day.label : day.key}</Typography>
                                    </Stack>
                                </StyledToggle>
                            ))}
                        </StyledToggleButtonGroup>
                    </Box>

                    {/* Active Day Time Selector Area */}
                    {selectedDay !== undefined && selectedDay !== null && (
                        <Box sx={{ p: 3, bgcolor: '#F9F9F9', borderRadius: 4, mb: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                {days[selectedDay].key}
                            </Typography>

                            <Grid container alignItems="center" spacing={2}>
                                <Grid item xs={12} md={8}>
                                    <TimeSelector
                                        courseStartTime={courseStartTime}
                                        setCourseStartTime={setCourseStartTime}
                                        dayIndex={selectedDay}
                                        label='Start Time'
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant='contained' sx={{ color: 'white', boxShadow: 'none', borderRadius: 0, flex: 1 }} size='large' endIcon={<LoopIcon />}
                                            onClick={e => { handleSave(selectedDay, true, days[selectedDay].key) }}>
                                            Repeat
                                        </Button>
                                        <Button variant='contained' sx={{ color: 'white', boxShadow: 'none', borderRadius: 0, flex: 1 }} size='large'
                                            onClick={e => { handleSave(selectedDay, false, days[selectedDay].key) }}>
                                            Save
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>

                            <Box id={`${days[selectedDay].key}-container`} sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {/* Timeslots will be injected here by the DOM logic or we can render them reactively if we refactor 'insertNewTimeslotElements' but let's keep the DOM logic container for now to minimize logic refactor risk, just ensuring it exists */}
                            </Box>
                        </Box>
                    )}

                    {/* Render all day containers hidden or visible? The original code had them per row. 
                        The DOM injection logic looks for `${slot.dayOfWeek}-container`.
                        We need to ensure these containers exist for the 'toRemove' logic to work on existing slots.
                        Let's render a hidden list of containers for ALL days so the legacy DOM logic works, 
                        OR refactor the DOM logic. Refactoring is better but risky.
                        Let's just render the "Summary" of added timeslots below cleanly.
                    */}

                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Weekly Schedule:</Typography>
                        {newCourseTimeslots.length === 0 && (
                            <Typography variant="body2" color="text.secondary">No availability added yet.</Typography>
                        )}
                        <Grid container spacing={2}>
                            {days.map((day, idx) => {
                                // We need to filter timeslots for this day to render them React-ivly instead of DOM injection?
                                // The user prompt said "No logic refactors unless required".
                                // DOM injection relies on IDs. I must preserve the IDs.
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={day.key}>
                                        <Box
                                            id={`${day.key}-container`}
                                            sx={{ p: 2, border: '1px solid #EDEDED', borderRadius: 2, minHeight: '100px' }}
                                        >
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{day.key}</Typography>
                                            {/* DOM injection happens here */}
                                        </Box>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Box>

                </Container>

                {!props?.isExistingCourse &&
                    <Button variant="contained" size="large" align='center'
                        disabled={!Boolean(newCourseTimeslots.length)} onClick={props.handleNext} fullWidth
                        style={{ margin: '15px 0 20px', width: '80%', fontSize: 26, fontFamily: 'Poppins', color: 'white' }}>
                        Next
                    </Button>}

            </Grid>
        </>
    )
}

export default ToggleDays