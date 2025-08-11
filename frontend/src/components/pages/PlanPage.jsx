import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { APIProvider, useMapsLibrary, Map, useMap } from '@vis.gl/react-google-maps';
import CustomMarker from '../atoms/CustomMarker';
import SideBar from '../organisms/SideBar';
import WhiteBoard from '../organisms/WhiteBoard';
import MapContainer from '../organisms/Map';
import PlaceBlock from '../organisms/PlaceBlock';
import AccessControlModal from '../organisms/AccessControlModal';

import { useMapCoreStore, usePlaceBlocksStore, usePlaceDetailsStore, useDayMarkersStore } from '../../store/mapStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useParticipantStore } from '../../store/usePlanUserStore';
import useBookmarkWebSocket from '../../hooks/useBookmarkWebSocket';
import useBookmarkStore from '../../store/mapStore/useBookmarkStore';
import { useStompPlaceBlock } from '../../hooks/useStompPlaceBlock';


const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
    setTimeout(() => {
      isProgrammaticChange.current = false;
    }, 100);
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
  const numericPlanId = planId ? Number(planId) : undefined;
  const accessToken = useAuthStore((s) => s.accessToken);
  // headers는 렌더마다 동일 참조를 유지하도록 메모이제이션하여 불필요한 재연결을 방지
  const wsHeaders = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );
  const {
    loadBookmarks,
    handleBookmarkWsMessage,
    setBookmarkWsSenders,
    clearBookmarkWsSenders,
  } = useBookmarkStore();

  // Bookmark WebSocket: subscribe/send for current plan and inject senders to store
  const { sendCreate, sendDelete } = useBookmarkWebSocket({
    planId: numericPlanId,
    onMessage: handleBookmarkWsMessage,
    headers: wsHeaders,
  });

  const { userId } = useAuthStore(); // PlanAccessRoute가 로그인 여부를 보장하므로 userId를 가져옵니다.
  const { fetchMyRole, joinPlan, error: participantError, isLoading: isParticipantLoading } = useParticipantStore();

  const [accessStatus, setAccessStatus] = useState('loading');
  const [modalState, setModalState] = useState({ isOpen: false, type: 'permission', message: '' });

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
  } = usePlaceBlocksStore();

  // PlaceBlock WebSocket 연결
  const { sendMessage: sendPlaceBlockMessage, connectionStatus: placeBlockConnectionStatus, myUuid } = useStompPlaceBlock({
    planId,
    accessToken,
    wsUrl: 'https://i13a504.p.ssafy.io/ws',
    onMessage: (msg) => {
      const { type, payload, uuid } = msg;

      console.log('실시간 PlaceBlock 업데이트 수신:', msg);

      // 내가 보낸 메시지는 무시 (로컬에 이미 반영됨)
      if (uuid === myUuid) return;

      switch (type) {
        case 'CREATE_PLACE': {
          const { objectInfo, whiteBoardPlace, whiteBoardObjectId } = payload || {};
          if (!objectInfo || !whiteBoardPlace) {
            console.warn('CREATE_PLACE payload 누락:', payload);
            break;
          }
          const position = { x: objectInfo.x, y: objectInfo.y };
          // WhiteBoard 응답을 processedPlace 형태로 매핑
          const place = {
            id: whiteBoardObjectId,
            googlePlaceId: whiteBoardPlace.googlePlaceId,
            placeName: whiteBoardPlace.placeName,
            address: whiteBoardPlace.address,
            latitude: whiteBoardPlace.latitude,
            longitude: whiteBoardPlace.longitude,
            googleImg: whiteBoardPlace.imageUrl ? [whiteBoardPlace.imageUrl] : [],
            rating: whiteBoardPlace.rating,
            ratingCount: whiteBoardPlace.ratingCount,
            siteUrl: whiteBoardPlace.siteUrl,
            placeUrl: whiteBoardPlace.placeUrl,
            phoneNumber: whiteBoardPlace.phoneNumber,
            primaryCategory: whiteBoardPlace.category,
          };
          console.groupCollapsed('[PlaceBlock][ADD] from WS CREATE_PLACE');
          console.log('position:', position);
          console.log('place:', place);
          console.groupEnd();
          addPlaceBlock(place, position, planId);
          break;
        }
        case 'MOVE': {
          const { whiteBoardObjectId, objectInfo } = payload || {};
          if (!whiteBoardObjectId || !objectInfo) {
            console.warn('MOVE payload 누락:', payload);
            break;
          }
          const position = { x: objectInfo.x, y: objectInfo.y };
          console.groupCollapsed('[PlaceBlock][MOVE] from WS');
          console.log('id:', whiteBoardObjectId, 'position:', position);
          console.groupEnd();
          updatePlaceBlockPosition(whiteBoardObjectId, position, planId);
          break;
        }
        case 'DELETE': {
          const { whiteBoardObjectId } = payload || {};
          if (!whiteBoardObjectId) {
            console.warn('DELETE payload 누락:', payload);
            break;
          }
          console.groupCollapsed('[PlaceBlock][DELETE] from WS');
          console.log('id:', whiteBoardObjectId);
          console.groupEnd();
          removePlaceBlock(whiteBoardObjectId, planId);
          break;
        }
        case 'PLACEBLOCK_ADDED':
          console.log('PlaceBlock 추가 수신:', payload);
          addPlaceBlock(payload.place, payload.position, planId);
          break;
        case 'PLACEBLOCK_REMOVED':
          console.log('PlaceBlock 제거 수신:', payload);
          removePlaceBlock(payload.id, planId);
          break;
        case 'PLACEBLOCK_MOVED':
          console.log('PlaceBlock 이동 수신:', payload);
          updatePlaceBlockPosition(payload.id, payload.position, planId);
          break;
        default:
          console.warn('알 수 없는 PlaceBlock 메시지 타입:', type);
      }
    }
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

  // =================== Effects ===================
  // Inject WS senders to store so UI actions use WebSocket instead of REST
  useEffect(() => {
    setBookmarkWsSenders({ sendCreate, sendDelete });
    return () => {
      clearBookmarkWsSenders();
    };
  }, [sendCreate, sendDelete, setBookmarkWsSenders, clearBookmarkWsSenders]);

  // Initial bookmark load via REST for the current plan (read-only)
  useEffect(() => {
    if (numericPlanId != null) {
      loadBookmarks(numericPlanId);
    }
  }, [numericPlanId, loadBookmarks]);
  // planId가 변경될 때 PlaceBlock 스토어에 현재 planId 설정
  useEffect(() => {
    if (planId) {
      setActivePlanId(planId);
      console.log('🏠 PlaceBlock 스토어에 planId 설정:', planId);
    }
  }, [planId, setActivePlanId]);

  // 접근 권한 확인
  useEffect(() => {
    const checkAccess = async () => {
      if (!userId) {
        setAccessStatus('denied');
        setModalState({ isOpen: true, type: 'error', message: '로그인이 필요합니다.' });
        return;
      }

      try {
        const response = await fetchMyRole(planId, userId);
        console.log('👤 내 역할 응답:', response);
        const status = response?.body?.userStatus;

        if (status === 'APPROVED' || status === 'PARTICIPANT') {
          setAccessStatus('approved');
        } else if (status === 'PENDING') {
          setAccessStatus('pending');
          setModalState({ isOpen: true, type: 'pending', message: '승인 대기중입니다. 방장의 수락을 기다려주세요.' });
        } else {
          // 응답은 성공했지만, 예상치 못한 status 값이거나 status가 없는 경우
          setAccessStatus('denied');
          setModalState({ isOpen: true, type: 'permission', message: '이 플랜에 접근할 권한이 없습니다. 참여를 요청하시겠습니까?' });
        }
      } catch (error) {
        console.error('접근 권한 확인 중 오류 발생:', error.response);
        // 사용자가 방에 속하지 않은 특정 에러(403, PLAN-013) 처리
        if (error.response?.status === 403 && error.response?.data?.body?.code === 'PLAN-013') {
          setAccessStatus('denied');
          setModalState({ isOpen: true, type: 'permission', message: '이 플랜에 접근할 권한이 없습니다. 참여를 요청하시겠습니까?' });
        } else {
          // 그 외 다른 에러 처리
          setAccessStatus('denied');
          setModalState({ isOpen: true, type: 'error', message: '접근 권한을 확인하는 중 오류가 발생했습니다.' });
        }
      }
    };
    checkAccess();
  }, [planId, userId, fetchMyRole]);

  // 스토어의 에러 상태 감지
  useEffect(() => {
    if (participantError) {
      console.error('참여자 정보 로딩 에러:', participantError);
      setAccessStatus('denied');
      setModalState({ isOpen: true, type: 'error', message: participantError.message || '오류가 발생했습니다.' });
    }
  }, [participantError]);

  // 참여자 정보 기반으로 접근 상태 결정
  useEffect(() => {
    // 에러가 있으면 이미 처리됨
    if (participantError) return;
    
    // 로딩 중이면 대기
    if (isParticipantLoading) {
      setAccessStatus('loading');
      return;
    }

    const isCreator = false;
    const isApprovedParticipant = false;
    const isPendingParticipant = false;

    if (isCreator || isApprovedParticipant) {
      setAccessStatus('approved');
      setModalState({ isOpen: false, type: '', message: '' });
    } else if (isPendingParticipant) {
      setAccessStatus('pending');
      setModalState({ isOpen: true, type: 'pending', message: '승인 대기중입니다. 방장의 수락을 기다려주세요.' });
    } else {
      setAccessStatus('denied');
      setModalState({ isOpen: true, type: 'permission', message: '이 플랜에 참여하려면 방장의 수락이 필요합니다.' });
    }
  }, [isParticipantLoading, participantError]);

  // 지도 중심 위치 설정
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
  const handleRequestPermission = async () => {
    console.log('🚀 참여 요청 시작:', { planId, userId, typeof_planId: typeof planId }); // 디버깅용 로그
    try {
      console.log('📞 joinPlan API 호출 전...'); // 디버깅용 로그
      await joinPlan(planId);
      console.log('✅ joinPlan API 호출 성공!'); // 디버깅용 로그
      setAccessStatus('pending');
      setModalState({ isOpen: true, type: 'pending', message: '참여 요청을 보냈습니다. 수락을 기다려주세요.' });
    } catch (error) {
      console.error('❌ 참여 요청 실패:', error);
      const errorCode = error.response?.data?.body?.code;
      const errorMessage = error.response?.data?.body?.message;
      
      console.error('❌ 에러 상세 정보:', {
        message: error.message,
        status: error.response?.status,
        errorCode,
        errorMessage
      });
      
      // PLAN-011: 이미 참여 중인 경우
      if (errorCode === 'PLAN-011') {
        setAccessStatus('pending');
        setModalState({ isOpen: true, type: 'pending', message: '이미 참여 요청을 보냈습니다. 방장의 승인을 기다려주세요.' });
      } else {
        setModalState({ ...modalState, message: errorMessage || '참여 요청에 실패했습니다. 다시 시도해주세요.' });
      }
    }
  };

  const handleCloseModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  // PlaceBlock 삭제
  const handleRemove = (id) => {
    removePlaceBlock(id, planId);
    // WebSocket으로 PlaceBlock 삭제 알림
    const deletePayload = { whiteBoardObjectId: id };
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
        updatePlaceBlockPosition(draggedBlock.id, { x: newX, y: newY }, planId);
        
        // WebSocket으로 PlaceBlock 이동 알림
        const movePayload = {
          whiteBoardObjectId: draggedBlock.id,
          objectInfo: { x: newX, y: newY }
        };
        console.groupCollapsed('[PlaceBlock][SEND] MOVE');
        console.log('planId:', planId, 'payload:', movePayload);
        console.groupEnd();
        sendPlaceBlockMessage('MOVE', movePayload);
        // 레거시 호환 전송 (선택):
        // sendPlaceBlockMessage('PLACEBLOCK_MOVED', { id: draggedBlock.id, position: { x: newX, y: newY } });
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedBlock) {
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
  }, [draggedBlock, isDailyPlanModalOpen, updatePlaceBlockPosition]);

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
        fetchDetailsAndAddBlock(placeId, position, planId, sendPlaceBlockMessage);
      }
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  // 일정 추가 모달 상태 변경 핸들러
  const handleDailyPlanModalToggle = (isOpen) => {
    setIsDailyPlanModalOpen(isOpen);
  };

  // 접근 제어 조건부 렌더링
  if (accessStatus === 'loading') {
    return <div>Loading...</div>;
  }

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
        cursor: draggedBlock ? 'grabbing' : 'default'
      }}
    >
        <SideBar 
          onDailyPlanModalToggle={handleDailyPlanModalToggle} 
          planId={planId}
        />
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
    </div>
  );
};

export default PlanPage; 