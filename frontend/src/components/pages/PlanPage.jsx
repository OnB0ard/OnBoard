import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import CustomMarker from '../atoms/CustomMarker';
import SideBar from '../organisms/SideBar';
import WhiteBoard from '../organisms/WhiteBoard';
import Map from '../organisms/Map';
import EditToolBar from '../organisms/EditToolBar';
import PlaceBlock from '../organisms/PlaceBlock';
import DailyPlanCreate from '../organisms/DailyPlanCreate';
import useMapStore from '../../store/useMapStore';


const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k';



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

const Plan = () => {
  const { planId } = useParams();
  const {
    isMapVisible,
    placeBlocks,
    addPlaceBlock,
    removePlaceBlock,
    updatePlaceBlockPosition,
    markerPosition,
    markerType,
    fetchDetailsAndAddBlock,
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
        <APIProvider apiKey={apiKey}>
          <Map>
            {/* 계획에 추가된 장소들의 마커 */}
            {placeBlocks.map((block) => {
              // block.geometry.location이 없으면 마커를 렌더링하지 않음
              if (!block.geometry?.location) return null;

              return (
                <CustomMarker
                  key={block.id}
                  position={{
                    lat: block.geometry.location.lat(),
                    lng: block.geometry.location.lng(),
                  }}
                  type={getMarkerTypeFromPlace(block)}
                />
              );
            })}

            {/* 현재 선택된 장소의 임시 마커 */}
            {markerPosition && (
              <CustomMarker
                position={{
                  lat: markerPosition.lat,
                  lng: markerPosition.lng,
                }}
                color="blue" // 임시 마커는 다른 색으로 구분
                type={markerType}
              />
            )}
          </Map>
        </APIProvider>
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

export default Plan;