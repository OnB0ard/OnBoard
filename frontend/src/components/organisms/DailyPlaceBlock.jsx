import React, { useState, useRef } from 'react';
import StarRating from '../atoms/StarRating';
import './DailyPlaceBlock.css';

const DailyPlaceBlock = ({
  place,
  dayIndex,
  placeIndex,
  onRemove,
  onUpdateMemo,
  onOpenMemoModal,
  isDragging,
  dragOverIndex,
  isSwapTarget,
  dayTitle = '',
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  const [memo, setMemo] = useState(place.memo || '');
  const dropdownRef = useRef(null);

  const isBeingDragged = isDragging;
  const isDragOverTarget = dragOverIndex === placeIndex;

  const blockClassName = `daily-place-block ${
    isBeingDragged ? 'dragging' : ''
  } ${
    isDragOverTarget ? 'drag-over-place' : ''
  } ${
    isSwapTarget ? 'swap-target' : ''
  }`;

  // 메모가 업데이트될 때마다 로컬 상태도 업데이트
  React.useEffect(() => {
    setMemo(place.memo || '');
  }, [place.memo]);

  const handleMemoClick = () => {
    if (dropdownRef.current && onOpenMemoModal) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const modalWidth = 350;
      const modalHeight = 350; // 높이를 더 크게 설정
      
      // 화면 크기 확인
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // DailyPlanCreate 모달의 위치를 고려한 계산
      // DailyPlanCreate는 left: 70px, width: 330px 정도
      const dailyPlanLeft = 70;
      const dailyPlanWidth = 330;
      const dailyPlanRight = dailyPlanLeft + dailyPlanWidth;
      
      // 메모 모달을 일정짜기 모달 오른쪽에 배치
      let x = dailyPlanRight + 10; // 일정짜기 모달 오른쪽에서 10px 떨어진 위치 (20px에서 10px로 줄임)
      let y = rect.top; // 드롭다운 버튼과 같은 높이
      
      // 화면 오른쪽 끝을 벗어나는지 확인
      if (x + modalWidth > screenWidth - 20) {
        // 화면 오른쪽 끝을 벗어나면 일정짜기 모달 왼쪽에 배치
        x = dailyPlanLeft - modalWidth - 20;
      }
      
      // 아래로 나가는지 확인 (더 큰 여백 적용)
      if (y + modalHeight > screenHeight - 50) {
        // 화면 아래쪽으로 나가면 위쪽으로 조정 (50px 여백)
        y = Math.max(50, screenHeight - modalHeight - 50);
      }
      
      // 위로 나가는지 확인
      if (y < 50) {
        y = 50;
      }
      
      // 최종적으로 화면 안에 있는지 한 번 더 확인
      if (y + modalHeight > screenHeight - 30) {
        y = screenHeight - modalHeight - 30;
      }
      
      onOpenMemoModal(place, dayTitle, { x, y });
    }
  };

  // 드롭다운 제거: 우측에는 삭제(X) 버튼만 표시

  return (
    <div 
      className={blockClassName}
      draggable="true"
      onDragStart={(e) => onDragStart(e, place, dayIndex, placeIndex)}
      onDragOver={(e) => onDragOver(e, dayIndex, placeIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, dayIndex, placeIndex)}
      onDragEnd={onDragEnd}
    >
      {/* 왼쪽: 작은 이미지 */}
      <div className="daily-place-block-image">
        <img
          src={place.imageUrl || (place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 }) : 'https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp')}
          alt={place.name || place.displayName}
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
          <h3 className="daily-place-block-title" title={place.name || place.displayName}>{place.name || place.displayName}</h3>
          <div className="daily-place-block-rating">
            <StarRating rating={place.rating} reviewCount={place.ratingCount} />
          </div>
        </div>
        
        {/* 두 번째 줄: 주소 */}
        <p className="daily-place-block-address" title={place.formatted_address || place.address}>{place.formatted_address || place.address}</p>
        
        {/* 메모 표시 (항상 표시, 클릭 시 메모 모달 오픈) */}
        <div className="daily-place-block-memo-indicator" onClick={handleMemoClick} role="button">
          {/* 메모가 있으면 메모 내용, 없으면 플레이스홀더 */}
          {memo ? (
            <div className="daily-place-block-memo">
              <p className="memo-text" title={memo}>{memo}</p>
            </div>
          ) : (
            <div className="daily-place-block-memo">
              <p className="memo-placeholder" title="메모 추가">메모</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 오른쪽: 삭제(X) 버튼 */}
      <div className="daily-place-block-actions" ref={dropdownRef}>
        <button
          type="button"
          className="daily-place-block-remove"
          aria-label="삭제"
          onClick={() => onRemove && onRemove(place.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default DailyPlaceBlock;