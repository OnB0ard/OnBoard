import React, { useState, useEffect, useRef } from "react";
import Icon from "../atoms/Icon";
import SearchBar from "./SearchBar";
import PlaceResult from "./PlaceResult";
import Bookmark from "./Bookmark";
import PlaceDetailModal from "./PlaceDetailModal";
import { useSearchStore, useBookmarkStore, usePlaceDetailsStore } from "../../store/mapStore";
import useDailyPlanStore from "@/store/useDailyPlanStore";
import { useParams } from "react-router-dom";
import "./SearchPlace.css";

const SearchPlace = ({ isOpen, onClose }) => {
  const popupRef = useRef(null);

  // Bookmark store functionality
  const { toggleBookmark, isBookmarked, loadBookmarks } = useBookmarkStore();
  const planIdFromStore = useDailyPlanStore((state) => state.planId || state.currentPlanId);
  const params = useParams();
  const planIdFromParams = params?.planId || params?.id;
  const effectivePlanId = planIdFromStore || planIdFromParams || new URLSearchParams(window.location.search).get('planId');

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
                  isBookmarked: isBookmarked(place.googlePlaceId || place.place_id)
                }))}
                onPlaceClick={handlePlaceClick}
                onBookmarkClick={async (place) => {
                  try {
                    if (!effectivePlanId) {
                      console.warn('planId가 없어 북마크를 처리할 수 없습니다. 먼저 여행 계획을 선택하세요.');
                      alert('여행 계획을 먼저 선택해주세요. (planId 없음)');
                      return;
                    }
                    const placeId = place.place_id || place.id || place.googlePlaceId;
                    if (!placeId) return;
                    // 세부정보 먼저 가져오기 (모달은 열지 않음)
                    let processed = await usePlaceDetailsStore.getState().handlePlaceSelection(placeId, false);
                    // placeConstructor 미초기화 등으로 실패 시 레거시 getDetails로 재시도
                    if (!processed) {
                      try {
                        processed = await usePlaceDetailsStore.getState()._fetchAndProcessPlaceDetails(placeId);
                      } catch (_) {
                        processed = null;
                      }
                    }
                    if (!processed) return; // 최종 실패 시 중단
                    await toggleBookmark(processed, effectivePlanId);
                    // 필요 시 목록 동기화
                    if (effectivePlanId && loadBookmarks) {
                      loadBookmarks(effectivePlanId);
                    }
                  } catch (e) {
                    console.error('검색 결과 북마크 처리 실패:', e);
                  }
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