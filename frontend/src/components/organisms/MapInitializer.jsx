import React, { useEffect, useRef, useCallback } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useMapCoreStore } from '../../store/mapStore';

// 지도 초기화 로직을 담당하는 컴포넌트 (PlanPage에서 분리)
function MapInitializer() {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const {
    setMapInstance,
    setPlacesService,
    setPlaceConstructor,
    lastMapPosition,
    setLastMapPosition,
  } = useMapCoreStore();

  // 프로그래밍적 맵 변경을 추적하는 ref (무한 루프 방지)
  const isProgrammaticChange = useRef(false);

  // 역할 1: 맵 관련 인스턴스를 스토어에 설정 (map, placesLib가 준비되면 한 번만 실행)
  useEffect(() => {
    if (!map || !placesLib) return;

    setMapInstance(map);
    setPlacesService(new placesLib.PlacesService(map));
    setPlaceConstructor(placesLib.Place);
  }, [map, placesLib, setMapInstance, setPlacesService, setPlaceConstructor]);

  // 역할 2: 맵의 초기 위치 설정 (map이 준비되면 한 번만 실행)
  useEffect(() => {
    if (!map) return;

    // 프로그래밍적 변경 시작
    isProgrammaticChange.current = true;

    if (lastMapPosition) {
      map.setCenter(lastMapPosition.center);
      map.setZoom(lastMapPosition.zoom);
    } else {
      // 초기 위치가 스토어에 없으면 한국 전체 보기로 설정
      const koreaCenter = { lat: 36.5, lng: 127.5 };
      const koreaZoom = 7;
      map.setCenter(koreaCenter);
      map.setZoom(koreaZoom);
    }

    // 프로그래밍적 변경 완료 (약간의 지연 후 플래그 해제)
    const t = setTimeout(() => {
      isProgrammaticChange.current = false;
    }, 100);

    return () => clearTimeout(t);
  }, [map, lastMapPosition]);

  // 역할 3: 맵 이벤트 리스너 등록 (map이 준비되면 한 번만 등록)
  const handlePositionChange = useCallback(() => {
    if (!map) return;

    // 프로그래밍적 변경 중이면 상태 업데이트 방지
    if (isProgrammaticChange.current) {
      return;
    }

    setLastMapPosition({
      center: map.getCenter().toJSON(),
      zoom: map.getZoom(),
    });
  }, [map, setLastMapPosition]);

  useEffect(() => {
    if (!map) return;

    const dragListener = map.addListener('dragend', handlePositionChange);
    const zoomListener = map.addListener('zoom_changed', handlePositionChange);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.google.maps.event.removeListener(dragListener);
      window.google.maps.event.removeListener(zoomListener);
    };
  }, [map, handlePositionChange]);

  return null;
}

export default MapInitializer;
