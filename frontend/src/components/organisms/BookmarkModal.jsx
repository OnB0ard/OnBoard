import React, { useRef, useEffect } from 'react';
import PlaceBlock from './PlaceBlock';
import './BookmarkModal.css';

const BookmarkModal = ({ isOpen, onClose, bookmarkedPlaces = [], onPlaceSelect, position = { x: 0, y: 0 } }) => {
  const modalRef = useRef(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      // DailyPlanCreate 모달 내부 클릭은 무시
      if (event.target.closest('.daily-plan-modal')) {
        return;
      }
      
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handlePlaceClick = (place) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  // 안전한 위치 계산
  const getSafePosition = () => {
    try {
      // 일정짜기 모달의 위치와 크기를 기준으로 북마크 모달 위치 계산
      // 일정짜기 모달은 left: 70px, width: 330px, top: 90px
      const dailyPlanLeft = 70;
      const dailyPlanWidth = 330;
      const dailyPlanRight = dailyPlanLeft + dailyPlanWidth;
      const dailyPlanTop = 90; // 일정짜기 모달과 같은 top 위치
      
      // 북마크 모달을 일정짜기 모달 오른쪽에 배치
      const x = dailyPlanRight + 20; // 일정짜기 모달 오른쪽에서 20px 떨어진 위치
      const y = dailyPlanTop; // 일정짜기 모달과 같은 top 위치
      
      console.log('북마크 모달 고정 위치:', { x, y });
      return { x, y };
    } catch (error) {
      console.error('북마크 모달 위치 계산 오류:', error);
      return { x: 420, y: 90 };
    }
  };

  // 북마크 모달만 닫는 함수
  const handleCloseBookmarkModal = (e) => {
    if (e) {
    e.preventDefault();
    e.stopPropagation();
    }
    console.log('북마크 모달 닫기 버튼 클릭됨');
    
    // 강제로 모달 닫기
    if (onClose) {
      console.log('onClose 함수 호출');
      // setTimeout을 사용하여 이벤트 루프에서 분리
      setTimeout(() => {
      onClose();
      }, 0);
    } else {
      console.log('onClose 함수가 없음');
    }
  };

  if (!isOpen) return null;

  const safePosition = getSafePosition();

  return (
    <div className="bookmark-modal">
      <div 
        className="bookmark-modal-content" 
        ref={modalRef}
        style={{
          position: 'fixed',
          left: `${safePosition.x}px`,
          top: `${safePosition.y}px`,
          margin: 0
        }}
      >
        <div className="bookmark-modal-header">
          <h3>북마크된 장소</h3>
          <button 
            onClick={handleCloseBookmarkModal} 
            className="close-button"
            type="button"
            style={{ zIndex: 9999 }}
          >
            ✕
          </button>
        </div>
        
        <div className="bookmark-modal-body">
          {bookmarkedPlaces.length === 0 ? (
            <div className="empty-state">
              <p>북마크된 장소가 없습니다.</p>
            </div>
          ) : (
            <div className="bookmark-list">
              {bookmarkedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bookmark-item"
                  onClick={() => handlePlaceClick(place)}
                >
                  <PlaceBlock
                    place={place}
                    onRemove={() => {}} // 북마크 모달에서는 삭제 기능 없음
                    onEdit={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkModal;