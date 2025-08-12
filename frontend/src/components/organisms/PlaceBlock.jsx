import React, { useState } from 'react';
import StarRating from '../atoms/StarRating';
import { useMapCoreStore, usePlaceDetailsStore } from '../../store/mapStore';
import './PlaceBlock.css';

const PlaceBlock = ({ place, onRemove, onEdit, onMouseDown: parentOnMouseDown, isDailyPlanModalOpen = false }) => {
  const panToPlace = useMapCoreStore((state) => state.panToPlace);
  const openPlaceDetailByPlaceId = usePlaceDetailsStore((state) => state.openPlaceDetailByPlaceId);
  const openPlaceDetailFromCandidate = usePlaceDetailsStore((state) => state.openPlaceDetailFromCandidate);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  if (!place) return null;



  // DailyPlanCreate로 드래그
  const handleDragStart = (e) => {
    if (!isDailyPlanModalOpen) {
      e.preventDefault();
      return;
    }
    
    // 페이지 PlaceBlock 데이터 전송
    const dragData = {
      type: 'page-place',
      place: place
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    
    console.log('📝 페이지 PlaceBlock 드래그 시작:', {
      placeName: place.placeName,
      type: 'page-place'
    });
  };

  // 화이트보드 내 이동 및 클릭/드래그 구분 로직
  const handleMouseDown = (e) => {
    console.debug('[PlaceBlock] mouseDown', { x: e.clientX, y: e.clientY, placeId: place?.placeId, name: place?.placeName });
    setIsDragging(false);
    setStartPos({ x: e.clientX, y: e.clientY });
    if (parentOnMouseDown) {
      parentOnMouseDown(e, place);
    }
  };

  const handleMouseMove = (e) => {
    // 마우스가 눌린 상태에서 움직이면 드래그로 간주
    if (e.buttons === 1) { // e.buttons === 1은 마우스 왼쪽 버튼이 눌린 상태를 의미
      const dx = Math.abs(e.clientX - startPos.x);
      const dy = Math.abs(e.clientY - startPos.y);
      if (dx > 5 || dy > 5) { // 5px 이상 움직이면 드래그로 확정
        setIsDragging(true);
        console.debug('[PlaceBlock] dragging detected', { dx, dy });
      }
    }
  };

  const handleMouseUp = async (e) => {
    if (!isDragging) {
      // 드래그가 아니면 클릭으로 처리: 지도 이동 + 상세 모달 오픈
      console.debug('[PlaceBlock] click detected, opening detail modal', { placeId: place?.placeId, name: place?.placeName });
      panToPlace(place);
      try {
        if (place.placeId) {
          console.debug('[PlaceBlock] openPlaceDetailByPlaceId call');
          await openPlaceDetailByPlaceId(place.placeId, true, 'center');
        } else {
          console.debug('[PlaceBlock] openPlaceDetailFromCandidate call');
          await openPlaceDetailFromCandidate(place, true, 'center');
        }
      } catch (err) {
        console.error('[PlaceBlock] open detail failed:', err);
      }
    }
    // 드래그 상태 초기화
    setIsDragging(false);
  };

  return (
    <div 
      className="place-block"
      draggable={isDailyPlanModalOpen}
      onDragStart={handleDragStart}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 왼쪽: 작은 이미지 */}
      <div className="place-block-image">
        <img
          src={place.googleImg && place.googleImg.length > 0 ? place.googleImg[0] : '/images/placeImage_default.png'}
          alt={place.placeName}
          className="place-block-thumbnail"
          onError={(e) => {
            e.target.src = '/images/placeImage_default.png';
          }}
        />
      </div>
      
      {/* 오른쪽: 정보 */}
      <div className="place-block-content">
        {/* 첫 번째 줄: 제목과 별점 */}
        <div className="place-block-header">
          <h3 className="place-block-title">{place.placeName}</h3>
          <div className="place-block-rating">
            <StarRating rating={place.rating} reviewCount='' />
          </div>
        </div>
        
        {/* 두 번째 줄: 주소 */}
        <p className="place-block-address">{place.address}</p>
      </div>
      
      {/* 편집/삭제 버튼 */}
      <div className="place-block-actions">
        {onRemove && (
          <button 
            className="place-block-remove"
            onMouseDown={(e) => {
              // 부모 onMouseDown 로직, 드래그 시작 방지
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseUp={(e) => {
              // 부모 onMouseUp 로직(상세 열기) 차단
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              // 부모 onClick 로직 차단
              e.stopPropagation();
              e.preventDefault();
              onRemove(place.id);
            }}
            title="삭제"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaceBlock;