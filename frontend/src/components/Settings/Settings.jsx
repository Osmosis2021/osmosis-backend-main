import React from 'react';
import { Container, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'; 
import './Settings.css';
import TopNavBar from '../TopNavBar/TopNavBar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LockIcon from '@mui/icons-material/Lock';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';
import { Link } from 'react-router-dom';

export default function Settings() {

  const SettingOptions = [

    {
      name: 'Account',
      icon: <AccountCircleIcon fontSize='large'/>,
      key: 0,
      link: '/account'
    },
    {
      name: 'Orders and Payments',
      icon: <PaymentIcon fontSize='large'/>,
      key: 1,
      link: '/ordersandpayments'
    },
    {
      name: 'Privacy',
      icon: <PrivacyTipIcon fontSize='large'/>,
      key: 2,
      link: '/privacy'
    },
    {
      name: 'Security',
      icon: <LockIcon fontSize='large'/>,
      key: 3,
      link: '/security'
    },
    {
      name: 'Notifications',
      icon: <NotificationsIcon fontSize='large'/>,
      key: 4,
      link: '/notifications'
    },
    {
      name: 'About',
      icon: <InfoIcon fontSize='large'/>,
      key: 5,
      link: '/about'
    },
    {
      name: 'Help',
      icon: <HelpIcon fontSize='large'/>,
      key: 6,
      link: '/help'
    }
  ]

    return (
        <>
            <TopNavBar back='' next='empty' activeStep='empty'/> 
            <br/> 
            <Container>
            <br/>
                <List style={{height: '90vh', width:'100%', display:'flex', flexDirection:'column', justifyContent: 'flex-start', }}>

                    {
                        SettingOptions.map(setting => (
                            <ListItem key={setting.key} >
                                <Link to={setting.link} style={{textDecoration:'none'}}>
                                    <ListItemButton>
                                        <ListItemIcon>
                                            {setting.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={setting.name}/>
                                    </ListItemButton>
                                </Link>
                            </ListItem>
                        ))
                    }
                </List>
            </Container>
        </>
    )
}
