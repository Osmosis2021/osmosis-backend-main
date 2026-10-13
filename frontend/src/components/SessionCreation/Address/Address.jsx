import React, { useState, useEffect, useRef } from 'react'
import useStore from "../../../store";
import {
    Container,
    Stack,
    Typography,
    Grid,
    TextField,
    Box,
    Button,
    Fade
} from '@mui/material'
import ReactMapGL, { Marker } from 'react-map-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import theme from '../../../theme.js';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';
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
    // true once the address has a real map position (picked from search, or found for a typed address)
    const [pinned, setPinned] = useState(false);
    const [manual, setManual] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        const geo = new MapboxGeocoder({
            accessToken: MAPBOX_TOKEN,
            // New York results first, but any US address can be found.
            proximity: { longitude: -73.9569994, latitude: 40.7297027 },
            countries: 'us',
            types: 'address,poi',
            placeholder: 'Your studio address'
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
            setPinned(true)
            setManual(false)
            setShowFields(true)
        })
        // Coming back to this step with an address already chosen.
        if (newCourseAddressLine1 && newCourseAddressCity && newCourseAddressZipcode &&
            newCourseAddressState && newCourseLatitude) {
            setShowFields(true)
            setPinned(true)
        }
        // Remove the search box when leaving, so it's never added twice.
        return () => {
            const container = document.getElementById('geocoderContainer');
            if (container) container.innerHTML = '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once on mount to initialize the geocoder and avoid duplicate geocoder inputs
    }, [])

    // Move the map to the address whenever it changes.
    useEffect(() => {
        if (pinned && mapRef.current) {
            mapRef.current.flyTo({ center: [newCourseLongitude, newCourseLatitude], zoom: 15, duration: 800 });
        }
    }, [pinned, newCourseLatitude, newCourseLongitude]);

    // Typed in by hand: look the address up so the studio still lands in the right spot on the map.
    useEffect(() => {
        if (!manual) return undefined;
        const query = [newCourseAddressLine1, newCourseAddressCity, newCourseAddressState, newCourseAddressZipcode].filter(Boolean).join(', ');
        if (!newCourseAddressLine1 || !(newCourseAddressCity || newCourseAddressZipcode)) {
            setPinned(false);
            return undefined;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=us&limit=1`, { signal: controller.signal });
                const { features } = await res.json();
                if (features?.[0]?.center) {
                    setNewCourseLongitude(features[0].center[0]);
                    setNewCourseLatitude(features[0].center[1]);
                    setPinned(true);
                } else {
                    setPinned(false);
                }
            } catch (err) {
                if (err.name !== 'AbortError') setPinned(false);
            }
        }, 600);
        return () => { clearTimeout(timer); controller.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- setters are stable
    }, [manual, newCourseAddressLine1, newCourseAddressCity, newCourseAddressState, newCourseAddressZipcode]);

    useEffect(() => {
        const isValid = pinned && [newCourseAddressLine1, newCourseAddressCity, newCourseAddressZipcode,
            newCourseAddressState, newCourseLatitude].every(val => Boolean(val));
        props.setIsNextDisabled(!isValid);
    }, [pinned, newCourseAddressLine1, newCourseAddressCity, newCourseAddressZipcode, newCourseAddressState, newCourseLatitude, props]);


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
                    <Box sx={{ maxWidth: { xs: '100%', sm: 780 }, mx: 'auto', width: '100%', px: { xs: 2, sm: 0 } }}>
                        <div id='geocoderContainer'></div>
                        {!showFields && (
                            <Stack spacing={1} alignItems="center" sx={{ mt: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Type your address and pick it from the list. We'll fill in the details and show it on the map.
                                </Typography>
                                <Button size="small" onClick={() => { setManual(true); setShowFields(true); }}
                                    sx={{ textTransform: 'none', fontWeight: 700 }}>
                                    Can't find it? Enter it yourself
                                </Button>
                            </Stack>
                        )}
                    </Box>

                    {/* Form & Map Display (after an address is chosen) */}
                    {showFields && (
                    <Fade in>
                        <Box>
                            <Grid container spacing={4}>
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={3}>
                                        <Box>
                                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                                                Check the details
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Add a suite or apartment number if guests need one. Only booked guests see the full address.
                                            </Typography>
                                        </Box>
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
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="City"
                                                value={newCourseAddressCity}
                                                onChange={e => setNewCourseAddressCity(e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.01)' } }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="State"
                                                value={newCourseAddressState}
                                                onChange={e => setNewCourseAddressState(e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.01)' } }}
                                            />
                                        </Box>
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
                                        {!pinned ? (
                                            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', bgcolor: 'background.paper', px: 3, textAlign: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Your studio will appear here once we find the address.
                                                </Typography>
                                            </Stack>
                                        ) : (
                                        <ReactMapGL
                                            ref={mapRef}
                                            mapboxAccessToken={MAPBOX_TOKEN}
                                            initialViewState={{ zoom: 15, latitude: newCourseLatitude, longitude: newCourseLongitude }}
                                            mapStyle={`mapbox://styles/mapbox/${theme.palette.mode}-v11`}
                                            style={{ width: '100%', height: '100%' }}
                                        >
                                            <Marker
                                                latitude={newCourseLatitude}
                                                longitude={newCourseLongitude}
                                                anchor="bottom">
                                                <Box sx={{
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
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Fade>
                    )}
                </Stack>
            </Container>
        </Box>
    )
}

export default Address;