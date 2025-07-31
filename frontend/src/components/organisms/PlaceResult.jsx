// 장소 검색 후 나올 결과 리스트 
// 장소 검색 후 나올 결과 리스트 
import React, { useRef, useEffect, useCallback } from 'react';
import useMapStore from '../../store/useMapStore';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import Icon from '../atoms/Icon';

const PlaceResult = ({ onBookmarkClick, onDragStart }) => {
  const { 
    searchResults, 
    isSearching, 
    handlePlaceSelection, 
    fetchNextPage, 
    pagination, 
    isLoadingMore, 
    selectedPlace 
  } = useMapStore();

  const loader = useRef(null);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && pagination && pagination.hasNextPage && !isLoadingMore) {
      fetchNextPage();
    }
  }, [fetchNextPage, pagination, isLoadingMore]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '20px',
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loader.current) observer.observe(loader.current);
    return () => observer.disconnect();
  }, [handleObserver]);

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

  // isSearching은 최초 검색에만 사용하고, 이후에는 isLoadingMore로 추가 로딩을 표시
  if (isSearching && searchResults.length === 0) {
    return <div className="p-4 text-center">검색 중...</div>;
  }

  return (
    <div className="space-y-2">
      {searchResults.filter(Boolean).map((place) => {
        // getUrl()을 호출하여 실제 이미지 URL을 가져옵니다.
        const imageUrl = place.photos && place.photos[0]
          ? place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 })
          : 'https://item.kakaocdn.net/do/f54d975d70c2916c5705a0919f193a547154249a3890514a43687a85e6b6cc82';

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
              {Array.isArray(place.types) && <p className="text-xs text-gray-600">{place.types.join(', ')}</p>}
              <p className="text-sm text-gray-500">{place.formatted_address}</p>
              {/* 선택된 장소와 현재 장소가 일치하고, 웹사이트 정보가 있을 경우에만 표시 */}
              {selectedPlace && selectedPlace.id === place.place_id && selectedPlace.websiteURI && (
                <a 
                  href={selectedPlace.websiteURI} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-500 hover:underline mt-1 block truncate"
                  onClick={(e) => e.stopPropagation()} // 클릭 이벤트가 부모로 전파되는 것을 방지
                >
                  {selectedPlace.websiteURI}
                </a>
              )}
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

      {/* 무한 스크롤을 위한 로더 및 감지 요소 */}
      <div ref={loader} />

      {isLoadingMore && (
        <div className="p-4 text-center">결과 더보기...</div>
      )}
    </div>
  );
};

export default PlaceResult;