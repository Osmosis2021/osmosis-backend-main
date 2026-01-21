import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import logo from '../../assets/studio_time_logo.png';
import { flexCenter } from '../../commonStyles';

const Logo = () => {
  return (
    <Box sx={flexCenter}>
      <img src={logo} alt='Studio Time' style={{ height: '35px', width: 'auto' }} />
    </Box>
  );
};

export default Logo;