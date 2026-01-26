import TERMS from '../../../constants/terms';
import React, { useState, useEffect } from 'react'
import useStore from "../../../store";
import {
    Button,
    Container,
    Stack,
    Typography,
    Grid,
    TextField,
    Box,
    Paper,
    Fade
} from '@mui/material'
import ReactMapGL, { Marker } from 'react-map-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import theme from '../../../theme.js';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';
import { PremiumCard } from '../../../ui/PremiumCard';
import './Address.css';

import mapboxgl from 'mapbox-gl'
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const MAPBOX_TOKEN =
    'pk.eyJ1IjoicmFkZXItamFrZSIsImEiOiJjbDU4dXdnMXcyNDZ2M2pvY2k2OW1yajY5In0.VoWote3L5R1CdSF1RPKaZg';

const Address = props => {
    const {
        newCourseAddressLine1,
        setNewCourseAddressLine1,
        newCourseAddressLine2,
        setNewCourseAddressLine2,
        newCourseAddressCity,
        setNewCourseAddressCity,
        newCourseAddressZipcode,
        setNewCourseAddressZipcode,
        newCourseAddressState,
        setNewCourseAddressState,
        setNewCourseAddressCountry,
        newCourseLatitude,
        setNewCourseLatitude,
        newCourseLongitude,
        setNewCourseLongitude
    } = useStore()
    const [showFields, setShowFields] = useState(false);

    useEffect(() => {
        const geo = new MapboxGeocoder({
            accessToken: MAPBOX_TOKEN,
            proximity: { longitude: -73.9569994, latitude: 40.7297027 },
            bbox: [-74.2713341, 40.4873118, -72.5270252, 41.2417642],
            placeholder: 'Search for your studio address...'
        })
        geo.addTo('#geocoderContainer')

        geo.on('result', (data) => {
            const res = data.result
            const parts = res.context
            setNewCourseAddressLine1(res["place_name_en-US"].split(',', 1)[0])
            setNewCourseLatitude(res.center[1])
            setNewCourseLongitude(res.center[0])
            parts.forEach(part => {
                if (part.id.startsWith('postcode')) {
                    setNewCourseAddressZipcode(part.text)
                } else if (part.id.startsWith('place')) {
                    setNewCourseAddressCity(part.text)
                } else if (part.id.startsWith('region')) {
                    let _state = part.short_code
                    if (_state.startsWith('US-')) {
                        _state = _state.slice(3)
                    }
                    setNewCourseAddressState(_state)
                } else if (part.id.startsWith('country')) {
                    setNewCourseAddressCountry(part.short_code)
                }
            })
            setShowFields(true)
        })
        if (newCourseAddressLine1 && newCourseAddressCity && newCourseAddressZipcode &&
            newCourseAddressState && newCourseLatitude) {
            setShowFields(true)
        }
    }, [])

    useEffect(() => {
        const isValid = [newCourseAddressLine1, newCourseAddressCity, newCourseAddressZipcode,
            newCourseAddressState, newCourseLatitude].every(val => Boolean(val));
        props.setIsNextDisabled(!isValid);
    }, [newCourseAddressLine1, newCourseAddressCity, newCourseAddressZipcode, newCourseAddressState, newCourseLatitude, props]);


    return (
        <Box sx={{ py: 4, pb: 12 }}>
            <PremiumSectionHeader
                title="Location"
                subtitle="Where will this studio time take place?"
                align="center"
            />

            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Stack spacing={4}>

                    {/* Search Section */}
                    <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
                        <PremiumCard nohover sx={{ p: 1, border: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <div id='geocoderContainer'></div>
                        </PremiumCard>
                    </Box>

                    {/* Form & Map Display */}
                    <Fade in={showFields}>
                        <Box>
                            <Grid container spacing={4}>
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={3}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                                            Address Details
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Address Line 1"
                                            value={newCourseAddressLine1}
                                            onChange={e => setNewCourseAddressLine1(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.01)' } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Suite, Apt, etc. (Optional)"
                                            value={newCourseAddressLine2}
                                            onChange={e => setNewCourseAddressLine2(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.01)' } }}
                                        />
                                        <Grid container spacing={2}>
                                            <Grid item xs={7}>
                                                <TextField
                                                    fullWidth
                                                    label="City"
                                                    value={newCourseAddressCity}
                                                    onChange={e => setNewCourseAddressCity(e.target.value)}
                                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.01)' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={5}>
                                                <TextField
                                                    fullWidth
                                                    label="State"
                                                    value={newCourseAddressState}
                                                    onChange={e => setNewCourseAddressState(e.target.value)}
                                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.01)' } }}
                                                />
                                            </Grid>
                                        </Grid>
                                        <TextField
                                            fullWidth
                                            label="Zipcode"
                                            value={newCourseAddressZipcode}
                                            onChange={e => setNewCourseAddressZipcode(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.01)' } }}
                                        />
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 2, display: 'block' }}>
                                        Map Preview
                                    </Typography>
                                    <Box sx={{
                                        height: 300,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                                    }}>
                                        <ReactMapGL
                                            mapboxAccessToken={MAPBOX_TOKEN}
                                            initialViewState={{ zoom: 14, latitude: newCourseLatitude, longitude: newCourseLongitude }}
                                            mapStyle={`mapbox://styles/mapbox/${theme.palette.mode}-v11`}
                                            style={{ width: '100%', height: '100%' }}
                                        >
                                            <Marker
                                                latitude={newCourseLatitude}
                                                longitude={newCourseLongitude}>
                                                <Box sx={{
                                                    transform: 'translate(-50%, -50%)',
                                                    bgcolor: 'text.primary',
                                                    color: 'background.paper',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 2,
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}>
                                                    Studio
                                                </Box>
                                            </Marker>
                                        </ReactMapGL>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Fade>
                </Stack>
            </Container>
        </Box>
    )
}

export default Address;