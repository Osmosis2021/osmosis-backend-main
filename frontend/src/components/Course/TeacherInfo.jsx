import React from 'react';
import { Typography, Stack, Grid } from '@mui/material';
// import AssignmentIcon from "@mui/icons-material/Assignment";
// import AcUnitIcon from "@mui/icons-material/AcUnit";
// import StarIcon from "@mui/icons-material/Star";
// import art from '../../../assets/icons/art.png';
// import teachers from "./teacher";

import Receiving from '../../assets/SVG/Receiving/Receiving';
import Sharing from '../../assets/SVG/Sharing/Sharing';
// Why can't justify content for art logo and stars?

export default function TeacherInfo() {
	return (
		<div>
			<Stack>
				<Grid
					container
					style={{
						textAlign: 'center',
						alignItems: 'center',
						justifyContent: 'space-evenly',
					}}>
					<Grid item sx={6}>
						<Stack>
							<Sharing />
						</Stack>
						<Stack>
							<Typography variant='gutterBottom'>5</Typography>
						</Stack>
						<Stack>
							<Typography variant='gutterBottom'>Taught</Typography>
						</Stack>
					</Grid>
					<Grid item sx={6}>
						<Stack>
							<Receiving />
						</Stack>
						<Stack>
							<Typography variant='gutterBottom'>19</Typography>
						</Stack>
						<Stack>
							<Typography variant='gutterBottom'>Learnt</Typography>
						</Stack>
					</Grid>
				</Grid>
			</Stack>
		</div>
	);
}
