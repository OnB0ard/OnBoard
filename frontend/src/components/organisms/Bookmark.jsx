// 북마크 모음집 
import React, { useEffect, useRef } from 'react';
import useMapStore from '../../store/useMapStore';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import './Bookmark.css';
import {createPortal} from 'react-dom';

const Bookmark = ({ isOpen, onClose, onPlaceClick, position }) => {
  const popupRef = useRef(null);
  const bookmarkedPlaces = useMapStore((state) => state.bookmarkedPlaces);
  const toggleBookmark = useMapStore((state) => state.toggleBookmark);

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
                  key={place.id} 
                  className="bookmark-item"
                  onClick={() => onPlaceClick?.(place)}
                >
                  {/* 왼쪽: 텍스트 정보 */}
                  <div className="bookmark-item-content">
                    {/* 제목 */}
                    <h3 className="bookmark-item-title">{place.name}</h3>
                    
                    {/* 별점, 리뷰 수, */}
                    <div className="bookmark-item-rating">
                      <StarRating rating={place.rating} reviewCount={place.reviewCount} />
                    </div>
                    
                    
                    {/* 주소 */}
                    <p className="bookmark-item-address">{place.formatted_address}</p>
                  </div>
                  
                  {/* 오른쪽: 이미지 */}
                  <div className="bookmark-item-image">
                    <PlaceImage 
                      imageUrl={place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 }) : 'https://placehold.co/40x40/E5E7EB/6B7280?text=이미지'}
                      isBookmarked={true} // 북마크 페이지에서는 항상 북마크된 상태
                      onBookmarkClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(place);
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