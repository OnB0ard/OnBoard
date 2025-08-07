// 장소 검색 후 나올 결과 리스트 

import React, { useRef, useEffect, useCallback } from 'react';
import { useSearchStore } from '../../store/mapStore';
import StarRating from '../atoms/StarRating';
import PlaceImage from '../atoms/PlaceImage';
import Icon from '../atoms/Icon';

const PlaceResult = ({ onBookmarkClick, onPlaceClick }) => {
  const searchResults = useSearchStore((state) => state.searchResults);
  const isSearching = useSearchStore((state) => state.isSearching);
  const fetchNextPage = useSearchStore((state) => state.fetchNextPage);
  const pagination = useSearchStore((state) => state.pagination);
  const isLoadingMore = useSearchStore((state) => state.isLoadingMore);

  const loader = useRef(null);

  // 드래그 시작 시, 장소의 place_id만 데이터로 전달합니다.
  const handleDragStart = (e, place) => {
    // place_id만 포함된 간단한 JSON 객체를 전달합니다.
    e.dataTransfer.setData('application/json', JSON.stringify({ placeId: place.place_id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

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

  // isSearching은 최초 검색에만 사용하고, 이후에는 isLoadingMore로 추가 로딩을 표시
  if (isSearching && searchResults.length === 0) {
    return <div className="p-4 text-center">검색 중...</div>;
  }

  return (
    <div className="space-y-2">
      {searchResults.filter(Boolean).map((place) => {
        const imageUrl = place.photos && place.photos[0]
          ? place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 })
          : 'https://item.kakaocdn.net/do/f54d975d70c2916c5705a0919f193a547154249a3890514a43687a85e6b6cc82';

        return (
          <div
            key={place.googlePlaceId || place.place_id}
            className="place-result-item flex gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
            onClick={() => onPlaceClick(place)}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, place)}
          >
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-bold text-gray-900">{place.name}</h3>
              {place.rating && (
                <div className="flex items-center gap-3">
                  <StarRating rating={place.rating} reviewCount={place.user_ratings_total} />
                </div>
              )}
              {place.primaryCategory && <p className="text-xs text-gray-600">{place.primaryCategory}</p>}
              <p className="text-sm text-gray-500">{place.formatted_address}</p>
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

      {/* 무한 스크롤을 위한 로더 및 감지 요소 */}
      <div ref={loader} />

      {isLoadingMore && (
        <div className="p-4 text-center">결과 더보기...</div>
      )}
    </div>
  );
};

export default PlaceResult;