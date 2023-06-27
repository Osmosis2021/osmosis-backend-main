import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import MobileStepper from '@mui/material/MobileStepper';
import Button from '@mui/material/Button';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import Industry from '../SessionCreation/Industry/Industry';
import SessionTag from '../SessionCreation/SessionTag/SessionTag';
import ToggleDays from '../SessionCreation/ToggleDays/ToggleDays';
import Address from '../SessionCreation/Address/Address';
import Capacity from '../SessionCreation/Capacity/Capacity';
import Cost from '../SessionCreation/Cost/Cost';
import UploadPhotos from '../SessionCreation/PhotoHandling/UploadPhotos/UploadPhotos';
import './UpdatedProgressBar.css';
import { ConfirmSession } from '../SessionCreation/ConfirmSession/ConfirmSession';
import { useState } from 'react';


// const labels = ['First Step', 'Second Step', 'Third Step', 'Fourth Step', 'Fifth Step', 'Sixth Step', 'Seventh Step', 'Eighth Step']
const steps = ['Industry', 'Tags', 'Availability', 'Location', 'Capacity', 'Cost', 'Photos', 'Confirmation']
                          
export default function UpdatedProgressBar() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [isNextDisabled, setIsNextDisabled] = useState(false)
  const maxSteps = steps.length;

  const handleSteps = (step) => {
    switch (step) {
      case 0:
        return <Industry setIsNextDisabled={setIsNextDisabled}/>
      case 1:
        return <SessionTag setIsNextDisabled={setIsNextDisabled}/>
      case 2: 
      return <Capacity setIsNextDisabled={setIsNextDisabled}/>
      case 3:
        return <ToggleDays setIsNextDisabled={setIsNextDisabled}/>
        case 4:
          return <Address setIsNextDisabled={setIsNextDisabled}/>
      case 5:
        return <Cost setIsNextDisabled={setIsNextDisabled}/>
      case 6:
        return <UploadPhotos setIsNextDisabled={setIsNextDisabled}/>
      case 7:
        return <ConfirmSession />
    }
  }
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <>
      <MobileStepper
        variant="progress"
        steps={maxSteps}
        position="top"
        activeStep={activeStep}
        nextButton={
          <Button style={{fontSize:'1rem'}}
            size="large"
            onClick={handleNext}
            disabled={(activeStep === maxSteps - 1) || isNextDisabled}
            // industry === '' && tags.length === 0
          >
            Next
            {theme.direction === 'rtl' ? (
              <KeyboardArrowLeft />
            ) : (
              <KeyboardArrowRight />
            )}
          </Button>
        }
        backButton={
          <Button  style={{fontSize:'1rem'}} size="large" onClick={handleBack} disabled={activeStep === 0}>
            {theme.direction === 'rtl' ? (
              <KeyboardArrowRight />
            ) : (
              <KeyboardArrowLeft />
            )}
            Back
          </Button>
        }
      />
      {handleSteps(activeStep)}
    </>
  );
}