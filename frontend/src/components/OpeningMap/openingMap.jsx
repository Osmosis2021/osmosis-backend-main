import React, { useEffect, useState, useRef } from 'react';
import ReactMapGL, { Marker, GeolocateControl, Popup } from 'react-map-gl';
import { Avatar, Box, Button, Container, Stack, Typography, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import theme from '../../theme.js';
import './openingMap.css';
import useStore from "../../store";
import mapboxgl from 'mapbox-gl'

// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;


const MAPBOX_TOKEN =
	'pk.eyJ1IjoicmFkZXItamFrZSIsImEiOiJjbDU4dXdnMXcyNDZ2M2pvY2k2OW1yajY5In0.VoWote3L5R1CdSF1RPKaZg';

const OpeningMap = () => {
	const mapRef = useRef(null);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const { backendURL, platform } = useStore()
	const [initialViewState, setInitialViewState] = useState({
		zoom: 10,
		latitude: 40.7076398,
		longitude: -73.9596498,
	});
	const [courses, setCourses] = useState([]);
	const [teacherInfo, setTeacherInfo] = useState({});

	useEffect(() => {
		fetch(
			`${backendURL}course/getCourses/${initialViewState.latitude}/${initialViewState.longitude}`
		).then((res) => {
			return res.json();
		}).then((courses) => {
			setCourses(courses);
		}).catch((err) => {
			console.log('Error getting courses:\n', err);
		});
	}, []);

	useEffect(() => {
		if (selectedCourse?.userName) {
			fetch(`${backendURL}user/getUserInfo/${selectedCourse?.userName}`)
				.then((res) => {
					return res.json();
				}).then((data) => {
					setTeacherInfo(data)
				}).catch((err) => {
					console.log('Error getting teacher info:\n', err)
				});
		}
	}, [selectedCourse]);

	const handleMarkerClick = (e, course) => {
		e.originalEvent.stopPropagation();
		setSelectedCourse(course);

		if (mapRef.current) {
			mapRef.current.flyTo({
				center: [course.longitude, course.latitude],
				zoom: Math.max(mapRef.current.getZoom(), 12),
				duration: 600
			});
		}
	};

	return (
		<Box
			id='mapComponentContainer'
			className={`mapComponentContainer-${platform}`}
			sx={{
				height: { xs: '100dvh', md: '100vh' },
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				position: 'relative',
				overflow: 'hidden'
			}}
		>
			<Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
				<ReactMapGL
					ref={mapRef}
					initialViewState={initialViewState}
					mapStyle={`mapbox://styles/mapbox/${theme.palette.mode}-v11`}
					mapboxAccessToken={MAPBOX_TOKEN}
					style={{ width: '100%', height: '100%' }}
					onClick={() => setSelectedCourse(null)}
				>
					{courses.map((course) => (
						<Marker
							key={course._id}
							latitude={course.latitude}
							longitude={course.longitude}
							onClick={(e) => handleMarkerClick(e, course)}
						>
							<div
								style={{
									cursor: 'pointer',
									fontSize: selectedCourse?._id === course._id ? '36px' : '32px',
									transform: selectedCourse?._id === course._id ? 'scale(1.15)' : 'scale(1)',
									transition: 'transform 0.2s ease',
									filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
								}}
							>
								🎨
							</div>
						</Marker>
					))}

					{selectedCourse && (
						<Popup
							latitude={selectedCourse.latitude}
							longitude={selectedCourse.longitude}
							onClose={() => setSelectedCourse(null)}
							closeButton={false}
							anchor="bottom"
							offset={40}
							maxWidth="280px"
						>
							<Box sx={{
								width: 240,
								position: 'relative',
								overflow: 'hidden',
								borderRadius: 3,
								bgcolor: 'background.paper',
								boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
							}}>
								<IconButton
									onClick={(e) => {
										e.stopPropagation();
										setSelectedCourse(null);
									}}
									sx={{
										position: 'absolute',
										top: 8,
										right: 8,
										zIndex: 10,
										bgcolor: 'rgba(255,255,255,0.8)',
										color: 'text.primary',
										boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
										'&:hover': {
											bgcolor: 'rgba(255,255,255,0.9)',
										}
									}}
									size="small"
								>
									<CloseIcon fontSize="small" />
								</IconButton>

								<Link
									to={`/teachers/${selectedCourse.userName}/${selectedCourse._id}`}
									style={{ textDecoration: 'none', color: 'inherit' }}
								>
									<Box sx={{ height: 120, overflow: 'hidden' }}>
										<img
											src={selectedCourse?.images?.[0]?.url}
											alt={selectedCourse.courseTitle}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									</Box>
									<Box sx={{ p: 2 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 1 }}>
											{selectedCourse.courseTitle}
										</Typography>
										<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
											<Avatar src={teacherInfo.profileImage?.url} sx={{ width: 18, height: 18 }} />
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
												{selectedCourse.userName}
											</Typography>
										</Stack>
										<Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 2 }}>
											<Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
												${selectedCourse.pricePerStudent}
											</Typography>
											<Typography variant="caption">•</Typography>
											<Typography variant="caption">{selectedCourse.duration || 60}m</Typography>
											<Typography variant="caption">•</Typography>
											<Typography variant="caption">{selectedCourse.capacity} slots</Typography>
										</Stack>
										<Button
											variant="contained"
											fullWidth
											size="small"
											sx={{ borderRadius: 2, py: 0.5, fontSize: '0.75rem' }}
										>
											View Details
										</Button>
									</Box>
								</Link>
							</Box>
						</Popup>
					)}

					<GeolocateControl position="top-right" />
				</ReactMapGL>
			</Box>
		</Box>
	);
};

export default OpeningMap;
