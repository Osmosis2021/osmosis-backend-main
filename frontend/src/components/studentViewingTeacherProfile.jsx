import React, { useState, useEffect } from 'react';
import Prof from './SessionCreation/Profile View/Prof';
import TeacherInfo from './SessionCreation/Profile View/TeacherInfo';
import {
	BottomNavigation,
	BottomNavigationAction,
	Box,
	Card,
	Grid,
	Typography,
	Fab,
} from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import GuestDialog from './GuestsDialog';

import SimpleDialogDemo from './Dialog';

import Logo from '../assets/SVG/Logo/Logo.jsx';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IosShareIcon from '@mui/icons-material/IosShare';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import FacebookSharpIcon from '@mui/icons-material/FacebookSharp';

import Courses from '../assets/courses.json';

function StudentviewingTeacherProfile() {
	const [value, setValue] = React.useState(0);

	const [session, setSession] = useState({});

	const images = [
		{
			original: 'https://picsum.photos/id/1018/1000/600/',
		},
		{
			original: 'https://picsum.photos/id/1015/1000/600/',
		},
		{
			original: 'https://picsum.photos/id/1019/1000/600/',
		},
	];

	return (
		<div>
			<Box
				sx={{ display: 'flex', justifyContent: 'space-between' }}
				style={{ padding: '5%', position: 'absolute', zIndex: 1 }}
				flexDirection='row'
				width='100%'
				gap={2}>
				<Link to='/explore' style={{ textDecoration: 'none' }}>
					<Fab size='small' color='primary' aria-label='back'>
						{' '}
						<ArrowBackIcon fontSize='medium' />
					</Fab>
				</Link>

				<Link to='/' style={{ textDecoration: 'none' }}>
					<Fab size='small' color='primary' aria-label='back'>
						{' '}
						<IosShareIcon fontSize='medium' />
					</Fab>
				</Link>
			</Box>

			<Grid container sx={{ margin: '2%', alignItems: 'center' }}>
				<Grid item xs={4} align='center' style={{ alignItems: 'flexEnd' }}>
					<Prof />
				</Grid>

				<Grid item xs={8} style={{ paddingBottom: 5 }}>
					<TeacherInfo />
				</Grid>

				<Grid item fullWidth>
					<Typography style={{ padding: '0 5%' }}>Instructors name</Typography>
				</Grid>
			</Grid>

			<Card style={{ margin: '5%', padding: '3%' }}>
				<h6>Your session</h6>
				<SimpleDialogDemo />
				<h6>Guests </h6>
				<GuestDialog />
			</Card>

			<Card style={{ margin: '5%', padding: '3%' }}>
				<h6>Total Cost</h6>
				{/* Make Dynamic */}
				<p>$46.00 x 4 = $184.00</p>
			</Card>

			<Box
				style={{
					padding: '5%',
					position: 'absolute',
					bottom: 0,
					left: 0,
					width: '100vw',
					backgroundColor: 'pink',
				}}>
				<BottomNavigation
					style={{ backgroundColor: 'pink' }}
					showLabels
					value={value}
					onChange={(event, newValue) => {
						setValue(newValue);
					}}>
					<BottomNavigationAction
						label='Explore'
						icon={<ExploreRoundedIcon />}
					/>
					<BottomNavigationAction label='Sessions' icon={<Logo />} />

					<BottomNavigationAction
						label='Profile'
						icon={<AccountCircleRoundedIcon />}
					/>
				</BottomNavigation>
			</Box>
		</div>
	);
}

export default StudentviewingTeacherProfile;
