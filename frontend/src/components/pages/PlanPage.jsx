import React, { useState, useEffect, useRef, useCallback, useMemo , useLayoutEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import CustomMarker from '../atoms/CustomMarker';
import SideBar from '../organisms/SideBar';
import WhiteBoard from '../organisms/WhiteBoard';
import MapContainer from '../organisms/Map';
import MapInitializer from '../organisms/MapInitializer';
import PlaceBlock from '../organisms/PlaceBlock';
import AccessControlModal from '../organisms/AccessControlModal';
import PlaceDetailModal from '../organisms/PlaceDetailModal';

import { useMapCoreStore, usePlaceBlocksStore, usePlaceDetailsStore, useDayMarkersStore } from '../../store/mapStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useParticipantStore } from '../../store/usePlanUserStore';
import { usePlanBookmarkWS } from '../../hooks/usePlanBookmarkWS';
import { usePlanAccessControl } from '../../hooks/usePlanAccessControl';
import { useInitialWhiteboardPlaces } from '../../hooks/useInitialWhiteboardPlaces';
import { usePlanDayScheduleWS } from '../../hooks/usePlanDayScheduleWS';
import useBookmarkStore from '../../store/mapStore/useBookmarkStore';
import { usePlaceBlockSync } from '../../hooks/usePlaceBlockSync';

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const fallbackCenter = { lat: 37.5665, lng: 126.9780 };

function useContainerSize() {
  const [node, setNode] = React.useState(null);        // 현재 DOM 노드
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  // ref로 사용할 콜백. 노드가 붙거나(detach/attach) 바뀔 때마다 호출됨.
  const ref = React.useCallback((el) => {
    setNode(el || null);
  }, []);

  React.useLayoutEffect(() => {
    if (!node) return;

    // 최초 1회 즉시 측정
    const rect = node.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(node);

    return () => ro.disconnect();
  }, [node]);  // node가 바뀌면(= 실제로 DOM에 붙으면) 다시 실행

  return [ref, size];
}


// MapInitializer는 '../organisms/MapInitializer'로 분리되었습니다.

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
  const { planId } = useParams();
  const navigate = useNavigate();
  const numericPlanId = planId ? Number(planId) : undefined;
  const accessToken = useAuthStore((s) => s.accessToken);
  const {
    loadBookmarks,
  } = useBookmarkStore();

  // ========== DaySchedule WebSocket 연결 (래퍼 훅) ==========
  const {
    connected: dayWsConnected,
    createDay,
    renameDay,
    moveDayRealtime,
    updateSchedule,
    deleteDay,
  } = usePlanDayScheduleWS({ planId: numericPlanId, accessToken });

  // Bookmark WS 연결을 PlanPage 전용 훅으로 캡슐화
  usePlanBookmarkWS({ planId: numericPlanId, accessToken });

  const { userId } = useAuthStore(); // PlanAccessRoute가 로그인 여부를 보장하므로 userId를 가져옵니다.
  const { error: participantError, isLoading: isParticipantLoading } = useParticipantStore();
  const { accessStatus, modalState, handleRequestPermission, handleCloseModal } = usePlanAccessControl(planId);

  const [wrapRef, {width: wrapW, height: wrapH}] = useContainerSize();

  const {
    isMapVisible,
    markerPosition,
    markerType,
    panToPlace,
    lastMapPosition,
    mapInstance,
  } = useMapCoreStore();
  const {
    dayMarkers,
    showDayMarkers,
    clearDayMarkers,
  } = useDayMarkersStore();
  const {
    placeBlocks,
    addPlaceBlock,
    removePlaceBlock,
    updatePlaceBlockPosition,
    fetchDetailsAndAddBlock,
    hidePlaceBlockMarkers,
    setActivePlanId,
    replaceAllFromServer: replacePlaceBlocksFromServer,
  } = usePlaceBlocksStore();

  const { sendMessage: sendPlaceBlockMessage, connectionStatus: placeBlockConnectionStatus } = usePlaceBlockSync({
    planId: numericPlanId,
    accessToken,
    wsUrl: 'https://i13a504.p.ssafy.io/ws',
  });

  const [isSideBarVisible, setIsSideBarVisible] = useState(true);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);

  const mapRef = useRef(null);
  const whiteBoardRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Bookmark WS sender 주입은 usePlanBookmarkWS 훅에서 처리됩니다.

  useEffect(() => {
    if (numericPlanId != null) {
      loadBookmarks(numericPlanId);
    }
  }, [numericPlanId, loadBookmarks]);

  // plan 활성화 + 초기 PLACE 로드
  useInitialWhiteboardPlaces(numericPlanId);

  useEffect(() => {
    if (participantError) {
      console.error('참여자 정보 로딩 에러:', participantError);
    }
  }, [participantError]);

  useEffect(() => {
    if (lastMapPosition) {
      setMapCenter(lastMapPosition);
    }
  }, [lastMapPosition]);

  // 일차 마커 표시 시 지도 자동 줌/이동 (마커들이 한 화면에 보이도록)
  useEffect(() => {
    if (!mapInstance) return;
    if (!showDayMarkers || !dayMarkers || dayMarkers.length === 0) return;

    // LatLngBounds로 마커 범위 계산
    const bounds = new window.google.maps.LatLngBounds();
    dayMarkers.forEach((m) => {
      // m.position은 { lat, lng }
      if (m?.position?.lat != null && m?.position?.lng != null) {
        bounds.extend(m.position);
      }
    });

    // 마커 1개일 때는 적절한 줌으로 센터 고정
    const validCount = dayMarkers.filter((m) => m?.position?.lat != null && m?.position?.lng != null).length;
    if (validCount === 1) {
      const single = dayMarkers.find((m) => m?.position?.lat != null && m?.position?.lng != null);
      mapInstance.setCenter(single.position);
      mapInstance.setZoom(17); // 더 타이트하게
      return;
    }

    // 여러 개면 fitBounds로 한눈에 보이도록, 사이드바/상단 여백 고려 패딩
    try {
      // 더 타이트한 패딩으로 최대한 확대
      mapInstance.fitBounds(bounds, 40);
    } catch (e) {
      // bounds가 비정상적이거나 오류가 나도 앱이 죽지 않도록 방어
      console.warn('fitBounds failed:', e);
    }
  }, [mapInstance, showDayMarkers, dayMarkers]);

  // =================== Handlers ===================
  // 접근 권한 핸들러는 usePlanAccessControl 훅에서 제공합니다.

// PlaceBlock 삭제
const handleRemove = (id) => {
removePlaceBlock(id, numericPlanId);
// WebSocket으로 PlaceBlock 삭제 알림
const deletePayload = { whiteBoardId: numericPlanId, type: 'PLACE', whiteBoardObjectId: Number(id) };
console.groupCollapsed('[PlaceBlock][SEND] DELETE');
console.log('planId:', planId, 'payload:', deletePayload);
console.groupEnd();
sendPlaceBlockMessage('DELETE', deletePayload);
// 레거시 호환 전송 (선택):
// sendPlaceBlockMessage('PLACEBLOCK_REMOVED', { id });
};

// 마우스 드래그 시작 (화이트보드 내에서 이동)
const handleMouseDown = (e, block) => {
if (isDailyPlanModalOpen) return;

setDraggedBlock(block);
const rect = e.currentTarget.getBoundingClientRect();
const offsetX = e.clientX - rect.left;
const offsetY = e.clientY - rect.top + 50;
    
// 오프셋을 ref에 저장
dragOffsetRef.current = { x: offsetX, y: offsetY };
};

// 전역 마우스 이벤트 리스너 추가 (끌고 다니기)
useEffect(() => {
const handleGlobalMouseMove = (e) => {
if (draggedBlock && !isDailyPlanModalOpen) {
const newX = e.clientX - dragOffsetRef.current.x;
const newY = e.clientY - dragOffsetRef.current.y;
updatePlaceBlockPosition(draggedBlock.id, { x: newX, y: newY }, numericPlanId);
        
// WebSocket으로 PlaceBlock 이동 알림 (flat x,y)
const movePayload = {
  whiteBoardId: numericPlanId,
  type: 'PLACE',
  whiteBoardObjectId: Number(draggedBlock.id),
  x: newX,
  y: newY,
};
console.groupCollapsed('[PlaceBlock][SEND] MOVE');
console.log('planId (numeric):', numericPlanId, 'payload:', movePayload);
console.groupEnd();
sendPlaceBlockMessage('MOVE', movePayload);
// 레거시 호환 전송 (선택):
// sendPlaceBlockMessage('PLACEBLOCK_MOVED', { id: draggedBlock.id, position: { x: newX, y: newY } });
}
};

const handleGlobalMouseUp = () => {
  if (draggedBlock) {
    // 최종 좌표로 MODIFY 커밋 전송
    try {
      const latest = Array.isArray(placeBlocks)
        ? placeBlocks.find((b) => b.id === draggedBlock.id)
        : null;
      const x = latest?.position?.x;
      const y = latest?.position?.y;
      if (x != null && y != null) {
        const commitPayload = {
          whiteBoardId: numericPlanId,
          type: 'PLACE',
          whiteBoardObjectId: Number(draggedBlock.id),
          x,
          y,
        };
        console.groupCollapsed('[PlaceBlock][SEND] MODIFY (commit)');
        console.log('planId (numeric):', numericPlanId, 'payload:', commitPayload);
        console.groupEnd();
        sendPlaceBlockMessage('MODIFY', commitPayload);
      }
    } catch (e) {
      console.warn('Failed to send MODIFY commit on mouseup:', e);
    }
    setDraggedBlock(null);
  }
};

    if (draggedBlock && !isDailyPlanModalOpen) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedBlock, isDailyPlanModalOpen, updatePlaceBlockPosition, numericPlanId, placeBlocks, sendPlaceBlockMessage]);

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
        fetchDetailsAndAddBlock(placeId, position, numericPlanId, sendPlaceBlockMessage);
      }
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  // 일정 추가 모달 상태 변경 핸들러
  const handleDailyPlanModalToggle = (isOpen) => {
    setIsDailyPlanModalOpen(isOpen);
    // 모달이 닫힐 때 일차 마커를 제거하고 PlaceBlock 마커를 복원
    if (!isOpen) {
      clearDayMarkers();
    }
  };

  // 접근 제어 조건부 렌더링
  if (accessStatus === 'loading') {
    return <div>Loading...</div>;
  }

  // ...
  if (accessStatus !== 'approved') {
    return (
      <AccessControlModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        type={modalState.type}
        onRequestPermission={accessStatus === 'denied' ? handleRequestPermission : null}
      />
    );
  }

  return (
    <div 
      ref={wrapRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ 
        position: 'relative', 
        overflow: 'visible',
        top:'0px',
        width: '92vw', 
        height: '90vh',
        margin: '50px auto 0',
        backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.2s ease',
        cursor: draggedBlock ? 'grabbing' : 'default'
      }}
    >
        <SideBar onDailyPlanModalToggle={handleDailyPlanModalToggle} planId={Number(planId)} />
        <WhiteBoard
          planId={Number(planId)}
          viewportSize={{ width: wrapW, height: wrapH }}
        />        {/* <EditToolBar /> */}
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
                {!hidePlaceBlockMarkers && placeBlocks.map((block) => {
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

              {/* 일차별 장소 마커들 (DailyPlanCreate1에서 선택된 일차) */}
              {showDayMarkers && dayMarkers.map((marker) => (
                <CustomMarker
                  key={`day-marker-${marker.id}`}
                  position={marker.position}
                  type={marker.type}
                  isTemporary={true}
                  title={`${marker.name} (${marker.dayIndex + 1}일차)`}
                  color={marker.color}
                />
              ))}
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
            zIndex: draggedBlock?.id === block.id ? 2000 : 1000,
            cursor: 'grab'
          }}
          onClick={() => panToPlace(block)} // PlaceBlock 클릭 시 마커 표시 및 지도 이동
        >
          <PlaceBlock
            place={block}
            onRemove={(id) => handleRemove(id)}
            onEdit={() => {}}
            onMouseDown={handleMouseDown}
            isDailyPlanModalOpen={isDailyPlanModalOpen}
          />
        </div>
      ))}
      
      {/* 장소 상세 모달: 스토어 상태에 따라 표시 */}
      <PlaceDetailModal />
    </div>
  );
};

export default PlanPage;