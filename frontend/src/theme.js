import { createTheme } from '@mui/material/styles';

const theme = createTheme({
	palette: {
		mode: 'light',
		primary: {
			main: '#000000', // Gallery Black
			light: '#333333',
			dark: '#000000',
			contrastText: '#fff',
		},
		secondary: {
			main: '#111111',
			contrastText: '#fff',
		},
		background: {
			default: '#FFFFFF', // Pure White
			paper: '#FFFFFF',
		},
		text: {
			primary: '#000000', // Deep Black
			secondary: '#6B6B6B', // Muted Gray
		},
		divider: '#EDEDED', // Gallery Border
	},
	typography: {
		fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
		h1: {
			fontFamily: '"Outfit", sans-serif',
			fontWeight: 800,
		},
		h2: {
			fontFamily: '"Outfit", sans-serif',
			fontWeight: 700,
		},
		h3: {
			fontFamily: '"Outfit", sans-serif',
			fontWeight: 700,
		},
		h4: {
			fontFamily: '"Outfit", sans-serif',
			fontWeight: 600,
		},
		h5: {
			fontFamily: '"Outfit", sans-serif',
			fontWeight: 600,
		},
		h6: {
			fontFamily: '"Outfit", sans-serif',
			fontWeight: 600,
		},
		subtitle1: {
			fontFamily: '"Inter", sans-serif',
			fontWeight: 500,
		},
		body1: {
			fontFamily: '"Inter", sans-serif',
			lineHeight: 1.6,
		},
		body2: {
			fontFamily: '"Inter", sans-serif',
			lineHeight: 1.6,
		},
		button: {
			fontFamily: '"Outfit", sans-serif',
			fontWeight: 600,
			textTransform: 'none',
		},
	},
	shape: {
		borderRadius: 0, // Editorial squared look, or keep slightly rounded? User said "Gallery". Let's stick to slight round or 0. User didn't explicitly say remove radius, but "Timeless" often implies sharper. Let's keep 12px but simpler. Actually user said "Restrained". Let's keep 4px or 0px. Let's go with 0px for "architecture portfolio" feel, or very small. Let's checking existing. It was 16. Let's reduce to 4. 
		// Actually, let's keep it safe. 8px is neutral.
		borderRadius: 8,
	},
	shadows: [
		'none',
		'none', // No "glow"
		'0 4px 12px rgba(0,0,0,0.08)', // Subtle hover
		...Array(22).fill('none'),
	],
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 0, // Square buttons for gallery feel? Or pill? Let's go with 0 or 4. User said "Architecture". Let's try 0.
					padding: '12px 28px',
					fontSize: '0.9rem',
					letterSpacing: '0.05em',
					transition: 'all 0.2s ease-in-out',
					'&:hover': {
						transform: 'translateY(-1px)',
						boxShadow: 'none',
						backgroundColor: '#333',
					},
				},
				containedPrimary: {
					background: '#000000', // Flat black
					color: '#FFFFFF',
					'&:hover': {
						background: '#333333',
					}
				},
				outlined: {
					borderWidth: '1px',
					borderColor: '#000',
					'&:hover': {
						borderWidth: '1px',
						backgroundColor: '#F7F7F7',
					}
				}
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 0,
					boxShadow: 'none',
					border: '1px solid #EDEDED',
					overflow: 'hidden',
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					'& .MuiOutlinedInput-root': {
						borderRadius: 0,
						backgroundColor: '#fff',
						'& fieldset': {
							borderColor: '#EDEDED',
						},
						'&:hover fieldset': {
							borderColor: '#000000',
						},
						'&.Mui-focused fieldset': {
							borderColor: '#000000',
						}
					},
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					borderRadius: 0,
					fontWeight: 500,
					backgroundColor: '#F7F7F7',
					color: '#000',
					border: '1px solid #EDEDED',
				},
			},
		},
	},
});

export default theme;
