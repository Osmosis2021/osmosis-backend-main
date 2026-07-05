import * as React from 'react';
import { AppBar, Box, Toolbar, Container, Typography } from '@mui/material';
import { PremiumBackButton } from '../../ui/PremiumBackButton';
import useStore from "../../store";

export default function TopNavBar(props) {
  const { platform } = useStore();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(10, 10, 10, 0.06)',
        zIndex: 1100,
        width: '100%',
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '64px',
            px: 2,
          }}
        >
          {/* Left Slot: Back Button */}
          <Box sx={{ minWidth: 48, display: 'flex', justifyContent: 'flex-start' }}>
            {props.back ? (
              <PremiumBackButton fallback={props.back} />
            ) : (
              <Box sx={{ width: 44, height: 44 }} />
            )}
          </Box>

          {/* Center Slot: Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 650,
              fontFamily: 'Outfit, sans-serif',
              color: 'text.primary',
              fontSize: '1.05rem',
              letterSpacing: '-0.01em',
              textAlign: 'center',
              textTransform: 'none',
              flexGrow: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              px: 1,
            }}
          >
            {props.title || 'Studio Time'}
          </Typography>

          {/* Right Slot: Right Action */}
          <Box sx={{ minWidth: 48, display: 'flex', justifyContent: 'flex-end' }}>
            {props.rightAction || <Box sx={{ width: 44, height: 44 }} />}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
