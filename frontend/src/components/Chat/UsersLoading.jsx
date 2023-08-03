import { Skeleton, Stack } from '@mui/material'
import React from 'react'

const UsersLoading = () => {
  return (
    <Stack>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
        <Skeleton height='45px'/>
    </Stack>
  )
}

export default UsersLoading;