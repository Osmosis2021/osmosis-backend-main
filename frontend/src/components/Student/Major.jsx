import React from 'react';
import { Button, CardGroup, Card, Typography, Container } from '@mui/material';
import GetClasses from './GetClasses';

import './Major.css';

const Major = () => {

    return (
        <Container className='container-major'>
            <Typography className='heading' variant='h4' gutterBottom padding='24px' alignItem='center'>
                The following is a list of various services offered on Osmosis
            </Typography>
            <GetClasses />
        </Container>
    );
};

export default Major;