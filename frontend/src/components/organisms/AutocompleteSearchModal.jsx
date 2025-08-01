import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import Icon from '../atoms/Icon';
import SearchBar from './SearchBar';
import PlaceResult from './PlaceResult';
import useMapStore from '../../store/useMapStore';
import './AutocompleteSearchModal.css';
import {createPortal} from 'react-dom';

/**
 * Google 지도 장소 검색 및 자동완성 기능을 제공하는 모달 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달의 열림/닫힘 상태
 * @param {function} props.onClose - 모달을 닫는 함수
 */
const AutocompleteSearchModal = ({ isOpen, onClose }) => {
    // Zustand를 사용한 지도 관련 전역 상태 및 액션
  const {
    mapInstance, // 지도 인스턴스
    setPlacesService, // PlacesService 인스턴스 설정 함수
    inputValue, // 검색창의 입력 값
    searchResults, // 텍스트 검색 결과
    isSearching, // 검색 진행 중 상태
    hasSearched, // 검색 실행 여부 상태
    autocompletePredictions, // 자동완성 추천 목록
    setInputValue, // 입력 값 변경 함수
    performTextSearch, // 텍스트 기반 장소 검색 실행 함수
    handlePlaceSelection, // 선택된 장소 처리 함수
    fetchAutocompletePredictions, // 자동완성 추천 목록 조회 함수
    clearSearch, // 검색 상태 초기화 함수
  } = useMapStore();

    // Google Maps Places 라이브러리를 로드합니다.
  const placesLib = useMapsLibrary('places');

    // Places 라이브러리와 지도 인스턴스가 준비되면 PlacesService를 생성하고 전역 상태에 저장합니다.
  useEffect(() => {
    if (placesLib && mapInstance) {
      const service = new placesLib.PlacesService(mapInstance);
      setPlacesService(service);
    }
  }, [placesLib, mapInstance, setPlacesService]);

    // DOM 요소에 직접 접근하기 위한 Ref
  const inputRef = useRef(null); // 검색 입력창 Ref
  const modalRef = useRef(null); // 모달 컨텐츠 영역 Ref

    // 모달을 닫을 때 호출되는 콜백 함수
  // 검색 관련 상태를 초기화하고 부모 컴포넌트의 onClose 함수를 호출합니다.
  const handleClose = useCallback(() => {
    clearSearch();
    onClose();
  }, [clearSearch, onClose]);

    // 모달 외부를 클릭했을 때 모달을 닫는 기능을 처리하는 Hook
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 모달 영역(modalRef)의 바깥쪽을 클릭했는지 확인합니다.
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    // 모달이 열려 있을 때만 이벤트 리스너를 추가합니다.
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
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

  if (!isOpen) return null;

  return createPortal(
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
    </div>,
    document.getElementById('modal-root')
  );
};

export default AutocompleteSearchModal;
