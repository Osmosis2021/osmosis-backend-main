import React from 'react';
import SearchBar from './TopSearchBar';
import OpeningMap from './openingMap';
import Header from '../../components/TopAppBar/Header';
import OptionsTab from '../../components/TopAppBar/IndustryFilter';

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
					// height: '100vh'
				}}>
				{/* <OptionsTab /> */}
			</Box>
			<OpeningMap />
		</React.Fragment>
	);
}

export default MapOpen;
