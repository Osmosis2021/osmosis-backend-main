import React from 'react';
import OpeningMap from './openingMap';
import { CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';

function MapOpen() {

	return (
		<React.Fragment>
			<CssBaseline />
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
				}}>
			</Box>
			<OpeningMap />
		</React.Fragment>
	);
}

export default MapOpen;
