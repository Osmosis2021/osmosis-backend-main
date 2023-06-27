import React, { useState, useEffect } from 'react'
import useStore from "../../../store";
import { Button, Container, Stack, Typography, Grid, TextField, InputLabel, MenuItem, FormControl, Select } from '@mui/material'
import ReactMapGL, { Marker } from 'react-map-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import theme from '../../../theme.js';
import './Address.css';

import mapboxgl from 'mapbox-gl'
// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

// import Geocoder from 'react-map-gl-geocoder'
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
            proximity: {longitude: -73.9569994, latitude: 40.7297027},
            bbox: [-74.2713341, 40.4873118, -72.5270252, 41.2417642]
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

    props.setIsNextDisabled([newCourseAddressLine1, newCourseAddressCity, newCourseAddressZipcode,
      newCourseAddressState, newCourseLatitude].some(val => !Boolean(val)))
    

    return (
    <div>
    <Typography variant='h4' mb={2} mt={8} align='center'>Where will you teach?</Typography>
    <Container style={{width:"90vw", display: 'flex', flexWrap:'wrap', justifyContent:'center' }} sx={{ py: 2, }}>
        <Stack spacing={4}>
            <div id='geocoderContainer'></div>
            <TextField className={`display-${showFields}`}
                value={newCourseAddressLine1}
                onChange={e => setNewCourseAddressLine1(e.target.value)}
                required
                id="outlined-required"
                label="Address Line 1"
            />
            <TextField className={`display-${showFields}`}
                value={newCourseAddressLine2}
                onChange={e => setNewCourseAddressLine2(e.target.value)}
                required
                id="outlined-required"
                label="Suite or Apt # etc."
            />
            <Grid className={`display-${showFields}`} container direction="row" sx={{}}>
                <Grid item xs={8} spacing={4} sx={{}}>
                    <TextField fullWidth label='City' placeholder='City'
                        onChange={e => setNewCourseAddressCity(e.target.value)} value={newCourseAddressCity} >xs=8</TextField>
                </Grid>
                <Grid item xs={4} sx={{}} style={{paddingLeft:"2%"}}>
                    <FormControl variant="standard">
                    <InputLabel id="demo-simple-select-standard-label">State</InputLabel>
                        <Select
                            id="demo-simple-select-standard"
                            value={newCourseAddressState}
                            onChange={e => setNewCourseAddressCity(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>Select State</em>
                            </MenuItem>
                            <MenuItem value="NY">NY</MenuItem>
                            <MenuItem value="FL">FL</MenuItem>
                            <MenuItem value="CA">CA</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Grid className={`display-${showFields}`} item xs={4} sx={{}}>
                <TextField fullWidth label='Zipcode' placeholder='Zipcode'
                    onChange={e => setNewCourseAddressZipcode(e.target.value)} value={newCourseAddressZipcode}></TextField>
            </Grid>
        </Stack>
        {showFields &&
        <ReactMapGL mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{zoom: 14, latitude: newCourseLatitude, longitude: newCourseLongitude}}
            mapStyle={`mapbox://styles/mapbox/${theme.palette.mode}-v11`}
            style={{ width: '100%', height: '30vh' }}
            // onLoad={onMapLoad}
        >
            <Marker
                latitude={newCourseLatitude}
                longitude={newCourseLongitude}>
                {/* <div>
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        onClick={(e) => {
                            setSelectedCourse(course);
                            setInitialViewState({
                                zoom: 12,
                                latitude: course.latitude,
                                longitude: course.longitude,
                            });
                        }}>
                        <img
                            src={require(`../../assets/icons/${course.industry}.png`)}
                            alt='industry'
                            style={{ width: '25px' }}
                        />
                    </button>
                </div> */}
            </Marker>
        </ReactMapGL>
        }

        <Button variant="contained" size="large" align='center' disabled={[newCourseAddressLine1, newCourseAddressCity, newCourseAddressZipcode,
            newCourseAddressState, newCourseLatitude].some(val => !Boolean(val))}
            style={{margin: '25% 0 20px', width:'80%', fontSize: 26, fontFamily:'Poppins', color:'white'}} fullWidth
            onClick={props.handleNext}>
            Next
        </Button>

    </Container>

    </div>
  )
}

export default Address;