// 장소 검색 후 나올 결과 리스트 
import React from 'react';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import Icon from '../atoms/Icon';

const PlaceResult = ({ places = [], onPlaceClick, onBookmarkClick }) => {

  return (
    <div className="space-y-2">
      {places.map((place, index) => (
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
            </div>
            
            {/* 종류 */}
            <p className="text-xs text-gray-600">{place.category}</p>
            
            {/* 주소 */}
            <p className="text-xs text-gray-500">{place.address}</p>
            
            {/* 영업 시간 */}
            <p className="text-xs text-green-600 font-medium">{place.operatingHours}</p>
            
            {/* 서비스 옵션 */}
            <p className="text-xs text-gray-600">{place.serviceOptions}</p>
          </div>
          
          {/* 오른쪽: 이미지 */}
          <div className="flex-shrink-0">
            <PlaceImage 
              imageUrl={place.imageUrl}
              isBookmarked={place.isBookmarked}
              onBookmarkClick={(e) => {
                e.stopPropagation();
                onBookmarkClick?.(place);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlaceResult;