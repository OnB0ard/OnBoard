import React, { useState, useEffect, useRef } from "react";
import Icon from "../atoms/Icon";
import SearchBar from "./SearchBar";
import PlaceResult from "./PlaceResult";
import Bookmark from "./Bookmark";
import PlaceDetailModal from "./PlaceDetailModal";
import useMapStore from "../../store/useMapStore";
import "./SearchPlace.css";

const SearchPlace = ({ isOpen, onClose }) => {
  const popupRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // useMapStore에서 북마크 관련 함수 가져오기
  const { toggleBookmark, isBookmarked } = useMapStore();
  
  // PlaceDetailModal 상태 관리
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetailPosition, setPlaceDetailPosition] = useState({ x: 0, y: 0 });

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
      setSearchResults([]);
      setHasSearched(false);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 검색 처리
  const handleSearch = (searchTerm) => {
    console.log("검색어:", searchTerm);
    setIsSearching(true);
    setHasSearched(true);
    
    // 실제 검색 로직은 나중에 구현
    setTimeout(() => {
      setSearchResults([]); // 임시로 빈 결과
      setIsSearching(false);
    }, 500);
  };

  const handleSearchModalClose = () => {
    setSearchResults([]); // 검색 결과 초기화
    setHasSearched(false); // 검색 시도 상태 초기화
    setShowPlaceDetail(false); // PlaceDetailModal 닫기
    onClose();
  }

  // 장소 상세보기 모달 열기
  const handlePlaceClick = (place) => {
    console.log("선택된 장소:", place);
    
    // 검색 모달의 위치를 기준으로 PlaceDetailModal 위치 계산
    const searchModalLeft = 70; // 검색 모달의 left 위치
    const searchModalWidth = 330; // 검색 모달의 원래 너비 (max-width)
    const searchModalRight = searchModalLeft + searchModalWidth;
    
    const position = { 
      x: searchModalRight + 5, // 검색 모달 오른쪽에서 5px 떨어진 위치
      y: 80 // 검색 모달과 같은 top 위치
    };
    
    setPlaceDetailPosition(position);
    setSelectedPlace(place);
    setShowPlaceDetail(true);
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
      {showPlaceDetail && (
        <PlaceDetailModal
          isOpen={showPlaceDetail}
          onClose={() => setShowPlaceDetail(false)}
          place={selectedPlace}
          position={placeDetailPosition}
        />
      )}
    </div>
  );
};

export default SearchPlace;