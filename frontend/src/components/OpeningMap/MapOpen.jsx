import React from 'react';
import OpeningMap from './openingMap';
import Box from '@mui/material/Box';

function MapOpen() {
	return (
		<Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
			<OpeningMap />
		</Box>
	);
}

export default MapOpen;
