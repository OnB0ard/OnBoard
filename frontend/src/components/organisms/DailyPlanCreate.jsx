import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DailyPlaceBlock from './DailyPlaceBlock';
import BookmarkModal from './BookmarkModal';
import PlanMemoModal from './PlanMemoModal';
import { Button } from '../atoms/Button';
import './DailyPlanCreate.css';

const DailyPlanCreate = ({ isOpen, onClose, bookmarkedPlaces = [], position }) => {
  const [isMounted, setIsMounted] = useState(false);
  const modalRef = useRef(null);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [draggedPlaceId, setDraggedPlaceId] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);
  const [bookmarkModalPosition, setBookmarkModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoModalData, setMemoModalData] = useState({
    place: null,
    dayTitle: '',
    memo: '',
    position: { x: 0, y: 0 }
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);


  useEffect(() => {
    if (!isOpen) {
      setShowBookmarkModal(false);
      setShowMemoModal(false);
      setSelectedDayIndex(null);
    }
  }, [isOpen]);

  // 데이터 구조를 DailyPlaceBlock에 맞게 통일하는 함수
  const normalizePlaceData = (place) => {
    const photoUrl = place.imageUrl || (place.photos && place.photos[0]?.getUrl({ maxWidth: 100, maxHeight: 100 })) || (place.googleImg && place.googleImg[0]);
    
    return {
      id: place.id || place.place_id || place.googlePlaceId,
      name: place.name || place.displayName || place.placeName,
      address: place.address || place.formatted_address,
      rating: place.rating,
      ratingCount: place.ratingCount || place.user_ratings_total,
      imageUrl: photoUrl,
      // 원본 데이터도 포함하여 혹시 모를 다른 정보도 유지
      originalData: place,
    };
  };

  const addDailyPlan = () => {
    const newDay = {
      id: Date.now(),
      title: `${dailyPlans.length + 1}일차`,
      places: []
    };
    setDailyPlans(prev => [...prev, newDay]);
  };

  const removeDailyPlan = (dayId) => {
    setDailyPlans(prev => prev.filter(day => day.id !== dayId));
  };

  const updateDayTitle = (dayId, newTitle) => {
    setDailyPlans(prev => prev.map(day => 
      day.id === dayId ? { ...day, title: newTitle } : day
    ));
  };

  const addPlaceFromBookmark = (place) => {
    if (selectedDayIndex !== null) {
      const normalizedPlace = normalizePlaceData(place);
      const newPlace = {
        ...normalizedPlace,
        id: `${normalizedPlace.id}-${Date.now()}` // 고유 ID 보장
      };
      
      setDailyPlans(prev => prev.map((day, index) => 
        index === selectedDayIndex 
          ? { ...day, places: [...day.places, newPlace] }
          : day
      ));
      setShowBookmarkModal(false);
      setSelectedDayIndex(null);
    }
  };

  const handleDropFromWhiteboard = (e, dayIndex) => {
    e.preventDefault();
    setShowMemoModal(false);
    
    try {
      const placeData = e.dataTransfer.getData('text/plain');
      const place = JSON.parse(placeData);
      const normalizedPlace = normalizePlaceData(place);
      
      const newPlace = {
        ...normalizedPlace,
        id: `${normalizedPlace.id}-${Date.now()}` // 고유 ID 보장
      };
      
      setDailyPlans(prev => prev.map((day, index) => 
        index === dayIndex 
          ? { ...day, places: [...day.places, newPlace] }
          : day
      ));
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
    
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDragOver = (e, dayIndex) => {
    e.preventDefault();
    setShowMemoModal(false);
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handlePlaceDragStart = (e, place, dayIndex, placeIndex) => {
    console.log('드래그 시작:', { place: place.name, dayIndex, placeIndex });
    
    // 드래그 데이터 설정
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      placeId: place.id,
      dayIndex: dayIndex,
      placeIndex: placeIndex
    }));
    
    // 상태 설정
    setDraggedPlaceId(place.id);
    setDraggedFromDay(dayIndex);
    setDraggedFromIndex(placeIndex);
    setIsDragging(true);
    
    // 시각적 피드백
    e.target.style.opacity = '0.5';
  };

  const handlePlaceDrop = (e, targetDayIndex, targetPlaceIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('드롭 이벤트:', { 
      targetDayIndex, 
      targetPlaceIndex,
      draggedFromDay,
      draggedFromIndex
    });
    
    // 드래그 데이터 가져오기
    let dragData;
    try {
      const data = e.dataTransfer.getData('application/json');
      dragData = JSON.parse(data);
    } catch (error) {
      console.error('드래그 데이터 파싱 실패:', error);
      return;
    }
    
    const { dayIndex: sourceDayIndex, placeIndex: sourcePlaceIndex } = dragData;
    
    if (sourceDayIndex === targetDayIndex && sourcePlaceIndex === targetPlaceIndex) {
      console.log('같은 위치로 드롭 - 무시');
      return;
    }
    
    setDailyPlans(prev => {
      const newPlans = [...prev];
      
      // 드래그된 장소 가져오기
      const draggedPlace = newPlans[sourceDayIndex].places[sourcePlaceIndex];
      console.log('드래그된 장소:', draggedPlace.name);
      
      // 원래 위치에서 제거
      newPlans[sourceDayIndex].places.splice(sourcePlaceIndex, 1);
      
      // 새로운 위치에 삽입
      if (sourceDayIndex === targetDayIndex) {
        // 같은 일정 내에서 순서 변경
        let adjustedTargetIndex = targetPlaceIndex;
        if (sourcePlaceIndex < targetPlaceIndex) {
          adjustedTargetIndex -= 1;
        }
        console.log('같은 일정 내 이동:', { from: sourcePlaceIndex, to: adjustedTargetIndex });
        newPlans[targetDayIndex].places.splice(adjustedTargetIndex, 0, draggedPlace);
      } else {
        // 다른 일정으로 이동
        console.log('다른 일정으로 이동');
        newPlans[targetDayIndex].places.splice(targetPlaceIndex, 0, draggedPlace);
      }
      
      return newPlans;
    });
    
    // 상태 초기화
    setDraggedPlaceId(null);
    setDraggedFromDay(null);
    setDraggedFromIndex(null);
    setIsDragging(false);
    setDragOverIndex(null);
    
    // 스타일 초기화
    const placeItems = document.querySelectorAll('.place-item');
    placeItems.forEach(item => {
      item.style.opacity = '1';
      item.classList.remove('drag-over-place');
    });
  };

  const handlePlaceDragOver = (e, dayIndex, placeIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDragging && draggedFromDay === dayIndex) {
      setDragOverIndex(placeIndex);
      e.currentTarget.classList.add('drag-over-place');
    }
  };

  const handlePlaceDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over-place');
    setDragOverIndex(null);
  };

  const handlePlaceDragEnd = (e) => {
    e.preventDefault();
    
    console.log('드래그 종료');
    
    // 상태 초기화
    setIsDragging(false);
    setDragOverIndex(null);
    setDraggedPlaceId(null);
    setDraggedFromDay(null);
    setDraggedFromIndex(null);
    
    // 스타일 초기화
    const placeItems = document.querySelectorAll('.place-item');
    placeItems.forEach(item => {
      item.style.opacity = '1';
      item.classList.remove('drag-over-place');
    });
  };

  const removePlace = (dayIndex, placeIndex) => {
    setDailyPlans(prev => prev.map((day, index) => 
      index === dayIndex 
        ? { ...day, places: day.places.filter((_, pIndex) => pIndex !== placeIndex) }
        : day
    ));
  };

  const updatePlaceMemo = (dayIndex, placeIndex, memo) => {
    setDailyPlans(prev => prev.map((day, index) => 
      index === dayIndex 
        ? { 
            ...day, 
            places: day.places.map((place, pIndex) => 
              pIndex === placeIndex 
                ? { ...place, memo }
                : place
            )
          }
        : day
    ));
  };

  const handleOpenMemoModal = (place, dayTitle, position) => {
    setShowBookmarkModal(false);
    setSelectedDayIndex(null);
    
    setMemoModalData({
      place,
      dayTitle,
      memo: place.memo || '',
      position
    });
    setShowMemoModal(true);
  };

  const handleMemoSave = (memo) => {
    const { place, dayTitle } = memoModalData;
    const dayIndex = dailyPlans.findIndex(day => day.title === dayTitle);
    const placeIndex = dailyPlans[dayIndex]?.places.findIndex(p => p.id === place.id);
    
    if (dayIndex !== -1 && placeIndex !== -1) {
      updatePlaceMemo(dayIndex, placeIndex, memo);
    }
    
    setShowMemoModal(false);
  };

  if (!isOpen || !isMounted) {
    return null;
  }

  return createPortal(
    <div 
      className="daily-plan-modal"
      style={position ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none' } : {}}
    >
      <div className="daily-plan-content" ref={modalRef}>
        <div className="daily-plan-header">
          <h2>일정짜기</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="daily-plan-body">
          {dailyPlans.map((day, dayIndex) => (
            <div 
              key={day.id} 
              className="daily-plan-block"
              onDragOver={(e) => handleDragOver(e, dayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropFromWhiteboard(e, dayIndex)}
            >
              <div className="day-header">
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateDayTitle(day.id, e.target.value)}
                  className="day-title-input"
                />
                <button 
                  onClick={() => removeDailyPlan(day.id)}
                  className="remove-day-button"
                >
                  삭제
                </button>
              </div>
              
              <div className="places-container">
                {day.places.map((place, placeIndex) => (
                  <div
                    key={place.id}
                    className="place-item"
                    draggable="true"
                    data-dragging={isDragging && draggedPlaceId === place.id}
                    data-drop-target={isDragging && dragOverIndex === placeIndex && draggedFromDay === dayIndex}
                    onDragStart={(e) => handlePlaceDragStart(e, place, dayIndex, placeIndex)}
                    onDragOver={(e) => handlePlaceDragOver(e, dayIndex, placeIndex)}
                    onDragLeave={handlePlaceDragLeave}
                    onDragEnd={handlePlaceDragEnd}
                    onDrop={(e) => handlePlaceDrop(e, dayIndex, placeIndex)}
                  >
                    <DailyPlaceBlock
                      place={place}
                      onRemove={() => removePlace(dayIndex, placeIndex)}
                      onEdit={() => {}}
                      onMemoUpdate={(placeId, memo) => updatePlaceMemo(dayIndex, placeIndex, memo)}
                      dayTitle={day.title}
                      onOpenMemoModal={handleOpenMemoModal}
                    />
                  </div>
                ))}
                
                <Button 
                  className="add-place-button"
                  onClick={(e) => {
                    if (showMemoModal) return;
                    
                    const rect = e.currentTarget.getBoundingClientRect();
                    const modalPosition = { 
                      x: rect.right + 10, 
                      y: rect.top
                    };
                    
                    setBookmarkModalPosition(modalPosition);
                    setSelectedDayIndex(dayIndex);
                    setShowBookmarkModal(true);
                  }}
                >
                  +
                </Button>
              </div>
            </div>
          ))}
          
          <Button 
            className="add-day-button"
            onClick={addDailyPlan}
          >
            + 일정 추가
          </Button>
        </div>
      </div>
      
      {showBookmarkModal && (
        <BookmarkModal
          isOpen={showBookmarkModal}
          onClose={() => {
            setShowBookmarkModal(false);
            setSelectedDayIndex(null);
          }}
          bookmarkedPlaces={bookmarkedPlaces}
          onPlaceSelect={addPlaceFromBookmark}
          position={bookmarkModalPosition}
        />
      )}

      {showMemoModal && (
        <PlanMemoModal
          isOpen={showMemoModal}
          onClose={() => setShowMemoModal(false)}
          memo={memoModalData.memo}
          onSave={handleMemoSave}
          placeName={memoModalData.place.name}
          dayTitle={memoModalData.dayTitle}
          position={memoModalData.position}
        />
      )}
    </div>,
    document.body
  );
};

export default DailyPlanCreate;