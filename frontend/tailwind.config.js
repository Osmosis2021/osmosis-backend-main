const tokens = require('./src/theme/designTokens.json');

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: tokens.colors.primary.main,
          main: tokens.colors.primary.main,
          light: tokens.colors.primary.light,
          dark: tokens.colors.primary.dark,
        },
        secondary: {
          DEFAULT: tokens.colors.secondary.main,
          main: tokens.colors.secondary.main,
          light: tokens.colors.secondary.light,
          dark: tokens.colors.secondary.dark,
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
          DEFAULT: tokens.colors.error.main,
          main: tokens.colors.error.main,
          light: tokens.colors.error.light,
        },
        success: {
          DEFAULT: tokens.colors.success.main,
          main: tokens.colors.success.main,
          light: tokens.colors.success.light,
        },
        warning: {
          DEFAULT: tokens.colors.warning.main,
          main: tokens.colors.warning.main,
          light: tokens.colors.warning.light,
        },
        info: {
          DEFAULT: tokens.colors.info.main,
          main: tokens.colors.info.main,
          light: tokens.colors.info.light,
        },
      },
      fontFamily: {
        heading: [tokens.typography.fontFamilies.heading.replace(/"/g, ''), 'sans-serif'],
        body: [tokens.typography.fontFamilies.body.replace(/"/g, ''), 'sans-serif'],
      },
      spacing: {
        'space-1': tokens.spacing['1'],
        'space-2': tokens.spacing['2'],
        'space-3': tokens.spacing['3'],
        'space-4': tokens.spacing['4'],
        'space-5': tokens.spacing['5'],
        'space-6': tokens.spacing['6'],
        'space-8': tokens.spacing['8'],
        'space-10': tokens.spacing['10'],
        'space-12': tokens.spacing['12'],
        'space-16': tokens.spacing['16'],
      },
      borderRadius: {
        'xs': tokens.borderRadius.xs,
        'sm': tokens.borderRadius.sm,
        'md': tokens.borderRadius.md,
        'lg': tokens.borderRadius.lg,
        'xl': tokens.borderRadius.xl,
      },
      boxShadow: {
        'sm': tokens.shadows.sm,
        'md': tokens.shadows.md,
        'lg': tokens.shadows.lg,
        'xl': tokens.shadows.xl,
      }
    },
  },
  plugins: [],
};
