// 장소 검색 후 나올 결과 리스트 
import React from 'react';
import useMapStore from '../../store/useMapStore';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import Icon from '../atoms/Icon';

const PlaceResult = ({ places, onPlaceClick, onBookmarkClick, onDragStart }) => {
  const { isSearching } = useMapStore();

  const handleDragStart = (e, place, imageUrl) => {
    const simplifiedPlace = {
      id: place.place_id || place.id,
      name: place.name || place.displayName,
      formatted_address: place.formatted_address || place.address, // Google Places API 호환성
      address: place.formatted_address || place.address, // 기존 호환성
      rating: place.rating,
      category: place.types ? place.types.join(', ') : place.category,
      imageUrl, // 이미지 URL을 전달
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(simplifiedPlace));
    e.dataTransfer.effectAllowed = 'copy';
    if (onDragStart) {
      onDragStart(e, place);
    }
  };

  if (isSearching) {
    return <div className="p-4 text-center">검색 중...</div>;
  }

  return (
    <div className="space-y-2">
      {places.map((place) => {
        // Google Places API와 SearchPlace 데이터 구조를 모두 처리
        const placeId = place.place_id || place.id;
        const placeName = place.name || place.displayName;
        const placeAddress = place.formatted_address || place.address;
        const placeRating = place.rating;
        const placeTypes = place.types || [place.category];
        const reviewCount = place.user_ratings_total || place.reviewCount;
        
        // 이미지 URL 처리
        let imageUrl = 'https://placehold.co/40x40/E5E7EB/6B7280?text=이미지';
        if (place.imageUrl) {
          imageUrl = place.imageUrl;
        } else if (place.photos && place.photos[0]) {
          imageUrl = place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 });
        }

        return (
          <div
            key={placeId}
            className="flex gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
            onClick={() => onPlaceClick && onPlaceClick(place)}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, place, imageUrl)}
          >
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-bold text-gray-900">{placeName}</h3>
              {placeRating && (
                <div className="flex items-center gap-3">
                  <StarRating rating={placeRating} />
                  {reviewCount && (
                    <span className="text-xs text-gray-500">({reviewCount}개 리뷰)</span>
                  )}
                </div>
              )}
              {placeTypes && placeTypes.length > 0 && (
                <p className="text-xs text-gray-600">{Array.isArray(placeTypes) ? placeTypes.join(', ') : placeTypes}</p>
              )}
              <p className="text-xs text-gray-500">{placeAddress}</p>
            </div>
            <div className="flex-shrink-0">
              <PlaceImage
                imageUrl={imageUrl}
                isBookmarked={place.isBookmarked}
                onBookmarkClick={(e) => {
                  e.stopPropagation();
                  onBookmarkClick?.(place);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlaceResult;