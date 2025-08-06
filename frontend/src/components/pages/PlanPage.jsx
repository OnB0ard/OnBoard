import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { APIProvider, useMapsLibrary, Map, useMap } from '@vis.gl/react-google-maps';
import CustomMarker from '../atoms/CustomMarker';
import SideBar from '../organisms/SideBar';
import WhiteBoard from '../organisms/WhiteBoard';
import MapContainer from '../organisms/Map';
import PlaceBlock from '../organisms/PlaceBlock';
import AccessControlModal from '../organisms/AccessControlModal';

import useMapStore from '../../store/useMapStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useParticipantStore } from '../../store/usePlanUserStore';


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
  const { userId } = useAuthStore(); // PlanAccessRoute가 로그인 여부를 보장하므로 userId를 가져옵니다.
  const { participants, creator, fetchParticipants, joinPlan, error, isLoading } = useParticipantStore();

  const [accessStatus, setAccessStatus] = useState('loading');
  const [modalState, setModalState] = useState({ isOpen: false, type: 'permission', message: '' });

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
    lastMapPosition,
  } = useMapStore();
  const [isSideBarVisible, setIsSideBarVisible] = useState(true);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);

  // Refs
  const mapRef = useRef(null);
  const whiteBoardRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // =================== Effects ===================
  // 접근 권한 확인
  useEffect(() => {
    const checkAccess = async () => {
      try {
        await fetchParticipants(planId);
        
        // fetchParticipants 완료 후 스토어에서 최신 데이터 가져오기
        const { creator, participants } = useParticipantStore.getState();
        
        // 현재 사용자가 생성자인지 확인
        const isCreator = creator && creator.userId === userId;
        
        // 현재 사용자가 승인된 참여자인지 확인
        const isApprovedParticipant = participants.some(
          participant => participant.userId === userId && participant.userStatus === 'APPROVED'
        );
        
        if (isCreator || isApprovedParticipant) {
          setAccessStatus('approved');
          setModalState({ isOpen: false, type: 'permission', message: '' });
        } else {
          // 참여자 목록에 있지만 승인되지 않은 경우
          const isPendingParticipant = participants.some(
            participant => participant.userId === userId && participant.userStatus === 'PENDING'
          );
          
          if (isPendingParticipant) {
            setAccessStatus('pending');
            setModalState({ isOpen: true, type: 'pending', message: '참여 요청이 승인 대기 중입니다.' });
          } else {
            setAccessStatus('denied');
            setModalState({ isOpen: true, type: 'permission', message: '이 여행 계획에 참여할 권한이 없습니다.' });
          }
        }
      } catch (error) {
        console.error('참여 정보를 가져오는 데 실패했습니다:', error);
        setAccessStatus('denied');
        setModalState({ isOpen: true, type: 'permission', message: '플랜 정보를 가져오는 데 실패했습니다.' });
      }
    };
    checkAccess();
  }, [planId, fetchParticipants]);

  // 스토어의 에러 상태 감지
  useEffect(() => {
    if (error) {
      console.error('참여자 정보 로딩 에러:', error);
      setAccessStatus('denied');
      setModalState({ 
        isOpen: true, 
        type: 'permission', 
        message: '플랜 정보를 가져오는 데 실패했습니다. 참여 권한이 없을 수 있습니다.' 
      });
    }
  }, [error]);

  // 참여자 정보 기반으로 접근 상태 결정
  useEffect(() => {
    // 에러가 있으면 이미 처리됨
    if (error) return;
    
    // 로딩 중이면 대기
    if (isLoading || (!creator && participants.length === 0)) {
      setAccessStatus('loading');
      return;
    }

    const isCreator = creator?.userId === userId;
    const currentUser = participants.find(p => p.userId === userId);
    const isApprovedParticipant = currentUser?.status === 'APPROVED';
    const isPendingParticipant = currentUser?.status === 'PENDING';

    if (isCreator || isApprovedParticipant) {
      setAccessStatus('approved');
      setModalState({ isOpen: false, type: '', message: '' });
    } else if (isPendingParticipant) {
      setAccessStatus('pending');
      setModalState({ isOpen: true, type: 'permission', message: '승인 대기중입니다. 방장의 수락을 기다려주세요.' });
    } else {
      setAccessStatus('denied');
      setModalState({ isOpen: true, type: 'permission', message: '이 플랜에 참여하려면 방장의 수락이 필요합니다.' });
    }
  }, [creator, participants, userId, error, isLoading]);

  // 지도 중심 위치 설정
  useEffect(() => {
    if (lastMapPosition) {
      setMapCenter(lastMapPosition);
    }
  }, [lastMapPosition]);

  // =================== Handlers ===================
  const handleRequestPermission = async () => {
    console.log('🚀 참여 요청 시작:', { planId, userId }); // 디버깅용 로그
    try {
      console.log('📞 joinPlan API 호출 전...'); // 디버깅용 로그
      await joinPlan(planId);
      console.log('✅ joinPlan API 호출 성공!'); // 디버깅용 로그
      setAccessStatus('pending');
      setModalState({ isOpen: true, type: 'permission', message: '참여 요청을 보냈습니다. 수락을 기다려주세요.' });
    } catch (error) {
      console.error('❌ 참여 요청 실패:', error);
      console.error('❌ 에러 상세 정보:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setModalState({ ...modalState, message: '참여 요청에 실패했습니다. 다시 시도해주세요.' });
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
               zIndex: draggedBlock?.id === block.id ? 2000 : 2000,
               cursor: 'grab'
             }}
             onMouseDown={(e) => handleMouseDown(e, block)}
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