import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import Icon from '../atoms/Icon';
import SearchBar from './SearchBar';
import PlaceResult from './PlaceResult';
import PlaceDetailModal from './PlaceDetailModal';
import useMapStore from '../../store/useMapStore';
import './AutocompleteSearchModal.css';

const AutocompleteSearchModal = ({ isOpen, onClose }) => {
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

  useEffect(() => {
    if (placesLib && mapInstance && !placesService) {
      const service = new placesLib.PlacesService(mapInstance);
      setPlacesService(service);
    }
  }, [placesLib, mapInstance, placesService, setPlacesService]);

  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    clearSearch();
    setShowPlaceDetail(false); // PlaceDetailModal 닫기
    onClose();
  }, [clearSearch, onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;

      // ✅ 아래 조건이면 모달 닫지 않음
      if (
        target.closest('.autocomplete-search-modal') ||             // 모달 본체
        target.closest('.autocomplete-predictions-list') ||         // 자동완성 리스트
        target.closest('.place-detail-modal')                       // 상세 모달
      ) {
        return;
      }

      handleClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);




  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
      // 모달이 열릴 때 자동완성 상태 초기화
      clearSearch();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performTextSearch();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handlePredictionClick = async (prediction) => {
    try {
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
