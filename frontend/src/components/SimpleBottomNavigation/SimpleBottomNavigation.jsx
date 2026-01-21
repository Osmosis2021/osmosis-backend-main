import React from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store";
import { Badge, BottomNavigation, BottomNavigationAction, useMediaQuery } from "@mui/material"; // Added useMediaQuery
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import HomeIcon from '@mui/icons-material/Home';
import theme from '../../theme.js';
import './SimpleBottomNavigation.css'

const SimpleBottomNavigation = () => {

  const [value, setValue] = React.useState(0);
  const { platform, userName, isTeacher, isRegistered, notification, setNotification } = useStore()
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const notificationFunction = () => {
    navigate(`${isRegistered ? '/chat' : '/'}`)
    // Clear the first notification from the array
    if (notification.length > 0) {
      const [, ...restNotifications] = notification;
      setNotification(restNotifications);
    }
  };

  if (!isMobile) return null;

  return (
    <BottomNavigation id='BottomNav' className={`BottomNav-${platform}`}
      style={{
        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff',
        borderTop: '1px solid #EDEDED',
        boxShadow: 'none',
        alignItems: "center",
        zIndex: 100000,
        width: '100%',
        justifyContent: 'space-evenly',
        position: 'fixed',
        bottom: 0,
        paddingTop: '2px',
        // paddingBottom: '25px'
      }}
      value={value}
      onChange={handleChange}
    >

      <BottomNavigationAction onClick={() => navigate(`${isRegistered ? '/explore' : '/'}`)} value="home" icon={<HomeIcon sx={{ fontSize: 34 }} />} />
      <BottomNavigationAction onClick={() => navigate('/MapOpen')} value="search" icon={<ExploreRoundedIcon sx={{ fontSize: 34 }} />} />

      <BottomNavigationAction onClick={notificationFunction} value="messages" icon={
        <Badge badgeContent={notification.length} color="primary">
          <ForumRoundedIcon sx={{ fontSize: 34 }} />
        </Badge>}

      />

      <BottomNavigationAction value="profile" icon={<AccountCircleRoundedIcon sx={{ fontSize: 34 }} />}
        onClick={() => navigate(`${isTeacher ? '/teachers' : '/students'}/${userName}`)} />

    </BottomNavigation>
  );
};

export default SimpleBottomNavigation;