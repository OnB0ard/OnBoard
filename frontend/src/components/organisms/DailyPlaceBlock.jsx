import React, { useState } from 'react';
import StarRating from '../atoms/StarRating';
import PlanMemoModal from './PlanMemoModal';
import './DailyPlaceBlock.css';

const DailyPlaceBlock = ({ place, onRemove, onEdit, onMemoUpdate }) => {
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memo, setMemo] = useState(place.memo || '');

  const handleMemoSave = (newMemo) => {
    setMemo(newMemo);
    if (onMemoUpdate) {
      onMemoUpdate(place.id, newMemo);
    }
    setShowMemoModal(false);
  };

  return (
    <>
      <div className="daily-place-block">
        {/* 왼쪽: 작은 이미지 */}
        <div className="daily-place-block-image">
          <img
            src={place.imageUrl || 'https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp'}
            alt={place.name}
            className="daily-place-block-thumbnail"
            onError={(e) => {
              e.target.src = 'https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp';
            }}
          />
        </div>
        
        {/* 중앙: 정보 */}
        <div className="daily-place-block-content">
          {/* 첫 번째 줄: 제목과 별점 */}
          <div className="daily-place-block-header">
            <h3 className="daily-place-block-title">{place.name}</h3>
            <div className="daily-place-block-rating">
              <StarRating rating={place.rating} reviewCount={null} />
            </div>
          </div>
          
          {/* 두 번째 줄: 주소 */}
          <p className="daily-place-block-address">{place.address}</p>
          
          {/* 메모 표시 (있는 경우) */}
          {memo && (
            <div className="daily-place-block-memo">
              <p className="memo-text">{memo}</p>
            </div>
          )}
        </div>
        
        {/* 오른쪽: 액션 버튼들 */}
        <div className="daily-place-block-actions">
          {/* 메모 버튼 */}
          <button 
            className="memo-button"
            onClick={() => setShowMemoModal(true)}
            title="메모 추가/편집"
          >
            📝
          </button>
          
          {/* 삭제 버튼 */}
          {onRemove && (
            <button 
              className="daily-place-block-remove"
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

      {/* 메모 모달 */}
      {showMemoModal && (
        <PlanMemoModal
          isOpen={showMemoModal}
          onClose={() => setShowMemoModal(false)}
          memo={memo}
          onSave={handleMemoSave}
          placeName={place.name}
        />
      )}
    </>
  );
};

export default DailyPlaceBlock;