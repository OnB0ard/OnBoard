import React from 'react';
import StarRating from '../atoms/StarRating';
import './PlaceBlock.css';

const PlaceBlock = ({ place, onRemove, onEdit, onMouseDown, isDailyPlanModalOpen = false }) => {
  if (!place) return null;

  // HTML5 드래그 시작 (DailyPlanCreate로 드래그할 때)
  const handleDragStart = (e) => {
    // 일정 추가 모달이 열려있을 때만 드래그 가능
    if (!isDailyPlanModalOpen) {
      e.preventDefault();
      return;
    }
    
    console.log('PlaceBlock HTML5 드래그 시작:', place.name);
    e.dataTransfer.setData('text/plain', JSON.stringify(place));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 마우스 드래그 시작 (화이트보드 내에서 이동)
  const handleMouseDown = (e) => {
    // 일정 추가 모달이 열려있으면 마우스 드래그 비활성화
    if (isDailyPlanModalOpen) {
      return;
    }
    
    console.log('PlaceBlock 마우스 드래그 시작:', place.name);
    if (onMouseDown) {
      onMouseDown(e, place);
    }
  };

  return (
    <div 
      className="place-block"
      draggable={isDailyPlanModalOpen} // 모달이 열려있을 때만 드래그 가능
      onDragStart={handleDragStart}
      onMouseDown={handleMouseDown}
    >
      {/* 왼쪽: 작은 이미지 */}
      <div className="place-block-image">
        <img
          src={place.imageUrl || 'https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp'}
          alt={place.name}
          className="place-block-thumbnail"
          onError={(e) => {
            e.target.src = 'https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp';
          }}
        />
      </div>
      
      {/* 오른쪽: 정보 */}
      <div className="place-block-content">
        {/* 첫 번째 줄: 제목과 별점 */}
        <div className="place-block-header">
          <h3 className="place-block-title">{place.name}</h3>
          <div className="place-block-rating">
            <StarRating rating={place.rating} reviewCount={null} />
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