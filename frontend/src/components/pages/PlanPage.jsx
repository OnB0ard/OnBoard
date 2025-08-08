import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    placeBlocks,
    addPlaceBlock,
    removePlaceBlock,
    updatePlaceBlockPosition,
    fetchDetailsAndAddBlock,
    hidePlaceBlockMarkers,
  } = usePlaceBlocksStore();
  
  const {
    dayMarkers,
    showDayMarkers,
    clearDayMarkers,
  } = useDayMarkersStore();
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
    removePlaceBlock(id);
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
        updatePlaceBlockPosition(draggedBlock.id, { x: newX, y: newY });
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
        fetchDetailsAndAddBlock(placeId, position);
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
                  color={marker.color} // 마커 색상 전달
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