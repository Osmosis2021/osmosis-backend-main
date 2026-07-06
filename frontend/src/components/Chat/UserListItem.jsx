import React from 'react'
import useStore from '../../store'
import { Avatar, Card, Grid, IconButton, Typography } from '@mui/material'



const UserListItem = ({ user, handleFunction }) => {

  return (
    <Card onClick={handleFunction} style={{ padding: '5%', backgroundColor: "white", display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
    >

      <Grid container spacing={1} justifyContent='center' alignItems='center' direction='row' style={{ width: '150px' }}>

        <Grid item>
          <Avatar src={user.profileImage.url} />
        </Grid>

        <Grid item>
          <Typography>{user.firstName} {user.lastName} </Typography>
        </Grid>

      </Grid>


    </Card>
  )
}

export default UserListItem