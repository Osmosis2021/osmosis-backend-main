import * as React from 'react';
import { AppBar, Box, Toolbar, Container } from '@mui/material';
import { PremiumBackButton } from '../../ui/PremiumBackButton';
import useStore from "../../store";

export default function TopNavBar(props) {
  const { platform } = useStore();

  return (
    <AppBar
      position="absolute"
      elevation={0}
      sx={{
        background: 'transparent',
        pt: 2,
        pointerEvents: 'none' // Allow clicking through the AppBar
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            justifyContent: 'space-between',
            pointerEvents: 'auto' // Re-enable pointer events for the toolbar content
          }}
        >
          {/* <PremiumBackButton fallback={props.back} /> */}

          {/* Add other top-right actions here if needed */}
          <Box />
        </Toolbar>
      </Container>
    </AppBar>
  );
}

