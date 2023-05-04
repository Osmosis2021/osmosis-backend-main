import { createTheme, ThemeProvider } from '@material-ui/core/styles';



// Theme

const theme = createTheme({

	palette: {
		mode: 'light',
		primary: {
		  main: '#00aeef',
		},
		secondary: {
		  main: '#ffd36e',
		},
		error: {
		  main: '#FF6B6B',
		},
		success: {
		  main: '#6BCB77',
		},
		divider: '#EEEEEE',
		info: {
		  main: '#4D96FF',
		},
	  },


	  typography: {
		htmlFontSize: 36,
		fontFamily: 'Poppins',
		fontSize: 18,
		h1: {
		  fontFamily: 'Poppins',
		},
		h2: {
		  fontFamily: 'Poppins',
		},
		h3: {
		  fontFamily: 'Poppins',
		},
		h4: {
		  fontFamily: 'Poppins',
		},
		h5: {
		  fontFamily: 'Poppins',
		},
		h6: {
		  fontFamily: 'Poppins',
		},
	  },
	  spacing: 8,
	  props: {
		MuiAppBar: {
		  color: 'default',
		},
	  },

  });

  export default theme;
