import * as React from 'react';
import MobileStepper from '@mui/material/MobileStepper';
import Button from '@mui/material/Button';
import './ProgressBar.css';

export default function ProgressBar(props) {
    
   

  return (
    <MobileStepper
        
      style={{backgroundColor:'#000000', position:'absolute', left:'25px'}}
      variant="progress"
      steps={9}
    //   position="absolute"
      activeStep={props.activeStep}
      sx={{ maxWidth: 400, flexGrow: 1 }}
    />
  );
}