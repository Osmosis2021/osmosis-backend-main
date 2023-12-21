import React from 'react';
import { TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';

function TimeSelector( { courseStartTime, setCourseStartTime }) {
  const handleChange = (newValue) => {
    const { $H, $m } = newValue;
    let time = '';
    if ( $m.toString().length < 2 ) {
      time = `${$H}:0${$m}`;
    } else {
      time = `${$H}:${$m}`;
    }
    setCourseStartTime(time)
  }

  return (
    <div style={{minWidth:'70px'}}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MobileTimePicker
          label='Start Time'
          value={dayjs(`2014-08-18T${courseStartTime}:00`)}
          onChange={newTime => handleChange(newTime)}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
    </div>
  );
}

export default TimeSelector;