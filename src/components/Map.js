'use client'

import { MapContainer, SVGOverlay, TileLayer, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { NetCDFReader } from 'netcdfjs';

const dataFileName = "waves_2019-01-01.nc";

// we have data from latitude -60 to 70 and longitude -180 to 179.5
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

// gathered from reader.header.variables (hmax)
// should be loaded at start in stead
// Another value "offset" is also found, but seems to be related to reading of the data.
const latitudeSize = 261;
const longtidudeSize = 720;
const timeSize = 24;
const missingValue = -32767;
const fillValue = -32767;

const scaleFactor = 0.0004376997323664538;
const addOffset = 14.37323738797149;

const latIndexLookup = {};
const lngIndexLookup = {};
for (let i = 0; i < latitudeSize; i++) {
    latIndexLookup[maxLatitude - i * 0.5] = i;
}
for (let i = 0; i < longtidudeSize; i++) {
    lngIndexLookup[minLongitude + i * 0.5] = i;
}

const calcRealValue = (value) => {
    return (value * scaleFactor) + addOffset;
}

const roundToHalf = (value) => {
    return Math.round(value * 2) / 2;
}

const Map = () => {

    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [maxHeight, setMaxHeight] = useState(null);
    const [waveData, setWaveData] = useState(null)

    useEffect(() => {
        // when loading the component: fetch and initialize the waveData
        fetch(dataFileName)
            .then(res => res.arrayBuffer())
            .then(buffer => {
                const reader = new NetCDFReader(buffer);
                const waveData = reader.getDataVariable('hmax')
                setWaveData(waveData);
            });
    }, []);

    const getDataAtPointForAllTime = (latIndex, lngIndex, data) => {
        // the order of the index is [2, 1, 0] which translates to ['time', 'latitude', 'longitude']
        // the index of a unique point would be:
        // const index = timeIndex*261*720 + latitudeIndex*720 + longitudeIndex
        const dataAtPointForAllTimes = new Array(timeSize);
        for (let timeIndex = 0; timeIndex < timeSize; timeIndex++) {
            const index = timeIndex * latitudeSize * longtidudeSize + latIndex * longtidudeSize + lngIndex;
            dataAtPointForAllTimes[timeIndex] = waveData[index];
        }
        return dataAtPointForAllTimes;
    }

    const Markers = () => {
        const map = useMapEvents({
            click: async (e) => {
                if (!waveData) {
                    // todo: should probably print a message saying the data isn't loaded yet.
                    return
                }
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                setLat(lat);
                setLng(lng);

                const lat_rounded_to_half = roundToHalf(lat);
                const lng_rounded_to_half = roundToHalf(lng);

                const latIndex = latIndexLookup[lat_rounded_to_half]
                const lngIndex = lngIndexLookup[lng_rounded_to_half]

                const dataAtPointForAllTimes = getDataAtPointForAllTime(latIndex, lngIndex, waveData)

                const dataAtPointForAllTimesRealValue = dataAtPointForAllTimes.map(value => {
                    if (value === fillValue | value === missingValue) {
                        return NaN
                    }
                    return calcRealValue(value)
                });

                const maxHeightAtPoint = Math.max(...dataAtPointForAllTimesRealValue)
                setMaxHeight(maxHeightAtPoint);
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
