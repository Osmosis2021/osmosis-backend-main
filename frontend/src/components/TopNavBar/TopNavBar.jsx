import * as React from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import IosShareIcon from '@mui/icons-material/IosShare';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

export default function TopNavBar(props) {
  
  return (
    <Box sx={{ flexGrow: 1}}>
      <AppBar position="absolute" style={{background:'none', boxShadow:'none'}}>
        <Toolbar style={{justifyContent: 'space-between'}}>
          <IconButton
          style={{ background:'#00aeef'}}
            size="medium"
            edge="start"
            color="inherit"
            aria-label="menu"
            // sx={{ mr: 2 }}
          >
          <Link to={props.back} style={{textDecoration:'none'}}>
            <ArrowBackIcon sx={{ flexGrow: 0 }} style={{fontSize:"25px", color:'white'}} />
          </Link>
          </IconButton>

          {/* <Box sx={{ flexGrow: .5 }} /> 
            <Box rowSpacing={2}>
              <IconButton
              style={{ background:'#00aeef', marginRight:'10px'}}
                size="medium"
                edge="end"
                color="inherit"
                aria-label="menu"
                // sx={{ mr: 2 }}
              >
              <Link to='' style={{textDecoration:'none'}}>
                <IosShareIcon sx={{ flexGrow: 0 }} style={{fontSize:"25px", color:'white'}} />
              </Link>
              </IconButton> 
              <IconButton
              style={{ background:'#00aeef'}}
                size="medium"
                edge="end"
                color="inherit"
                aria-label="menu"
                // sx={{ mr: 2 }}
              >
              <Link to='' style={{textDecoration:'none'}}>
                <FavoriteBorderIcon sx={{ flexGrow: 0 }} style={{fontSize:"25px", color:'white'}} />
              </Link>
              </IconButton> 

            </Box> */}
          



          {/* <Typography variant="h4" component="div" sx={{ flexGrow: 1, display: 'flex', color: 'white', justifyContent: 'center' }}>
            Osmosis
          </Typography> */}
          
          {/* <IconButton
            // size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            // sx={{ mr: 2 }}
          >
          <Link to='/settings' style={{textDecoration:'none'}}>
            <SettingsIcon sx={{ flexGrow: 0 }} style={{fontSize:"25px", color:'white'}} />
          </Link>
          </IconButton> */}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
