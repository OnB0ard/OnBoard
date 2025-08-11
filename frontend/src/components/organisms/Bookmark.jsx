// 북마크 모음집 
import React, { useEffect, useMemo, useRef } from 'react';
import { useBookmarkStore } from '../../store/mapStore';
import useDailyPlanStore from '@/store/useDailyPlanStore';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import './Bookmark.css';
import {createPortal} from 'react-dom';

const Bookmark = ({ isOpen, onClose, onPlaceClick, position }) => {
  const popupRef = useRef(null);
  const bookmarkedPlaces = useBookmarkStore((state) => state.bookmarkedPlaces);
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const loadBookmarks = useBookmarkStore((state) => state.loadBookmarks);
  const planId = useDailyPlanStore((state) => state.planId || state.currentPlanId);

  // planId가 스토어에 없을 경우 URL에서 안전하게 추출
  const effectivePlanId = useMemo(() => {
    if (planId) return planId;
    try {
      const { pathname, search, hash } = window.location || {};
      const pathMatch = pathname && pathname.match(/\/(?:plan|plans)(?:\/detail)?\/(\d+)/);
      if (pathMatch && pathMatch[1]) return Number(pathMatch[1]);
      const hashMatch = hash && hash.match(/#\/(?:plan|plans)(?:\/detail)?\/(\d+)/);
      if (hashMatch && hashMatch[1]) return Number(hashMatch[1]);
      const q = new URLSearchParams(search);
      const qid = q.get('planId') || q.get('id') || q.get('pid');
      if (qid) return Number(qid);
    } catch (e) {
      console.warn('[Bookmark] planId URL 파싱 실패:', e);
    }
    return undefined;
  }, [planId]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
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

  // 모달 열릴 때 서버에서 북마크 불러오기 (planId가 없으면 URL fallback 사용)
  useEffect(() => {
    if (!isOpen) return;
    if (!loadBookmarks) return;
    if (effectivePlanId == null) {
      console.warn('[Bookmark] loadBookmarks skipped: planId 없음');
      return;
    }
    console.log('[Bookmark] 모달 오픈 -> REST 북마크 조회 실행. planId:', effectivePlanId);
    loadBookmarks(effectivePlanId);
  }, [isOpen, effectivePlanId, loadBookmarks]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="bookmark-popup" 
      ref={popupRef}
      style={position ? { top: `${position.y}px`, left: `${position.x}px` } : {}}
    >
      <div className="bookmark-popup-container">
        <div className="bookmark-popup-header">
          <h2 className="bookmark-popup-title">저장된 장소</h2>
          <button onClick={onClose} className="bookmark-popup-close">✕</button>
        </div>
        <div className="bookmark-popup-content">
          {bookmarkedPlaces.length === 0 ? (
            <div className="empty-state">
              <p>저장된 장소가 없습니다.</p>
            </div>
          ) : (
            <div className="bookmark-list">
              {bookmarkedPlaces.map((place) => (
                <div 
                  key={place.bookmarkId || place.googlePlaceId || place.placeId}
                  className="bookmark-item"
                  onClick={() => onPlaceClick?.(place)}
                >
                  {/* 왼쪽: 텍스트 정보 */}
                  <div className="bookmark-item-content">
                    {/* 제목 */}
                    <h3 className="bookmark-item-title">{place.placeName || place.name}</h3>
                    
                    {/* 별점, 리뷰 수, */}
                    <div className="bookmark-item-rating">
                      <StarRating rating={place.rating} reviewCount={place.reviewCount} />
                    </div>
                    
                    
                    {/* 주소 */}
                    <p className="bookmark-item-address">{place.address || place.formatted_address}</p>
                  </div>
                  
                  {/* 오른쪽: 이미지 */}
                  <div className="bookmark-item-image">
                    <PlaceImage 
                      imageUrl={
                        place.imageUrl
                          || (place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 }) : undefined)
                          || 'https://placehold.co/40x40/E5E7EB/6B7280?text=이미지'
                      }
                      isBookmarked={true} // 북마크 페이지에서는 항상 북마크된 상태
                      onBookmarkClick={(e) => {
                        e.stopPropagation();
                        if (place.googlePlaceId) {
                          toggleBookmark(place, planId);
                        } else {
                          console.warn('[Bookmark] REST 항목은 googlePlaceId가 없어 즉시 토글 불가:', place);
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
    </div>,
    document.getElementById('modal-root')
  );
};

export default Bookmark;