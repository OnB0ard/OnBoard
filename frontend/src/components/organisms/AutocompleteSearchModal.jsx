import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import Icon from '../atoms/Icon';
import SearchBar from './SearchBar';
import PlaceResult from './PlaceResult';
import PlaceDetailModal from './PlaceDetailModal';
import useMapStore from '../../store/useMapStore';
import './AutocompleteSearchModal.css';

/**
 * Google 지도 장소 검색 및 자동완성 기능을 제공하는 모달 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달의 열림/닫힘 상태
 * @param {function} props.onClose - 모달을 닫는 함수
 */
const AutocompleteSearchModal = ({ isOpen, onClose }) => {
    // Zustand를 사용한 지도 관련 전역 상태 및 액션
  const {
    mapInstance,
    placesService,
    setPlacesService,
    inputValue,
    searchResults,
    isSearching,
    hasSearched,
    autocompletePredictions,
    setInputValue,
    performTextSearch,
    handlePlaceSelection,
    fetchAutocompletePredictions,
    clearSearch,
    toggleBookmark,
    isBookmarked,
  } = useMapStore();

  // PlaceDetailModal 상태 관리
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetailPosition, setPlaceDetailPosition] = useState({ x: 0, y: 0 });
  const [isAutocompleteClicked, setIsAutocompleteClicked] = useState(false);


  const placesLib = useMapsLibrary('places');

    // Places 라이브러리와 지도 인스턴스가 준비되면 PlacesService를 생성하고 전역 상태에 저장합니다.
  useEffect(() => {
    if (placesLib && mapInstance && !placesService) {
      const service = new placesLib.PlacesService(mapInstance);
      setPlacesService(service);
    }
  }, [placesLib, mapInstance, placesService, setPlacesService]);

    // DOM 요소에 직접 접근하기 위한 Ref
  const inputRef = useRef(null); // 검색 입력창 Ref
  const modalRef = useRef(null); // 모달 컨텐츠 영역 Ref

    // 모달을 닫을 때 호출되는 콜백 함수
  // 검색 관련 상태를 초기화하고 부모 컴포넌트의 onClose 함수를 호출합니다.
  const handleClose = useCallback(() => {
    clearSearch();
    setShowPlaceDetail(false); // PlaceDetailModal 닫기
    onClose();
  }, [clearSearch, onClose]);

    // 모달 외부를 클릭했을 때 모달을 닫는 기능을 처리하는 Hook
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 모달 영역(modalRef)의 바깥쪽을 클릭했는지 확인합니다.
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }

      handleClose();
    };

    // 모달이 열려 있을 때만 이벤트 리스너를 추가합니다.
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // 컴포넌트가 언마운트될 때 이벤트 리스너를 정리합니다.
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

    // 모달이 열릴 때 검색창에 자동으로 포커스를 주는 Hook
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // 모달이 완전히 표시된 후 포커스를 주기 위해 약간의 지연을 줍니다.
      setTimeout(() => inputRef.current.focus(), 100);
      // 모달이 열릴 때 자동완성 상태 초기화
      clearSearch();
    }
  }, [isOpen]);

    // 검색창에서 키보드 입력을 처리하는 함수
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 폼 제출 방지
      performTextSearch(); // 텍스트 검색 실행
    } else if (e.key === 'Escape') {
      handleClose(); // 모달 닫기
    }
  };

    // 자동완성 추천 목록의 항목을 클릭했을 때 실행되는 함수
  const handlePredictionClick = async (prediction) => {
    try {
      // 선택된 장소의 place_id를 사용하여 상세 정보를 가져옵니다.
      await handlePlaceSelection(prediction.place_id);
    } catch (error) {
      console.error('장소 선택 처리 중 오류 발생:', error);
    }
  };

  const handlePredictionClickWithEvent = async (e, prediction) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    await handlePredictionClick(prediction);
  };

  // 장소 상세보기 모달 열기
  const handlePlaceClick = (place) => {
    console.log("AutocompleteSearchModal에서 장소 선택:", place);
    
    // AutocompleteSearchModal의 위치를 기준으로 PlaceDetailModal 위치 계산
    const searchModalLeft = 70; // 검색 모달의 left 위치
    const searchModalWidth = 330; // 검색 모달의 원래 너비 (max-width)
    const searchModalRight = searchModalLeft + searchModalWidth;
    
    const position = { 
      x: searchModalRight + 5, // 검색 모달 오른쪽에서 5px 떨어진 위치 (10px에서 5px로 줄임)
      y: 80 // 검색 모달과 같은 top 위치
    };
    
    setPlaceDetailPosition(position);
    setSelectedPlace(place);
    setShowPlaceDetail(true);
  };

  if (!isOpen) return null;

  return (
    <div className="autocomplete-search-overlay">
      <div className="autocomplete-search-modal" ref={modalRef}>
        <div className="autocomplete-search-header">
          <button onClick={handleClose} className="close-button" aria-label="닫기">
            <Icon type="close" />
          </button>
        </div>

        <div className="autocomplete-search-container">
          <div className="autocomplete-search-searchbar">
            <SearchBar
              ref={inputRef}
              type="mapsearch"
              placeholder="장소나 주소를 검색하세요"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                fetchAutocompletePredictions(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              onSearch={performTextSearch}
            />
            {autocompletePredictions.length > 0 && !hasSearched && (
              <ul className="autocomplete-predictions-list" onClick={(e) => e.stopPropagation()}>
                {autocompletePredictions.map((prediction) => (
                  <li
                    key={prediction.place_id}
                    onClick={(e) => handlePredictionClickWithEvent(e, prediction)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Icon type="location" />
                    <div className="prediction-text">
                      <span className="prediction-main-text">{prediction.structured_formatting.main_text}</span>
                      <span className="prediction-secondary-text">{prediction.structured_formatting.secondary_text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="autocomplete-search-content">
            {isSearching ? (
              <div className="search-empty"><p>검색 중...</p></div>
            ) : hasSearched ? (
              searchResults.length > 0 ? (
                <PlaceResult 
                  places={searchResults.map(place => ({
                    ...place,
                    isBookmarked: isBookmarked(place.place_id)
                  }))}
                  onPlaceClick={handlePlaceClick}
                  onBookmarkClick={(place) => {
                    console.log("AutocompleteSearchModal에서 북마크 토글:", place);
                    toggleBookmark(place);
                  }}
                  onDragStart={(e, place) => {
                    console.log("AutocompleteSearchModal에서 드래그 시작:", place);
                  }}
                />
              ) : (
                <div className="search-empty"><p>검색 결과가 없습니다.</p></div>
              )
            ) : null}
          </div>
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

export default AutocompleteSearchModal;
