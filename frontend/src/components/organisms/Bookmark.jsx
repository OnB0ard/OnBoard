// 북마크 모음집 
import React, { useEffect, useRef } from 'react';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import './Bookmark.css';
import {createPortal} from 'react-dom';

const Bookmark = ({ isOpen, onClose, bookmarkedPlaces = [], onPlaceClick, onBookmarkClick }) => {
  const popupRef = useRef(null);
  // console.log('🧪 Bookmark 렌더링됨?', isOpen, document.getElementById('modal-root'));

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
    <div className="bookmark-popup" ref={popupRef}>
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
            <div className="space-y-2">
              {bookmarkedPlaces.map((place) => (
                <div 
                  key={place.id} 
                  className="flex gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onPlaceClick?.(place)}
                >
                  {/* 왼쪽: 텍스트 정보 */}
                  <div className="flex-1 space-y-1">
                    {/* 제목 */}
                    <h3 className="text-base font-bold text-gray-900">{place.name}</h3>
                    
                    {/* 별점, 리뷰 수, 가격대 */}
                    <div className="flex items-center gap-3">
                      <StarRating rating={place.rating} reviewCount={place.reviewCount} />
                      {place.priceRange && (
                        <span className="text-xs text-gray-600">{place.priceRange}</span>
                      )}
                    </div>
                    
                    {/* 종류 */}
                    <p className="text-xs text-gray-600">{place.category}</p>
                    
                    {/* 주소 */}
                    <p className="text-xs text-gray-500">{place.address}</p>
                    
                    {/* 영업 시간 */}
                    <p className="text-xs text-green-600 font-medium">{place.operatingHours}</p>
                    
                  </div>
                  
                  {/* 오른쪽: 이미지 */}
                  <div className="flex-shrink-0">
                    <PlaceImage 
                      imageUrl={place.imageUrl}
                      isBookmarked={true} // 북마크 페이지에서는 항상 북마크된 상태
                      onBookmarkClick={(e) => {
                        e.stopPropagation();
                        onBookmarkClick?.(place);
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