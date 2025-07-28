// 북마크 모음집 
import React, { useState, useEffect, useRef } from 'react';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import './Bookmark.css';

const Bookmark = ({ isOpen, onClose, bookmarkedPlaces = [], onPlaceClick, onBookmarkClick }) => {
  const [localBookmarkedPlaces, setLocalBookmarkedPlaces] = useState(bookmarkedPlaces);
  const popupRef = useRef(null);

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



  // props가 변경될 때만 로컬 상태 업데이트
  useEffect(() => {
    setLocalBookmarkedPlaces(bookmarkedPlaces);
  }, [bookmarkedPlaces.length]);

  const displayPlaces = localBookmarkedPlaces;

  if (!isOpen) return null;

  return (
    <div className="bookmark-popup" ref={popupRef}>
      <div className="bookmark-popup-container">
        <div className="bookmark-popup-header">
          <h2 className="bookmark-popup-title">저장된 장소</h2>
          <button onClick={onClose} className="bookmark-popup-close">✕</button>
        </div>
        <div className="bookmark-popup-content">
          {displayPlaces.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>저장된 장소가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayPlaces.map((place) => (
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
                        // 북마크 취소 시 즉시 로컬 리스트에서 제거
                        setLocalBookmarkedPlaces(prev => prev.filter(p => p.id !== place.id));
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
    </div>
  );
};

export default Bookmark;