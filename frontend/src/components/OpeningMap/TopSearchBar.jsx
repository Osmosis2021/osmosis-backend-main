import React from 'react'
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
// import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import { Link } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

import logo from '../../assets/studio_time_logo.png';
import music from '../../assets/icons/music.png';
import sports from '../../assets/icons/sports.png';
import yoga from '../../assets/icons/yoga.png';
import chef from '../../assets/icons/cook.png';
import dance from '../../assets/icons/dance.png';




function SearchBar() {



  return (
    <div>

      {/* <AppBar position="static" style={{width:'100%', height:'10vh', padding:0, justifyContent:'space-evenly',}}> */}
      <Toolbar style={{ justifyContent: 'center', alignItems: 'center' }}>
        {/* <IconButton edge="start" color="inherit" aria-label="menu"  >
        <Link to='/'><img src={logo} style={{width:'50px', paddingRight:'5%'}} alt='logo'></img></Link>
      </IconButton> */}

        <Button style={{ fontFamily: 'Poppins', color: '#000000' }} color="inherit"><Box><Stack ><img src={music} alt='music' style={{ width: 20 }} /></Stack></Box></Button>
        <Button style={{ fontFamily: 'Poppins', color: '#000000' }} color="inherit"><Box><Stack ><img src={sports} alt='sports' style={{ width: 20 }} /></Stack></Box></Button>
        <Button style={{ fontFamily: 'Poppins', color: '#000000' }} color="inherit"><Box><Stack ><img src={chef} alt='chef' style={{ width: 20 }} /></Stack></Box></Button>
        <Button style={{ fontFamily: 'Poppins', color: '#000000' }} color="inherit"><Box><Stack ><img src={dance} alt='dance' style={{ width: 20 }} /></Stack></Box></Button>
        <Button style={{ fontFamily: 'Poppins', color: '#000000' }} color="inherit"><Box><Stack ><img src={yoga} alt='yoga' style={{ width: 20 }} /></Stack></Box></Button>

      </Toolbar>
      {/* </AppBar> */}
    </div>
  )
}

export default SearchBar