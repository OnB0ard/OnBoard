import React, { useRef, useEffect } from 'react';
import useBookmarkStore from '../../store/mapStore/useBookmarkStore';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import { useStompBookmark } from '../../hooks/useStompBookmark';
import './BookmarkModal.css';

const BookmarkModal = ({ isOpen, onClose, onPlaceSelect, position = { x: 0, y: 0 }, planId }) => {
  const modalRef = useRef(null);
  const { bookmarkedPlaces, toggleBookmark, clearAllBookmarks, setActivePlanId } = useBookmarkStore();
  // 현재 방(planId)에 맞춰 스토어 활성 플랜 설정
  useEffect(() => {
    if (planId) setActivePlanId(planId);
  }, [planId, setActivePlanId]);
  const [isDragging, setIsDragging] = React.useState(false);

  // WebSocket 연결 설정 (북마크 실시간 동기화)
  const { sendMessage, connectionStatus, myUuid } = useStompBookmark({
    planId,
    onMessage: (msg) => {
      const { type, payload, uuid } = msg;

      console.log('실시간 북마크 업데이트 수신:', msg);

      // 내가 보낸 메시지는 무시 (로컬에 이미 반영됨)
      if (uuid === myUuid) return;

      switch (type) {
        case 'BOOKMARK_ADDED':
          console.log('북마크 추가 수신:', payload.place);
          toggleBookmark(payload.place, planId);
          break;
        case 'BOOKMARK_REMOVED': {
          console.log('북마크 제거 수신:', payload.placeId);
          // placeId로 북마크를 찾아서 제거
          const placeToRemove = bookmarkedPlaces.find(p => (p.googlePlaceId || p.place_id) === payload.placeId);
          if (placeToRemove) {
            toggleBookmark(placeToRemove, planId);
          }
          break;
        }
        case 'BOOKMARK_UPDATED':
          console.log('북마크 업데이트 수신:', payload.bookmarks);
          // 전체 북마크 목록 업데이트
          clearAllBookmarks(planId);
          payload.bookmarks.forEach(place => toggleBookmark(place, planId));
          break;
        default:
          console.warn('알 수 없는 북마크 메시지 타입:', type);
      }
    }
  });

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

  // 드래그 시작 핸들러
  const handleDragStart = (e, place) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'bookmark-place',
      place: place
    }));
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
    
    // daily-plan-modal에 bookmark-dragging 클래스 추가
    const dailyPlanModal = document.querySelector('.daily-plan-modal');
    if (dailyPlanModal) {
      dailyPlanModal.classList.add('bookmark-dragging');
    }
    
    console.log('북마크에서 장소 드래그 시작:', place.name);
  };

  // 드래그 끝 핸들러
  const handleDragEnd = (e) => {
    setIsDragging(false);
    
    // daily-plan-modal에서 bookmark-dragging 클래스 제거
    const dailyPlanModal = document.querySelector('.daily-plan-modal');
    if (dailyPlanModal) {
      dailyPlanModal.classList.remove('bookmark-dragging');
    }
    
    console.log('북마크 드래그 종료');
  };

  // 안전한 위치 계산
  const getSafePosition = () => {
    try {
      // 일정짜기 모달의 위치와 크기를 기준으로 북마크 모달 위치 계산
      // 일정짜기 모달은 left: 70px, width: 330px, top: 90px
      const dailyPlanLeft = 120;
      const dailyPlanWidth = 330;
      const dailyPlanRight = dailyPlanLeft + dailyPlanWidth;
      const dailyPlanTop = 76; // 일정짜기 모달과 같은 top 위치
      
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
          left: `410px`,
          top: `0`,
          margin: 0
        }}
      >
        <div className="bookmark-modal-header">
          <div className="header-content">
            <h3>북마크된 장소</h3>
          </div>
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
                  key={place.place_id} 
                  className="bookmark-item"
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, place)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handlePlaceClick(place)}
                >
                  {/* 왼쪽: 텍스트 정보 */}
                  <div className="bookmark-item-content">
                    {/* 제목 */}
                    <h3 className="bookmark-item-title">{place.name}</h3>
                    
                    {/* 별점, 리뷰 수 */}
                    <div className="bookmark-item-rating">
                      <StarRating rating={place.rating} />
                    </div>
                    
                    
                    {/* 주소 */}
                    <p className="bookmark-item-address">{place.formatted_address}</p>
                    
                  </div>
                  
                  {/* 오른쪽: 이미지 */}
                  <div className="bookmark-item-image">
                    <PlaceImage 
                      imageUrl={(place.photos && place.photos[0] && (typeof place.photos[0].getUrl === 'function' ? place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 }) : (place.photos[0].url || place.photos[0]))) || place.imageUrl || (place.googleImg && place.googleImg[0]) || 'https://placehold.co/40x40/E5E7EB/6B7280?text=이미지'}
                      isBookmarked={true} // 북마크 페이지에서는 항상 북마크된 상태
                      onBookmarkClick={(e) => {
                        e.stopPropagation();
                        // 북마크 토글 및 WebSocket 알림
                        const isCurrentlyBookmarked = bookmarkedPlaces.some(p => (p.googlePlaceId || p.place_id) === place.place_id);
                        toggleBookmark(place, planId);
                        
                        // WebSocket으로 북마크 변경 알림
                        if (isCurrentlyBookmarked) {
                          sendMessage('BOOKMARK_REMOVED', { placeId: place.place_id });
                        } else {
                          sendMessage('BOOKMARK_ADDED', { place: place });
                        }
                      }}
                    />
                  </div>
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