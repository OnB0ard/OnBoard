// src/components/organisms/TacoMap.jsx

import React, { useState, useEffect } from 'react';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import PlaceSearch from './PlaceSearch';
import SearchResultModal from './SearchResultModal';
import { Rnd } from 'react-rnd';
import useMapStore from '../../store/useMapStore';
import 'react-resizable/css/styles.css';

const fallbackCenter = { lat: 37.5665, lng: 126.9780 };

export default function TacoMap() {
  const { textQuery, findPlaces, setIsMapVisible, mapInstance, setMapInstance } = useMapStore();
  const [size, setSize] = useState({ width: 600, height: 500 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  
  const placesLib = useMapsLibrary('places');
  const coreLib = useMapsLibrary('core');

  // 검색 실행
  useEffect(() => {
    if (mapInstance && placesLib && coreLib && textQuery) {
      findPlaces(placesLib, coreLib);
    }
  }, [mapInstance, placesLib, coreLib, textQuery, findPlaces]);

  return (
    <>
      <Rnd
        size={size}
        position={position}
        onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, pos) => {
          setSize({ width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10) });
          setPosition(pos);
        }}
        minWidth={400} minHeight={300}
        dragHandleClassName="map-drag-handle"
        bounds="window"
      >
        <div style={rndContainerStyle}>
          <div className="map-drag-handle" style={headerStyle}>
            <span>지도</span>
            <button onClick={() => setIsMapVisible(false)} style={closeButtonStyle}>✕</button>
          </div>
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={fallbackCenter}
            defaultZoom={11}
            mapId={'47dc3c714439f466fe9fcbd3'}
            disableDefaultUI={true}
          >
            <MapInitializer setMapInstance={setMapInstance} />
            <PlaceSearch />
          </Map>
        </div>
      </Rnd>
      <SearchResultModal />
    </>
  );
}

function MapInitializer({ setMapInstance }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    setMapInstance(map);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.panTo(userLocation); map.setZoom(15);
        },
        () => console.info("사용자 위치 정보를 가져올 수 없어 기본 위치로 시작합니다.")
      );
    }
  }, [map, setMapInstance]);
  return null;
}

const rndContainerStyle = {
  display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
  background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  borderRadius: '12px', overflow: 'hidden', border: '1px solid #ccc',
};
const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  zIndex: 10, background: '#f1f1f1', padding: '10px',
  cursor: 'move', borderBottom: '1px solid #ccc', fontWeight: 'bold'
};
const closeButtonStyle = { 
  border: 'none', background: 'transparent', fontSize: '24px', 
  cursor: 'pointer', padding: '0 5px', lineHeight: '1' 
};