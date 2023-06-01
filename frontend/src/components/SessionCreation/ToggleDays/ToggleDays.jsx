import React, { useState, useMemo, useEffect } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import './ToggleDays.css';
import useStore from '../../../store';
import { Button, Container, Grid, Stack, Typography } from '@mui/material';
import TimeSelector from './TimeSelector';
import LoopIcon from '@mui/icons-material/Loop';
import TopNavBar from '../../TopNavBar/TopNavBar';
import LengthOfSession from './LengthOfSession';


const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(2),

    '&:not(:first-of-type)': {
      border: '1px solid',
      borderColor: '#00aeef',
      borderRadius: '20%',
      height: '50px',
      width: '50px',
    },

    '&$selected': {
      color: 'white',
      background: '#00aeef',
    },

    '&:first-of-type': {
      border: '1px solid',
      borderColor: '#00aeef',
      borderRadius: '20%',
      height: '50px',
      width: '50px',
    },
  },
}));

const StyledToggle = withStyles({
  root: {
    color: '#00aeef',
    '&$selected': {
      color: 'white',
      background: '#00aeef',
    },
    '&:hover': {
      borderColor: '#00aeef',
      color: 'white',
      background: '#00aeef',
    },
    '&:hover$selected': {
      borderColor: '#00aeef',
      background: '#00aeef',
    },
    borderRadius: '20%',
    height: '50px',
    width: '50px',
  },
  selected: {},
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
    key: 'saturday',
    label: 'Sat',
    'Start Time': '',
    'End Time': '',
    fullDate: nextDayOfTheWeek(6).toDateString(),
    month: nextDayOfTheWeek(6).toLocaleString('default', { month: 'short' }),
    dayNum: nextDayOfTheWeek(6).getDate(),
  },
];

const ToggleDays = () => {
  const [courseStartTime, setCourseStartTime] = useState('12:00');
  const { classDays, setClassDays, newCourseID} = useStore();
  const [selectedDay, setSelectedDay] = useState();
  const {newCourseTimeslots, setNewCourseTimeslots} = useStore();
  const [days, setDays] = useState([...initialState.slice((date.getDay() + 1) % 7), ...initialState.slice(0, (date.getDay() + 1) % 7)])
  
  useEffect(() => {
    setNewCourseTimeslots([])
  }, [])

  const handleSave = (index, isRepeating, dayKey) => {
    const activeBtn = document.getElementById(`datePickerButton-${dayKey}`)
    const child = document.createElement('div')
    child.innerHTML = '<div class="addedTimeslotIndicator"></div>'
    activeBtn.appendChild(child)
    
    const course_timeslot = {
      startTime: courseStartTime,
      endTime: days[index]['End Time'],
      enrollment: 0,
      dayOfWeek: days[index]['key'],
      startDate: days[index]['fullDate'],
      isRepeating
    }
    const _updatedTimeslots = [...newCourseTimeslots, course_timeslot]
    setSelectedDay('')
    setNewCourseTimeslots(_updatedTimeslots)
  }
  useMemo(() => setClassDays(days), [days]);

  function handleChange(event) {
    setSelectedDay(Number(event.target.value));
  }

  return (
    <>
      <LengthOfSession/>
      <Typography variant='h3' mb={-2} mt={2} align='center'>
        Enter your availability:
      </Typography>
      {/* <TopNavBar back='/upload' next='/capacity' activeStep='4'/> */}
      <Grid
        container
        direction='column'
        justifyContent='center'
        alignItems='center'
        style={{ marginTop: '10%' }}>
          <Container>
          {days.map((day, index) => (
            <Grid
              container
              style={{ alignItems: 'center' }}
              direction='row'
              spacing={2}>
              <Grid item xs={4}>
                <StyledToggleButtonGroup
                  size='large'
                  arial-label='Days of the week'
                  value={days}
                  onChange={handleChange}
                >
                  <StyledToggle
                    className={`isSelected-${selectedDay === index}`}
                    id={`datePickerButton-${day.key}`}
                    selected={selectedDay === index}
                    key={day.key}
                    value={index}
                    aria-label={day.key}>
                    {day.month} <br />
                    {day.dayNum} <br />
                    {day.label}
                  </StyledToggle>
                </StyledToggleButtonGroup>
              </Grid>
                <Stack
                  spacing={2}
                  item
                  direction='row'
                  className={`display-${
                    selectedDay === index ||
                    Boolean(days[index]['Start Time']) ||
                    Boolean(days[index]['End Time'])}`}
                >
                  <TimeSelector
                    courseStartTime={courseStartTime}
                    setCourseStartTime={setCourseStartTime}
                    dayIndex={index}
                    label='Start Time'
                  />
                  {(index === selectedDay) &&
                  <>
                    <Button variant='contained' size='small' endIcon={<LoopIcon />}
                      onClick={e => {handleSave(index, true, day.key)}}>
                      Repeat
                    </Button>
                    <Button variant='contained' size='small'
                      onClick={e => {handleSave(index, false, day.key)}}>
                      Save
                    </Button>
                  </>
                  }
                </Stack>
            </Grid>
          ))}
          </Container>
      </Grid>
    </>
  );
};

export default ToggleDays;