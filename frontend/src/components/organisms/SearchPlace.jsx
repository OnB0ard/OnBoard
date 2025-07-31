import React, { useState, useEffect, useRef } from "react";
import Icon from "../atoms/Icon";
import SearchBar from "./SearchBar";
import PlaceResult from "./PlaceResult";
import Bookmark from "./Bookmark";
import "./SearchPlace.css";

// 임시 검색 결과 데이터를 컴포넌트 외부로 이동
const sampleSearchResults = [
  {
    id: 1,
    name: "한옥집 김치찜",
    rating: 4.0,
    reviewCount: 3,
    category: "한식",
    address: "논현로85길 5-13",
    operatingHours: "오후 9:00에 영업 종료",
    imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
    priceRange: "₩10,000~20,000"
  },
  {
    id: 2,
    name: "뉴욕김치찌개",
    rating: 4.0,
    reviewCount: 59,
    category: "음식점",
    address: "역삼동 825-20번지 강남역센트럴푸르지오시티 강남구 서울특별시 KR",
    operatingHours: "오후 9:30에 영업 종료",
    imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
    priceRange: "₩10,000~20,000"
  },
  {
    id: 3,
    name: "장꼬방 묵은 김치찌개 전문",
    rating: 4.3,
    reviewCount: 850,
    category: "한식",
    address: "효령로 364",
    operatingHours: "오후 10:00에 영업 종료",
    imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
    priceRange: "₩10,000~20,000"
  },
  {
    id: 4,
    name: "한옥집김치찜 GFC몰점",
    rating: 4.3,
    reviewCount: 8,
    category: "한식",
    address: "역삼1동 테헤란로 152 지하1층",
    operatingHours: "오후 9:00에 영업 종료",
    imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
    priceRange: "₩10,000~20,000"
  },
  {
    id: 5,
    name: "N서울타워",
    rating: 4.5,
    reviewCount: 1250,
    category: "관광지",
    address: "서울특별시 용산구 남산공원길 105",
    operatingHours: "오후 11:00에 영업 종료",
    imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
    priceRange: "₩15,000~25,000"
  }
];

const SearchPlace = ({ isOpen, onClose }) => {
  const popupRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState(new Set());

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

  // 검색어 나중에 다른 변수로 바꾸기
  const handleSearch = (searchTerm) => {
    console.log("검색어:", searchTerm);
    setIsSearching(true);
    setHasSearched(true);
    
    // 임시 검색 결과 반환 (검색어가 포함된 장소들만 필터링)
    setTimeout(() => {
      const filteredResults = sampleSearchResults.filter(place => 
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filteredResults);
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
                onDragStart={(e, place) => {
                  console.log("드래그 시작:", place.name);
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