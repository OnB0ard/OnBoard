import React, { useState, useEffect, useRef } from "react";
import Icon from "../atoms/Icon";
import SearchBar from "./SearchBar";
import PlaceResult from "./PlaceResult";
import Bookmark from "./Bookmark";
import PlaceDetailModal from "./PlaceDetailModal";
import { useSearchStore, useBookmarkStore, usePlaceDetailsStore } from "../../store/mapStore";
import "./SearchPlace.css";

const SearchPlace = ({ isOpen, onClose }) => {
  const popupRef = useRef(null);

  // Bookmark store functionality
  const { toggleBookmark, isBookmarked, setActivePlanId } = useBookmarkStore();
  // 북마크 변경 시 즉시 UI 반영을 위해 목록에도 구독해 리렌더 트리거
  const bookmarkedPlaces = useBookmarkStore((state) => state.bookmarkedPlaces);
  
  // Search store functionality
  const { 
    searchPlacesByQuery,
    clearSearchResults,
    isSearching,
    hasSearched,
    searchResults 
  } = useSearchStore();
  
  // Place details store functionality
  const {
    setIsPlaceDetailModalOpen,
    setSelectedPlace,
    setPlaceDetailPosition,
    isPlaceDetailModalOpen,
    selectedPlace,
    placeDetailPosition,
  } = usePlaceDetailsStore();

  // 외부 클릭 감지 및 검색창 열기/닫기 시 초기화
  useEffect(() => {
    const handleClickOutside = (event) => {
      // PlaceDetailModal 영역 클릭 시 검색 모달 닫지 않음
      if (event.target.closest('.place-detail-modal')) {
        return;
      }
      
      // 검색 모달 내부 클릭 시 닫지 않음
      if (popupRef.current && popupRef.current.contains(event.target)) {
        return;
      }
      
      // 검색 모달 자체를 클릭한 경우 닫지 않음
      if (event.target.closest('.search-popup')) {
        return;
      }
      
      // 검색바나 검색 결과 영역 클릭 시 닫지 않음
      if (event.target.closest('.search-popup-searchbar') || event.target.closest('.search-popup-results')) {
        return;
      }
      
      // 그 외의 경우에만 모달 닫기
      onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // 검색창이 닫힐 때 검색 결과 초기화
      clearSearchResults();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, clearSearchResults]);

  // 검색 처리
  const handleSearch = (searchTerm) => {
    console.log("검색어:", searchTerm);
    searchPlacesByQuery(searchTerm);
  };

  const handleSearchModalClose = () => {
    clearSearchResults(); // 검색 결과 및 상태 초기화
    setIsPlaceDetailModalOpen(false); // PlaceDetailModal 닫기
    onClose();
  }

  // 장소 상세보기 모달 열기
  const handlePlaceClick = (place) => {
    console.log("선택된 장소:", place);

    const searchModalLeft = 70; // 검색 모달의 left 위치
    const searchModalWidth = 330; // 검색 모달의 원래 너비 (max-width)
    const searchModalRight = searchModalLeft + searchModalWidth;

    const position = {
      x: searchModalRight + 5, // 검색 모달 오른쪽에서 5px 떨어진 위치
      y: 80, // 검색 모달과 같은 top 위치
    };

    setPlaceDetailPosition(position);
    setSelectedPlace(place);
    setIsPlaceDetailModalOpen(true);
  };

  // 현재 planId를 URL에서 추출해 활성 플랜 설정 (PlanPage 컨텍스트)
  useEffect(() => {
    try {
      const path = window.location.pathname;
      const match = path.match(/plan\/(\d+|[\w-]+)/i);
      if (match) setActivePlanId(match[1]);
    } catch (e) {
      // ignore
    }
  }, [setActivePlanId]);

  if (!isOpen) return null;

  return (
    <div className="search-popup" ref={popupRef}>
      <div className="search-popup-container">
        {/* 검색바 */}
        <div className="search-popup-searchbar" onClick={(e) => e.stopPropagation()}>
          <SearchBar 
            type="mapsearch" 
            onSearch={handleSearch}
          />
        </div>

        {/* 검색 결과 영역 */}
        <div className="search-popup-results" onClick={(e) => e.stopPropagation()}>
          {console.log('Search state:', { isSearching, hasSearched, resultsLength: searchResults.length })}
          {isSearching ? (
            <div className="search-loading">
              <p>검색 중...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-list">
              <PlaceResult 
                places={searchResults.map(place => ({
                  ...place,
                  isBookmarked: isBookmarked(place.place_id)
                }))}
                onPlaceClick={handlePlaceClick}
                onBookmarkClick={(place) => {
                  console.log("북마크 토글:", place);
                  toggleBookmark(place);
                }}
                onDragStart={(e, place) => {
                  console.log("드래그 시작:", place.name);
                }}
              />
            </div>
          ) : (
            <div className="search-empty">
              <p>{hasSearched ? "검색 결과가 없습니다" : "장소를 검색해보세요"}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* PlaceDetailModal */}
      {isPlaceDetailModalOpen && (
        <PlaceDetailModal
          isOpen={isPlaceDetailModalOpen}
          onClose={() => setIsPlaceDetailModalOpen(false)}
          place={selectedPlace}
          position={placeDetailPosition}
        />
      )}
    </div>
  );
};

export default SearchPlace;