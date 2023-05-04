import React, { useState } from 'react';
import { AppBar, Box, Button, Container, Drawer, Grid, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, styled, Toolbar, Typography } from '@mui/material';
// import { Button, Box, Container, Drawer, Grid, Paper, styled, Typography }  from '@mui/material/';
// import { Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import NotificationsIcon from '@mui/icons-material/Notifications';
import LockIcon from '@mui/icons-material/Lock';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';


import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function TopProfileBar(props) {


    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#00aeef',
        ...theme.typography.heading1,
        padding: theme.spacing(1),
        textAlign: 'center',
        color: 'white',
    }));

    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
      };
    
      const handleClose = () => {
        setOpen(false);
      };


    const SettingOptions = [
    
        {
          name: 'Account',
          icon: <AccountCircleIcon fontSize='large'/>,
          key: 0,
          link: '/edit'
        },
        {
          name: 'Privacy',
          icon: <PrivacyTipIcon fontSize='large'/>,
          key: 1,
          link: '/privacy'
        },
        {
          name: 'Security',
          icon: <LockIcon fontSize='large'/>,
          key: 2,
          link: '/security'
        },
        {
          name: 'Notifications',
          icon: <NotificationsIcon fontSize='large'/>,
          key: 3,
          link: '/notifications'
        },
        {
          name: 'About',
          icon: <InfoIcon fontSize='large'/>,
          key: 4,
          link: '/about'
        },
        {
          name: 'Help',
          icon: <HelpIcon fontSize='large'/>,
          key: 5,
          link: '/help'
        },
        {
          name: 'Logout',
          icon: <LogoutIcon fontSize='large'/>,
          key: 6,
          link: '/'
        },
      ]
  
  return (
    <Box sx={{ flexGrow: 1}}>
      <AppBar position="static">
        <Toolbar style={{justifyContent: 'space-between'}}>
        <Typography variant="h4" component="div" sx={{ flexGrow: 1, display: 'flex', color: 'white', justifyContent: 'left' }}>
            {props.userName}
          </Typography>
          

          <Box sx={{ flexGrow: .5 }} /> 
            <Box rowSpacing={2}>
                <IconButton
                    style={{ marginRight:'7px'}}
                        size="medium"
                        edge="end"
                        color="inherit"
                        aria-label="menu"
                        // sx={{ mr: 2 }}
                        onClick={handleClickOpen}
                    >
                    <Link to='' style={{textDecoration:'none'}}>
                        <AddCircleIcon sx={{ flexGrow: 0 }} style={{fontSize:"35px", color:'white'}} />
                    </Link>
                </IconButton> 


                {/* DIALOG */}

    
      <Dialog
        fullWidth
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle variant='h3' id="alert-dialog-title">
        Create a <span style={{color:'#00aeef'}}>course</span> in 7 steps?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <List>
                <ListItemText> 1. Industry </ListItemText>
                <ListItemText> 2. Tags </ListItemText>
                <ListItemText> 3. Availability </ListItemText>
                <ListItemText> 4. Location </ListItemText>
                <ListItemText> 5. Capacity </ListItemText>
                <ListItemText> 6. Cost </ListItemText>
                <ListItemText> 7. Photos </ListItemText>
            </List>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>Maybe Later</Button>
            <Link to='/FLOW' style={{textDecoration:'none'}}>
                <Button onClick={handleClose}>Lets Begin</Button>
            </Link>
        </DialogActions>
      </Dialog>
   
  


                {/* DIALOG */}


              




                <IconButton
                    //   style={{ background:'#00aeef'}}
                        size="medium"
                        edge="end"
                        color="inherit"
                        aria-label="menu"
                        onClick={()=>setIsDrawerOpen(true)}
                    >
                    <Link to='' style={{textDecoration:'none'}}>
                        <MenuIcon sx={{ flexGrow: 0 }} style={{fontSize:"35px", color:'white'}} />
                    </Link>
                </IconButton> 

                {/* MODAL */}
                <Drawer anchor='bottom' open={isDrawerOpen} onClose={()=> setIsDrawerOpen(false)}>
                <Box p={2} textAlign='center' role='presentation'>
                    <Container>
                        <Grid container spacing={2}>
                        <List style={{width:'100%', display:'flex', flexDirection:'column', justifyContent: 'center', }}>

{SettingOptions.map(setting => (

  <ListItem key={setting.key}>
  <Link to={setting.link} style={{textDecoration:'none', color:'black'}}>
    <ListItemButton>
      <ListItemIcon>
      {setting.icon}
      </ListItemIcon>
      <ListItemText primary={setting.name} />
    </ListItemButton>
    </Link>
  </ListItem>
))}
</List>
                        </Grid>
                    </Container>
                </Box>
            </Drawer>
                {/* MODAL */}

            </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}



        
        
