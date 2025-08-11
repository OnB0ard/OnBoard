import React, { useRef, useMemo, useEffect } from 'react';
import { usePlaceDetailsStore, useBookmarkStore } from '../../store/mapStore';
import useDailyPlanStore from '@/store/useDailyPlanStore';
import StarRating from '../atoms/StarRating';
import './PlaceDetailModal.css'; // 이전 CSS 파일을 그대로 사용합니다.

const PlaceDetailModal = () => {
  // 1. 새로운 방식의 상태 관리는 그대로 유지 (Zustand 스토어 직접 사용)
  const isPlaceDetailModalOpen = usePlaceDetailsStore((state) => state.isPlaceDetailModalOpen);
  const place = usePlaceDetailsStore((state) => state.selectedPlace);
  const placeDetailPosition = usePlaceDetailsStore((state) => state.placeDetailPosition);
  const closePlaceDetailModal = usePlaceDetailsStore((state) => state.closePlaceDetailModal);
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const removeBookmark = useBookmarkStore((state) => state.removeBookmark);
  const loadBookmarks = useBookmarkStore((state) => state.loadBookmarks);
  const isBookmarked = useBookmarkStore((state) => state.isBookmarked);
  // 서버에서 받아온 북마크 목록에 구독하여, 목록이 갱신되면 모달이 다시 렌더링되도록 함
  const bookmarkedPlaces = useBookmarkStore((state) => state.bookmarkedPlaces);
  const planId = useDailyPlanStore((state) => state.planId || state.currentPlanId);
  
  const modalRef = useRef(null);



  // 2. 북마크 여부는 항상 서버 조회 결과(스토어 동기화)로 판정
  // bookmarkedPlaces에 구독되어 있으므로, 값이 변하면 컴포넌트가 리렌더링되어 아래 계산이 갱신됩니다.
  const isPlaceBookmarked = isBookmarked(place);

  // 모달이 열리거나 선택 장소가 바뀔 때 서버 북마크 동기화
  // loadBookmarks는 내부에서 안전하게 planId를 해석합니다.
  useEffect(() => {
    if (!isPlaceDetailModalOpen || !place) return;
    if (loadBookmarks) {
      console.debug('[PlaceDetailModal] syncing bookmarks from server. planId=', planId, 'place=', {
        name: place?.placeName || place?.name,
        googlePlaceId: place?.googlePlaceId || place?.place_id,
        address: place?.address || place?.formatted_address,
        lat: place?.latitude,
        lng: place?.longitude,
      });
      loadBookmarks(planId);
    }
  }, [isPlaceDetailModalOpen, planId, place, loadBookmarks]);

  // 북마크 목록이 갱신될 때 진단 로그
  useEffect(() => {
    if (!isPlaceDetailModalOpen || !place) return;
    console.debug('[PlaceDetailModal] bookmarkedPlaces updated len=', bookmarkedPlaces?.length,
      'isBookmarked=', isPlaceBookmarked);
  }, [bookmarkedPlaces, isPlaceDetailModalOpen, place, isPlaceBookmarked]);

  // 3. useMemo를 사용한 위치 계산 최적화 유지
  const safePositionStyle = useMemo(() => {
    try {
      const searchModalLeft = 70;
      const searchModalWidth = 330;
      const searchModalRight = searchModalLeft + searchModalWidth;
      const x = searchModalRight + 5;
      const y = placeDetailPosition?.y || 80;
      // 이전 코드처럼 style 객체에 직접 위치를 지정합니다.
      return {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        margin: 0,
      };
    } catch (error) {
      console.error('장소 상세 모달 위치 계산 오류:', error);
      return { position: 'fixed', left: '405px', top: '80px', margin: 0 };
    }
  }, [placeDetailPosition]);

  // 렌더링 조건은 새로운 코드 방식을 따릅니다.
  if (!isPlaceDetailModalOpen || !place) {
    return null;
  }

  // 데이터 구조는 새로운 코드의 명확한 변수명을 사용합니다.
  const {
    placeName, googleImg, rating, ratingCount, primaryCategory,
    address, phoneNumber, siteUrl, googleUrl, reviews,
  } = place;
  
  const handleClose = () => closePlaceDetailModal();

  const handleToggleBookmark = async () => {
    if (!place) return;
    try {
      if (isPlaceBookmarked) {
        // 서버 동기화된 목록에서 일치 항목을 찾아 제거
        const cName = (place.placeName || place.name || '').trim().toLowerCase();
        const cGid = place.googlePlaceId || place.place_id || null;
        const cBid = place.bookmarkId || place.id || place.placeId || null;
        const cLat = typeof place.latitude === 'number' ? place.latitude : null;
        const cLng = typeof place.longitude === 'number' ? place.longitude : null;
        const eps = 1e-4;
        const match = bookmarkedPlaces.find((p) => {
          const pName = (p.placeName || p.name || '').trim().toLowerCase();
          const pGid = p.googlePlaceId || p.place_id || null;
          const pBid = p.bookmarkId || p.id || p.placeId || null;
          const pLat = typeof p.latitude === 'number' ? p.latitude : null;
          const pLng = typeof p.longitude === 'number' ? p.longitude : null;
          if (cBid && pBid && cBid === pBid) return true;
          if (cGid && pGid && cGid === pGid) return true;
          if (cName && pName && cName === pName) return true;
          if (cLat != null && cLng != null && pLat != null && pLng != null) {
            if (Math.abs(cLat - pLat) < eps && Math.abs(cLng - pLng) < eps) return true;
          }
          return false;
        });
        const identifier = match?.bookmarkId ?? match?.googlePlaceId ?? match?.placeId ?? cBid ?? cGid;
        if (identifier != null) {
          await removeBookmark(identifier, planId);
        } else {
          // 식별자가 없으면 토글로 폴백 시도
          await toggleBookmark(place, planId);
        }
      } else {
        // 저장되지 않은 상태면 추가
        await toggleBookmark(place, planId);
      }
    } finally {
      // 액션 후 서버 상태 재조회로 모달 상태를 즉시 동기화
      loadBookmarks?.(planId);
    }
  };

  return (
    // 4. JSX 구조와 CSS 클래스 이름은 모두 이전 디자인으로 복원
    <div className="place-detail-modal">
      <div
        className="place-detail-modal-content"
        ref={modalRef}
        style={safePositionStyle}
      >
        <div className="place-detail-modal-header">
          <h4 className="place-detail-name">{placeName}</h4>
          <button onClick={handleClose} className="place-detail-close-button">✕</button>
        </div>

        <div className="place-detail-modal-body">
          {/* 이미지 캐러셀 */}
          <div className="image-carousel">
            {googleImg && googleImg.length > 0 ? (
              <div className="carousel-container">
                <img
                  src={googleImg[0]}
                  alt={placeName}
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
            <div className="rating-section">
              <StarRating rating={rating} reviewCount={ratingCount} />
            </div>

            {primaryCategory && (
              <div className="category-section">
                <span className="category-text">{primaryCategory}</span>
              </div>
            )}

            <button
              className={`place-detail-save-button ${isPlaceBookmarked ? 'saved' : ''}`}
              onClick={handleToggleBookmark}
            >
              <span className="star-icon">★</span>
              {isPlaceBookmarked ? '저장됨' : '저장'}
            </button>

            <div className="address-section">
              <div className="address">
                <span className="address-text">{address || '주소 정보 없음'}</span>
              </div>
            </div>

            <div className="phone-section">
              <span className="phone-number">{phoneNumber || '전화번호 정보 없음'}</span>
            </div>

            <div className="link-buttons">
              {googleUrl && (
                 <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="link-button">
                   구글맵으로 이동
                 </a>
              )}
              {siteUrl && (
                <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="link-button">
                  홈페이지 이동
                </a>
              )}
            </div>
          </div>

          {/* 리뷰 섹션 (동적 데이터 매핑 적용) */}
          <div className="reviews-section">
            <h5>방문자 리뷰 {ratingCount || '0'}</h5>
            {reviews && reviews.length > 0 ? (
              reviews.slice(0, 5).map((review, index) => (
                <div key={index} className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.author_name}</span>
                    <span className="review-date">{review.relative_time_description}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="review-text">{review.text}</p>
                  {/* 리뷰 이미지는 데이터에 따라 추가 가능 */}
                </div>
              ))
            ) : (
              <p>리뷰가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailModal;