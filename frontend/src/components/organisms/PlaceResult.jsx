// 장소 검색 후 나올 결과 리스트 
import React from 'react';
import useMapStore from '../../store/useMapStore';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import Icon from '../atoms/Icon';

const PlaceResult = ({ onBookmarkClick, onDragStart }) => {
  const { searchResults, isSearching, handlePlaceSelection } = useMapStore();

  const handleDragStart = (e, place, imageUrl) => {
    const simplifiedPlace = {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating,
      imageUrl, // getUrl()로 생성된 실제 URL을 전달
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
      {searchResults.map((place) => {
        // getUrl()을 호출하여 실제 이미지 URL을 가져옵니다.
        const imageUrl = place.photos && place.photos[0]
          ? place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 })
          : 'https://placehold.co/40x40/E5E7EB/6B7280?text=이미지';

        return (
          <div
            key={place.place_id}
            className="flex gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
            onClick={() => handlePlaceSelection(place.place_id)}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, place, imageUrl)}
          >
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-bold text-gray-900">{place.name}</h3>
              {place.rating && (
                <div className="flex items-center gap-3">
                  <StarRating rating={place.rating} />
                </div>
              )}
              {place.types && <p className="text-xs text-gray-600">{place.types.join(', ')}</p>}
              <p className="text-xs text-gray-500">{place.formatted_address}</p>
            </div>
            <div className="flex-shrink-0">
              <PlaceImage
                imageUrl={imageUrl} // 생성된 URL을 사용
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