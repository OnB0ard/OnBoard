// src/components/TacoMap.jsx

import React from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import PlaceSearch from './PlaceSearch'; // PlaceSearch 컴포넌트를 불러옵니다.

const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k'; // API 키
const center = { lat: 37.4161493, lng: -122.0812166 };

export default function TacoMap() {
  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: '100vw', height: '100vh' }}
        defaultCenter={center}
        defaultZoom={11}
        mapId={'DEMO_MAP_ID'}
      >
        <PlaceSearch />
      </Map>
    </APIProvider>
  );
}