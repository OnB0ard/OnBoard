import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { APIProvider, useMapsLibrary, Map, useMap } from '@vis.gl/react-google-maps';
import CustomMarker from '../atoms/CustomMarker';
import SideBar from '../organisms/SideBar';
import WhiteBoard from '../organisms/WhiteBoard';
import MapContainer from '../organisms/Map';
import EditToolBar from '../organisms/EditToolBar';
import PlaceBlock from '../organisms/PlaceBlock';
import DailyPlanCreate from '../organisms/DailyPlanCreate';

import useMapStore from '../../store/useMapStore';
import { useAuthStore } from '../../store/useAuthStore';


const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k';

const fallbackCenter = { lat: 37.5665, lng: 126.9780 };

// 지도 초기화 로직을 담당하는 컴포넌트
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
  }, [map]); // lastMapPosition 의존성 제거

  // 역할 3: 맵 이벤트 리스너 등록 (map이 준비되면 한 번만 등록)
  useEffect(() => {
    if (!map) return;

    const handlePositionChange = () => {
      setLastMapPosition({
        center: map.getCenter().toJSON(),
        zoom: map.getZoom(),
      });
    };

    const dragListener = map.addListener('dragend', handlePositionChange);
    const zoomListener = map.addListener('zoom_changed', handlePositionChange);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.google.maps.event.removeListener(dragListener);
      window.google.maps.event.removeListener(zoomListener);
    };
  }, [map, setLastMapPosition]); // 루프를 유발하던 lastMapPosition 의존성 제거
}

// Google Place API의 카테고리를 CustomMarker의 type으로 변환
const getMarkerTypeFromPlace = (place) => {
  if (!place.types) return 'default';

  if (place.types.includes('lodging')) return 'accommodation';
  if (place.types.includes('restaurant')) return 'restaurant';
  if (place.types.includes('cafe')) return 'cafe';
  if (place.types.includes('store') || place.types.includes('shopping_mall')) return 'store';
  if (place.types.includes('tourist_attraction') || place.types.includes('point_of_interest')) return 'attraction';

  return 'default';
};

const PlanPage = () => {
  const mapsLib = useMapsLibrary('maps');
  const { planId } = useParams();
  
  // 인증 상태 확인
  const { userId, userName } = useAuthStore();
  
  const {
    isMapVisible,
    placeBlocks,
    addPlaceBlock,
    removePlaceBlock,
    updatePlaceBlockPosition,
    markerPosition,
    markerType,
    fetchDetailsAndAddBlock,
    panToPlace,
  } = useMapStore();

  // 마우스 드래그 상태
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 드래그앤드롭 상태 (검색 결과에서)
  const [isDragOver, setIsDragOver] = useState(false);

  // 일정 추가 모달 상태
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);

  // PlaceBlock 삭제
  const handleRemove = (id) => {
    removePlaceBlock(id);
  };

  // 마우스 드래그 시작 (화이트보드 내에서 이동)
  const handleMouseDown = (e, block) => {
    if (isDailyPlanModalOpen) return;

    setDraggedBlockId(block.id);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  // 전역 마우스 이벤트 리스너 추가 (끌고 다니기)
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (draggedBlockId && !isDailyPlanModalOpen) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        updatePlaceBlockPosition(draggedBlockId, { x: newX, y: newY });
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedBlockId) {
        setDraggedBlockId(null);
      }
    };

    if (draggedBlockId && !isDailyPlanModalOpen) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedBlockId, dragOffset, isDailyPlanModalOpen, updatePlaceBlockPosition]);

  // 검색 결과에서 드래그앤드롭 처리
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // 일정 추가 모달이 열려있으면 드래그 리브 무시
    if (isDailyPlanModalOpen) {
      return;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (isDailyPlanModalOpen) return;

    try {
      const placeJson = e.dataTransfer.getData('application/json');
      if (placeJson) {
        const { placeId } = JSON.parse(placeJson);
        const position = { x: e.clientX, y: e.clientY };
        // placeId와 위치 정보를 전달하여 상세 정보 로딩 및 블록 추가를 요청합니다.
        fetchDetailsAndAddBlock(placeId, position);
      }
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  // 일정 추가 모달 상태 변경 핸들러
  const handleDailyPlanModalToggle = (isOpen) => {
    setIsDailyPlanModalOpen(isOpen);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ 
        position: 'relative', 
        overflow: 'visible',
        top:'50px',
        width: '100vw', 
        height: '100vh',
        backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.2s ease',
        cursor: draggedBlockId ? 'grabbing' : 'default'
      }}
    >
        <SideBar onDailyPlanModalToggle={handleDailyPlanModalToggle} />
        <WhiteBoard />
        {/* <EditToolBar /> */}
        {isMapVisible && (
          <MapContainer>
            <APIProvider apiKey={apiKey}>
              <Map
                style={{ width: '100%', height: '100%' }}
                defaultCenter={fallbackCenter}
                defaultZoom={15}
                mapId={'47dc3c714439f466fe9fcbd3'}
                disableDefaultUI={true}
              >
                <MapInitializer />
                {/* 계획에 추가된 장소들의 마커 */}
                {placeBlocks.map((block) => {
                  // block에 위치 정보가 없으면 마커를 렌더링하지 않음
                  if (!block.latitude || !block.longitude) return null;

                  return (
                    <CustomMarker
                      key={block.id}
                      position={{
                        lat: block.latitude,
                        lng: block.longitude,
                      }}
                      type={block.primaryCategory || '기타'}
                      onClick={() => panToPlace(block)}
                    />
                  );
                })}

                {/* 현재 선택된 장소의 임시 마커 */}
                {markerPosition && (
                  <CustomMarker
                    key={`temp-${markerPosition.lat}-${markerPosition.lng}`}
                    position={markerPosition}
                    type={markerType}
                    isTemporary={true}
                  />
                )}
              </Map>
            </APIProvider>
          </MapContainer>
        )}
        
        {/* 화이트보드의 PlaceBlock들 */}
        {placeBlocks.map((block) => (
          <div
            key={block.id}
            style={{
              position: 'absolute',
              left: block.position.x,
              top: block.position.y,
              zIndex: draggedBlockId === block.id ? 2000 : 1000,
              cursor: 'grab'
            }}
            onClick={() => panToPlace(block)} // PlaceBlock 클릭 시 마커 표시 및 지도 이동
          >
            <PlaceBlock
              place={block}
              onRemove={handleRemove}
              onEdit={() => {}}
              onMouseDown={handleMouseDown}
              isDailyPlanModalOpen={isDailyPlanModalOpen}
            />
          </div>
        ))}
      </div>
  );
};

export default PlanPage;