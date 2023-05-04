import React from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import HomeIcon from '@mui/icons-material/Home';
import theme from '../../theme.js';
import './SimpleBottomNavigation.css'

const SimpleBottomNavigation = () => {

  const [value, setValue] = React.useState(0);
  const {userName, isTeacher, isStudent} = useStore()
  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <BottomNavigation
      style={{ 
        // backgroundColor: '#00aeef', 
        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff',
        boxShadow: '0px -1px 10px 1px #00aeef',
        alignItems:"flex-end", 
        zIndex:100, 
        width:'100%', 
        justifyContent:'space-evenly', 
        position:'fixed', 
        bottom:0 
        }}
      value={value}
      onChange={handleChange}
    >

      <BottomNavigationAction onClick={()=>navigate('/')} value="home" icon={<HomeIcon sx={{ fontSize: 34 }}/>} />
      <BottomNavigationAction onClick={()=>navigate('/MapOpen')} value="search" icon={<ExploreRoundedIcon sx={{ fontSize: 34 }}/>} /> 
      {/* <BottomNavigationAction onClick={()=>navigate('/favorites')} value="favorites" icon={<FavoriteIcon sx={{ fontSize: 34 }}/>} />  */}
      <BottomNavigationAction value="profile" icon={<AccountCircleRoundedIcon sx={{ fontSize: 34 }}/>}
        onClick={()=>navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)} />
    
    </BottomNavigation>
  );
};

export default SimpleBottomNavigation;