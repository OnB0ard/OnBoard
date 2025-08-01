import React, { useRef, useEffect } from 'react';
import useMapStore from '../../store/useMapStore';
import StarRating from '../atoms/StarRating';
import './PlaceDetailModal.css';

const PlaceDetailModal = ({ isOpen, onClose, place, position = { x: 0, y: 0 } }) => {
  const modalRef = useRef(null);
  const { toggleBookmark, isBookmarked } = useMapStore();

  // 외부 클릭 감지 - X 버튼으로만 닫히도록 비활성화
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     // 검색 모달이나 다른 관련 요소 클릭 시 모달 닫지 않음
  //     if (event.target.closest('.search-popup') || 
  //         event.target.closest('.search-popup-results') ||
  //         event.target.closest('.place-detail-modal')) {
  //       return;
  //     }
  //     
  //     if (modalRef.current && !modalRef.current.contains(event.target)) {
  //       onClose();
  //     }
  //   };

  //   if (isOpen) {
  //     document.addEventListener('mousedown', handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [isOpen, onClose]);

  // 안전한 위치 계산
  const getSafePosition = () => {
    try {
      // 검색 모달 기준으로 위치 계산
      const searchModalLeft = 70; // 검색 모달의 left 위치
      const searchModalWidth = 330; // 검색 모달의 원래 너비 (max-width)
      const searchModalRight = searchModalLeft + searchModalWidth;
      
      // 장소 상세 모달을 검색 모달 오른쪽에 배치 (간격 줄임)
      const x = searchModalRight + 5; // 검색 모달 오른쪽에서 5px 떨어진 위치 (10px에서 5px로 줄임)
      const y = position.y || 80; // 검색 모달과 같은 top 위치 또는 전달받은 위치
      
      console.log('장소 상세 모달 위치:', { x, y });
      return { x, y };
    } catch (error) {
      console.error('장소 상세 모달 위치 계산 오류:', error);
      return { x: 405, y: 80 }; // x 위치도 5px 줄임
    }
  };

  if (!isOpen || !place) return null;

  const safePosition = getSafePosition();

  return (
    <div className="place-detail-modal">
      <div 
        className="place-detail-modal-content" 
        ref={modalRef}
        style={{
          position: 'fixed',
          left: `${safePosition.x}px`,
          top: `${safePosition.y}px`,
          margin: 0
        }}
      >
        <div className="place-detail-modal-header">
          <h4 className="place-detail-name">{place.name || place.displayName}</h4>
          <button onClick={onClose} className="place-detail-close-button">✕</button>
        </div>
        
        <div className="place-detail-modal-body">
          {/* 이미지 캐러셀 */}
          <div className="image-carousel">
            {place.imageUrl || (place.photos && place.photos[0]) ? (
              <div className="carousel-container">
                <img 
                  src={place.imageUrl || place.photos[0].getUrl({ maxWidth: 400, maxHeight: 200 })} 
                  alt={place.name || place.displayName}
                  className="main-image"
                />
              </div>
            ) : (
              <div className="no-image">
                <span>이미지 없음</span>
              </div>
            )}
          </div>

          {/* 장소 정보 */}
          <div className="place-info">
            {/* <h4 className="place-name">{place.name || place.displayName}</h4> */}
            
            <div className="rating-section">
              <StarRating rating={place.rating} reviewCount={place.user_ratings_total || place.reviewCount} />
            </div>

            {/* 카테고리 */}
            {place.types && (
              <div className="category-section">
                <span className="category-text">
                  {Array.isArray(place.types) ? place.types.join(', ') : place.types}
                </span>
              </div>
            )}

            {/* 저장 버튼 */}
            <button 
              className={`place-detail-save-button ${isBookmarked(place.place_id) ? 'saved' : ''}`}
              onClick={() => toggleBookmark(place)}
            >
              <span className="star-icon">★</span>
              {isBookmarked(place.place_id) ? '저장됨' : '저장'}
            </button>

            {/* 주소 */}
            <div className="address-section">
              <div className="address">
                <span className="address-text">{place.formatted_address || place.address || '주소 정보 없음'}</span>
                {/* <span className="dropdown-arrow">▼</span> */}
              </div>
            </div>

            {/* 전화번호, 나중에 api 명세서 작성하면 변수명 수정 */}
            <div className="phone-section">
              <span className="phone-number">0507-1496-9233</span>
            </div>

            {/* 링크 버튼들 */}
            <div className="link-buttons">
              <button className="link-button">
                구글맵으로 이동
              </button>
              <button className="link-button">
                홈페이지 이동
              </button>
            </div>
          </div>

          {/* 리뷰 섹션 나중에 적절한 변수명으로 변경할거임*/}
          <div className="reviews-section">
            <h5>방문자 리뷰 {place.user_ratings_total || place.reviewCount || '0'}</h5>
            <div className="review-item">
              <div className="review-header">
                <span className="reviewer-name">hyu****</span>
                <span className="review-date">6.24-</span>
              </div>
              <p className="review-text">양꼬치가 정말 맛있어요! 꿔바로우 마파두부 어향가지 요리도 추천합니다.</p>
              <div className="review-tags">
                <span className="review-tag">음식이 맛있어요</span>
                <span className="review-tag-count">+4</span>
              </div>
              <img 
                src="https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp"
                alt="리뷰 이미지"
                className="review-image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailModal;