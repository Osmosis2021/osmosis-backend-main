import { createTheme } from '@mui/material/styles';
import tokens from './theme/designTokens.json';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.colors.primary.main,
      light: tokens.colors.primary.light,
      dark: tokens.colors.primary.dark,
      contrastText: tokens.colors.primary.contrastText,
    },
    secondary: {
      main: tokens.colors.secondary.main,
      light: tokens.colors.secondary.light,
      dark: tokens.colors.secondary.dark,
      contrastText: tokens.colors.secondary.contrastText,
    },
    background: {
      default: tokens.colors.background.default,
      paper: tokens.colors.background.paper,
    },
    text: {
      primary: tokens.colors.text.primary,
      secondary: tokens.colors.text.secondary,
      disabled: tokens.colors.text.disabled,
    },
    divider: tokens.colors.divider,
    error: {
      main: tokens.colors.error.main,
      light: tokens.colors.error.light,
    },
    success: {
      main: tokens.colors.success.main,
      light: tokens.colors.success.light,
    },
    warning: {
      main: tokens.colors.warning.main,
      light: tokens.colors.warning.light,
    },
    info: {
      main: tokens.colors.info.main,
      light: tokens.colors.info.light,
    },
  },
  typography: {
    fontFamily: tokens.typography.fontFamilies.body,
    h1: {
      fontFamily: tokens.typography.fontFamilies.heading,
      fontWeight: tokens.typography.weights.extrabold,
      fontSize: tokens.typography.sizes.h1,
      lineHeight: tokens.typography.lineHeights.h1,
      color: tokens.colors.text.primary,
    },
    h2: {
      fontFamily: tokens.typography.fontFamilies.heading,
      fontWeight: tokens.typography.weights.bold,
      fontSize: tokens.typography.sizes.h2,
      lineHeight: tokens.typography.lineHeights.h2,
      color: tokens.colors.text.primary,
    },
    h3: {
      fontFamily: tokens.typography.fontFamilies.heading,
      fontWeight: tokens.typography.weights.bold,
      fontSize: tokens.typography.sizes.h3,
      lineHeight: tokens.typography.lineHeights.h3,
      color: tokens.colors.text.primary,
    },
    h4: {
      fontFamily: tokens.typography.fontFamilies.heading,
      fontWeight: tokens.typography.weights.semibold,
      fontSize: tokens.typography.sizes.h4,
      lineHeight: tokens.typography.lineHeights.h4,
      color: tokens.colors.text.primary,
    },
    h5: {
      fontFamily: tokens.typography.fontFamilies.heading,
      fontWeight: tokens.typography.weights.semibold,
      fontSize: tokens.typography.sizes.h5,
      lineHeight: tokens.typography.lineHeights.h5,
      color: tokens.colors.text.primary,
    },
    h6: {
      fontFamily: tokens.typography.fontFamilies.heading,
      fontWeight: tokens.typography.weights.semibold,
      fontSize: tokens.typography.sizes.h6,
      lineHeight: tokens.typography.lineHeights.h6,
      color: tokens.colors.text.primary,
    },
    subtitle1: {
      fontFamily: tokens.typography.fontFamilies.body,
      fontWeight: tokens.typography.weights.semibold,
      fontSize: tokens.typography.sizes.subtitle1,
      lineHeight: tokens.typography.lineHeights.subtitle1,
      color: tokens.colors.text.primary,
    },
    subtitle2: {
      fontFamily: tokens.typography.fontFamilies.body,
      fontWeight: tokens.typography.weights.medium,
      fontSize: tokens.typography.sizes.subtitle2,
      lineHeight: tokens.typography.lineHeights.subtitle2,
      color: tokens.colors.text.secondary,
    },
    body1: {
      fontFamily: tokens.typography.fontFamilies.body,
      fontWeight: tokens.typography.weights.regular,
      fontSize: tokens.typography.sizes.body1,
      lineHeight: tokens.typography.lineHeights.body1,
      color: tokens.colors.text.primary,
    },
    body2: {
      fontFamily: tokens.typography.fontFamilies.body,
      fontWeight: tokens.typography.weights.regular,
      fontSize: tokens.typography.sizes.body2,
      lineHeight: tokens.typography.lineHeights.body2,
      color: tokens.colors.text.secondary,
    },
    button: {
      fontFamily: tokens.typography.fontFamilies.heading,
      fontWeight: tokens.typography.weights.semibold,
      fontSize: tokens.typography.sizes.button,
      lineHeight: tokens.typography.lineHeights.button,
      textTransform: 'none',
    },
    caption: {
      fontFamily: tokens.typography.fontFamilies.body,
      fontWeight: tokens.typography.weights.medium,
      fontSize: tokens.typography.sizes.caption,
      lineHeight: tokens.typography.lineHeights.caption,
      color: tokens.colors.text.secondary,
    },
  },
  shape: {
    borderRadius: parseInt(tokens.borderRadius.md),
  },
  shadows: [
    'none',
    tokens.shadows.sm,
    tokens.shadows.md,
    tokens.shadows.lg,
    tokens.shadows.xl,
    ...Array(20).fill('none'),
  ],
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.md,
          padding: '10px 24px',
          fontSize: tokens.typography.sizes.button,
          fontWeight: tokens.typography.weights.semibold,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(10, 10, 10, 0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          backgroundColor: tokens.colors.primary.main,
          color: tokens.colors.primary.contrastText,
          '&:hover': {
            backgroundColor: tokens.colors.primary.light,
          },
        },
        containedSecondary: {
          backgroundColor: tokens.colors.secondary.main,
          color: tokens.colors.secondary.contrastText,
          '&:hover': {
            backgroundColor: tokens.colors.secondary.dark,
          },
        },
        outlinedPrimary: {
          borderColor: tokens.colors.divider,
          color: tokens.colors.primary.main,
          '&:hover': {
            backgroundColor: 'rgba(10, 10, 10, 0.04)',
            borderColor: tokens.colors.primary.main,
          },
        },
        textPrimary: {
          color: tokens.colors.primary.main,
          '&:hover': {
            backgroundColor: 'rgba(10, 10, 10, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.01)',
          border: `1px solid ${tokens.colors.background.default}`,
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.md,
          backgroundColor: tokens.colors.background.default,
          transition: 'all 0.2s ease-in-out',
          '& fieldset': {
            borderColor: tokens.colors.divider,
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: tokens.colors.text.disabled,
          },
          '&.Mui-focused fieldset': {
            borderColor: tokens.colors.primary.main,
            borderWidth: '2px',
          },
          '&.Mui-error fieldset': {
            borderColor: tokens.colors.error.main,
          },
        },
        input: {
          padding: '12px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.sm,
          fontWeight: tokens.typography.weights.semibold,
          backgroundColor: tokens.colors.background.default,
          color: tokens.colors.text.secondary,
          border: `1px solid ${tokens.colors.divider}`,
          transition: 'all 0.2s ease',
          '&.MuiChip-colorPrimary': {
            backgroundColor: 'rgba(10, 10, 10, 0.08)',
            color: tokens.colors.primary.main,
            borderColor: 'rgba(10, 10, 10, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.colors.background.paper,
          color: tokens.colors.text.primary,
          borderBottom: tokens.navbar.borderBottom,
          boxShadow: 'none',
        },
      },
    },
  },
});

export default theme;
