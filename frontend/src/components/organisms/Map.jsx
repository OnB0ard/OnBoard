import React, { useState, useEffect } from 'react';
import { Map as GoogleMap, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

import { Rnd } from 'react-rnd';
import useMapStore from '../../store/useMapStore';
import 'react-resizable/css/styles.css';

const fallbackCenter = { lat: 37.5665, lng: 126.9780 };

export default function Map({ children }) {
  const { setIsMapVisible } = useMapStore();

  const [size, setSize] = useState({ width: 300, height: 300 });
  const [position, setPosition] = useState({ x: 1000, y: 100 });

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
        minWidth={300} minHeight={200}
        dragHandleClassName="map-drag-handle"
        bounds="window"
      >
        <div 
          style={{
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            height: '100%',
            background: 'white', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid #ccc',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget.querySelector('.map-close-btn');
            if (btn) btn.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget.querySelector('.map-close-btn');
            if (btn) btn.style.opacity = '0';
          }}
        >
          <div 
            className="map-drag-handle" 
            style={{
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0,
              zIndex: 10, 
              background: 'transparent', 
              padding: '10px',
              cursor: 'move'
            }}
          >
            <button 
              className="map-close-btn"
              onClick={() => setIsMapVisible(false)} 
              style={{
                border: 'none', 
                background: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '16px', 
                cursor: 'pointer', 
                padding: '4px 8px', 
                lineHeight: '1',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                color: '#374151'
              }}
            >
              ✕
            </button>
          </div>
          <GoogleMap
            style={{ width: '100%', height: '100%' }}
            defaultCenter={fallbackCenter}
            defaultZoom={15}
            mapId={'47dc3c714439f466fe9fcbd3'}
            disableDefaultUI={true}
          >
            <MapInitializer />
            {children}
          </GoogleMap>
        </div>
      </Rnd>
    </>
  );
}

function MapInitializer() {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const {
    setMapInstance,
    setPlacesService,
    setPlaceConstructor,
    lastMapPosition,
    setLastMapPosition,
  } = useMapStore();

  useEffect(() => {
    if (!map || !placesLib) return;

    // Zustand 스토어에 인스턴스 및 생성자 저장
    setMapInstance(map);
    setPlacesService(new placesLib.PlacesService(map));
    setPlaceConstructor(placesLib.Place);

    // 마지막 위치가 있으면 그 위치로 설정
    if (lastMapPosition) {
      map.setCenter(lastMapPosition.center);
      map.setZoom(lastMapPosition.zoom);
    } else {
      // 마지막 위치가 없으면 대한민국 전체가 보이는 위치로 설정하고 저장
      const koreaCenter = { lat: 36.5, lng: 127.5 };
      const koreaZoom = 6;
      map.setCenter(koreaCenter);
      map.setZoom(koreaZoom);
      setLastMapPosition({ center: koreaCenter, zoom: koreaZoom });
    }

    // 지도 이동 및 줌 변경 시 마지막 위치 업데이트
    const dragListener = map.addListener('dragend', () => {
      setLastMapPosition({ center: map.getCenter().toJSON(), zoom: map.getZoom() });
    });
    const zoomListener = map.addListener('zoom_changed', () => {
      setLastMapPosition({ center: map.getCenter().toJSON(), zoom: map.getZoom() });
    });

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.google.maps.event.removeListener(dragListener);
      window.google.maps.event.removeListener(zoomListener);
    };
  }, [map, placesLib, setMapInstance, setPlacesService, setPlaceConstructor, lastMapPosition, setLastMapPosition]);

  return null;
}

const rndContainerStyle = {
  display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
  background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  borderRadius: '12px', overflow: 'hidden', border: '1px solid #ccc',
  position: 'relative'
};
const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  position: 'absolute', top: 0, left: 0, right: 0,
  zIndex: 10, background: 'transparent', padding: '10px',
  cursor: 'move', fontWeight: 'bold'
};
const closeButtonStyle = { 
  border: 'none', 
  background: 'rgba(255, 255, 255, 0.9)', 
  fontSize: '16px', 
  cursor: 'pointer', 
  padding: '4px 8px', 
  lineHeight: '1',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  color: '#374151'
};