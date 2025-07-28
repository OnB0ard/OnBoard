import React, { useState, useEffect } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';

// API 키
const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k';
// 지도 중앙 위치
const center = { lat: 37.4161493, lng: -122.0812166 };

// 메인 앱 컴포넌트
export default function App() {
  return (
    // APIProvider로 전체를 감싸고 API 키를 전달합니다.
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: '100vw', height: '100vh' }}
        defaultCenter={center}
        defaultZoom={11}
        mapId={'DEMO_MAP_ID'}
      >
        {/* 장소 검색 및 마커 표시를 담당할 컴포넌트 */}
        <PlaceSearch />
      </Map>
    </APIProvider>
  );
}

// 장소 검색 로직을 처리하는 자식 컴포넌트
function PlaceSearch() {
  const map = useMap(); // Map 인스턴스에 접근
  const placesLib = useMapsLibrary('places'); // places 라이브러리 로드
  const [places, setPlaces] = useState([]); // 검색 결과를 저장할 state

  useEffect(() => {
    // map과 places 라이브러리가 준비되지 않았으면 아무것도 하지 않음
    if (!map || !placesLib) return;

    // PlaceService 인스턴스 생성
    const placeService = new placesLib.PlaceService(map);

    const request = {
      textQuery: 'Tacos in Mountain View',
      fields: ['displayName', 'location', 'businessStatus'],
      locationBias: center,
      maxResultCount: 8,
    };

    // 비동기 검색 실행
    placeService.searchByText(request, (results, status) => {
      if (status === 'OK' && results) {
        console.log(results);
        setPlaces(results); // 검색 결과를 state에 저장
      } else {
        console.log('No results');
      }
    });

  }, [map, placesLib]); // map 또는 placesLib가 준비되면 이 effect를 실행

  return (
    <>
      {/* state에 저장된 장소들을 순회하며 마커를 표시 */}
      {places.map((place) => (
        <AdvancedMarker
          key={place.id}
          position={place.location}
          title={place.displayName}
        />
      ))}
    </>
  );
}