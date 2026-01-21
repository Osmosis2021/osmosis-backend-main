import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Button,
  Box,
  Container,
  Stack,
  Typography,
  IconButton,
  useMediaQuery
} from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import SessionTag from '../SessionCreation/SessionTag/SessionTag';
import ToggleDays from '../SessionCreation/ToggleDays/ToggleDays';
import Address from '../SessionCreation/Address/Address';
import Capacity from '../SessionCreation/Capacity/Capacity';
import Cost from '../SessionCreation/Cost/Cost';
import UploadPhotos from '../SessionCreation/PhotoHandling/UploadPhotos/UploadPhotos';
import { ConfirmSession } from '../SessionCreation/ConfirmSession/ConfirmSession';
import StudioTemplates from '../SessionCreation/StudioTemplates/StudioTemplates';
import { PremiumStepper } from '../../ui/PremiumStepper';
import { useState } from 'react';

const steps = ['Templates', 'Tags', 'Capacity', 'Availability', 'Location', 'Cost', 'Photos', 'Confirmation']

export default function UpdatedProgressBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const [isNextDisabled, setIsNextDisabled] = useState(false)
  const maxSteps = steps.length;

  const handleSteps = (step) => {
    switch (step) {
      case 0:
        return <StudioTemplates setIsNextDisabled={setIsNextDisabled} handleNext={handleNext} />
      case 1:
        return <SessionTag setIsNextDisabled={setIsNextDisabled} handleNext={handleNext} />
      case 2:
        return <Capacity setIsNextDisabled={setIsNextDisabled} handleNext={handleNext} />
      case 3:
        return <ToggleDays setIsNextDisabled={setIsNextDisabled} handleNext={handleNext} />
      case 4:
        return <Address setIsNextDisabled={setIsNextDisabled} handleNext={handleNext} />
      case 5:
        return <Cost setIsNextDisabled={setIsNextDisabled} handleNext={handleNext} />
      case 6:
        return <UploadPhotos setIsNextDisabled={setIsNextDisabled} handleNext={handleNext} />
      case 7:
        return <ConfirmSession setActiveStep={setActiveStep} />
      default:
        return null;
    }
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    window.scrollTo(0, 0);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1100 }}>
        <Container maxWidth="lg">
          <PremiumStepper activeStep={activeStep} steps={steps} />
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 } }}>
        {handleSteps(activeStep)}
      </Container>

      {/* Navigation Footer */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        p: 2,
        zIndex: 1100
      }}>
        <Container maxWidth="md">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              size="large"
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<KeyboardArrowLeft />}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Back
            </Button>

            {activeStep < maxSteps - 1 && (
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                disabled={isNextDisabled}
                endIcon={<KeyboardArrowRight />}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 4,
                  borderRadius: 0,
                  boxShadow: 'none'
                }}
              >
                Next
              </Button>
            )}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}