import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import logo from '../../assets/Osmosis_Logo.png';
import { flexCenter } from '../../commonStyles';

const Logo = () => {
  return (
    <Box sx={flexCenter}>
      <img src={logo} alt='logo' style={{width:'55px'}} />
      <Typography
        sx={{
          ml: 1,
          color: '#00aeef',
          fontFamily: 'futura',
          fontSize: '20px',
        }}
        component="h3"
      >
        Osmosis
      </Typography>
    </Box>
  );
};

export default Logo;