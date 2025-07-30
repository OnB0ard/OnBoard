import React, { useState, useEffect, useRef } from "react";
import Icon from "../atoms/Icon";
import SearchBar from "./SearchBar";
import PlaceResult from "./PlaceResult";
import Bookmark from "./Bookmark";
import "./SearchPlace.css";

const SearchPlace = ({ isOpen, onClose }) => {
  const popupRef = useRef(null);

  // 외부 클릭 감지 및 검색창 열기/닫기 시 초기화
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // 검색창이 닫힐 때 검색 결과와 북마크 상태 초기화
      setSearchResults([]);
      setBookmarkedPlaces(new Set());
      setHasSearched(false);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState(new Set());

  // 검색어 나중에 다른 변수로 바꾸기
  const handleSearch = (searchTerm) => {
    console.log("검색어:", searchTerm);
    setIsSearching(true);
    setHasSearched(true);
    
    // TODO: API 호출로 검색 결과 받아오기
    // 실제 API 호출 예시:
    // searchPlacesAPI(searchTerm)
    //   .then(results => {
    //     setSearchResults(results);
    //     setIsSearching(false);
    //   })
    //   .catch(error => {
    //     console.error("검색 오류:", error);
    //     setSearchResults([]);
    //     setIsSearching(false);
    //   });
    
    // 임시로 빈 배열로 설정 (실제 API 연동 시 위 주석 해제)
    setTimeout(() => {
      setSearchResults([]);
      setIsSearching(false);
    }, 500);
  };

  const handleSearchModalClose = () => {
    setSearchResults([]); // 검색 결과 초기화
    setBookmarkedPlaces(new Set()); // 북마크 상태도 초기화
    setHasSearched(false); // 검색 시도 상태 초기화
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="search-popup" ref={popupRef}>
      <div className="search-popup-container">
        {/* 검색바 */}
        <div className="search-popup-searchbar">
          <SearchBar 
            type="mapsearch" 
            onSearch={handleSearch}
          />
        </div>

        {/* 검색 결과 영역 */}
        <div className="search-popup-results">
          {isSearching ? (
            <div className="search-loading">
              <p>검색 중...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-list">
              <PlaceResult 
                places={searchResults.map(place => ({
                  ...place,
                  isBookmarked: bookmarkedPlaces.has(place.id)
                }))}
                onPlaceClick={(place) => {
                  console.log("선택된 장소:", place);
                  // TODO: 장소 선택 시 처리
                }}
                onBookmarkClick={(place) => {
                  console.log("북마크 토글:", place);
                  setBookmarkedPlaces(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(place.id)) {
                      newSet.delete(place.id);
                    } else {
                      newSet.add(place.id);
                    }
                    return newSet;
                  });
                }}
              />
            </div>
          ) : (
            <div className="search-empty">
              <p>{hasSearched ? "검색 결과가 없습니다" : "검색어를 입력해주세요"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPlace;