import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import Icon from '../atoms/Icon';
import SearchBar from './SearchBar';
import PlaceResult from './PlaceResult';
import useMapStore from '../../store/useMapStore';
import './AutocompleteSearchModal.css';

const AutocompleteSearchModal = ({ isOpen, onClose }) => {
  const {
    mapInstance,
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
  } = useMapStore();

  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (placesLib && mapInstance) {
      const service = new placesLib.PlacesService(mapInstance);
      setPlacesService(service);
    }
  }, [placesLib, mapInstance, setPlacesService]);

  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    clearSearch();
    onClose();
  }, [clearSearch, onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
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
              <ul className="autocomplete-predictions-list">
                {autocompletePredictions.map((prediction) => (
                  <li
                    key={prediction.place_id}
                    onClick={() => handlePredictionClick(prediction)}
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
                <PlaceResult />
              ) : (
                <div className="search-empty"><p>검색 결과가 없습니다.</p></div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutocompleteSearchModal;
