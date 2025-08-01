import React, { useState } from 'react';
import StarRating from '../atoms/StarRating';
import useMapStore from '../../store/useMapStore';
import './PlaceBlock.css';

const PlaceBlock = ({ place, onRemove, onEdit, onMouseDown: parentOnMouseDown, isDailyPlanModalOpen = false }) => {
  const { handlePlaceSelection } = useMapStore();
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  if (!place) return null;

  // DailyPlanCreate로 드래그
  const handleDragStart = (e) => {
    if (!isDailyPlanModalOpen) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(place));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 화이트보드 내 이동 및 클릭/드래그 구분 로직
  const handleMouseDown = (e) => {
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
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) {
      // 드래그가 아니면 클릭으로 처리
      if (place && place.place_id) {
        handlePlaceSelection(place.place_id);
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
          src={place.googleImg && place.googleImg.length > 0 ? place.googleImg[0] : 'https://item.kakaocdn.net/do/f54d975d70c2916c5705a0919f193a547154249a3890514a43687a85e6b6cc82'}
          alt={place.placeName}
          className="place-block-thumbnail"
          onError={(e) => {
            e.target.src = 'https://item.kakaocdn.net/do/f54d975d70c2916c5705a0919f193a547154249a3890514a43687a85e6b6cc82';
          }}
        />
      </div>
      
      {/* 오른쪽: 정보 */}
      <div className="place-block-content">
        {/* 첫 번째 줄: 제목과 별점 */}
        <div className="place-block-header">
          <h3 className="place-block-title">{place.placeName}</h3>
          <div className="place-block-rating">
            <StarRating rating={place.rating} reviewCount={place.ratingCount} />
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
            onClick={(e) => {
              e.stopPropagation();
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