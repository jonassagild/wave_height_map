'use client'

import { MapContainer, SVGOverlay, TileLayer, useMapEvents } from 'react-leaflet';
import React, { useEffect, useState } from 'react';
import axios from 'axios'

const APIUrl = "http://127.0.0.1:8000/max_wave_height_at_point/"

const minLatitude = -60;
const maxLatitude = 70;
const minLongitude = -180;
const maxLongitude = 179.5;

const bounds = [
    [maxLatitude, maxLongitude],
    [minLatitude, minLongitude]
]

const map_bounds = [
    [180, 180],
    [-180, -180]
]

const Map = () => {

    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [maxHeight, setMaxHeight] = useState(null);

    const Markers = () => {
        const map = useMapEvents({
            click: async (e) => {
                const getMaxHeight = async () => {
                    // todo: should move this to a function or a lib or something. ugly
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    setLat(lat)
                    setLng(lng)
                    const result = await axios.get(
                        APIUrl,
                        {
                            params: {
                                lat: lat,
                                lng: lng
                            }
                        }
                    )
                    if (result.status === 200) {
                        if (result.data.calculation_valid) {
                            setMaxHeight(result.data.maximum_wave_height)
                        }
                        else {
                            setMaxHeight('NaN')
                        }
                    } else {
                        console.log("")
                    }
                    console.log(result)
                }
                getMaxHeight()
            },

            load: () => {
                map.invalidateSize();
            }
        });
        return null;
    };


    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
            <div style={{
                position: 'absolute',
                zIndex: 1000,
                top: '10px',
                right: '10px',
                background: 'white',
                padding: '10px',
                borderRadius: '5px'
            }}>
                <div>Latitude: {lat}</div>
                <div>Longitude: {lng}</div>
                <div>Max Height: {maxHeight}</div>
            </div>
            <MapContainer
                center={[51.505, -0.09]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
                maxBounds={map_bounds}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Markers />
                <SVGOverlay attributes={{ stroke: 'red' }} bounds={bounds}>
                    <rect x="0" y="0" width="100%" height="100%" fill="blue" opacity={"20%"} />
                </SVGOverlay>
            </MapContainer>
        </div>
    );
};

export default Map;
