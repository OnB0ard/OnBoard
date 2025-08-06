import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DailyScheduleBlock from './DailyScheduleBlock'; // 새로 만든 컴포넌트 import
import BookmarkModal from './BookmarkModal';
import PlanMemoModal from './PlanMemoModal';
import { Button } from '../atoms/Button';
import './DailyPlanCreate1.css';

const DailyPlanCreate = ({ isOpen, onClose, bookmarkedPlaces = [], position }) => {
  const [isMounted, setIsMounted] = useState(false);
  const modalRef = useRef(null);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [bookmarkModalPosition, setBookmarkModalPosition] = useState({ x: 0, y: 0 });

  // --- Drag & Drop 상태 ---
  const [draggedPlaceId, setDraggedPlaceId] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // --- Memo Modal 상태 ---
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
      originalData: place,
    };
  };

  // --- Day 관련 핸들러 ---
  const addDailyPlan = () => {
    const newDay = { id: Date.now(), title: `${dailyPlans.length + 1}일차`, places: [] };
    setDailyPlans(prev => [...prev, newDay]);
  };

  const removeDailyPlan = (dayId) => {
    setDailyPlans(prev => prev.filter(day => day.id !== dayId));
  };

  const updateDayTitle = (dayId, newTitle) => {
    setDailyPlans(prev => prev.map(day => day.id === dayId ? { ...day, title: newTitle } : day));
  };

  // --- Place 추가/삭제/수정 관련 핸들러 ---
  const addPlaceFromBookmark = (place) => {
    if (selectedDayIndex === null) return;
    const normalizedPlace = normalizePlaceData(place);
    const newPlace = { ...normalizedPlace, id: `${normalizedPlace.id}-${Date.now()}` };
    
    setDailyPlans(prev => prev.map((day, index) =>
      index === selectedDayIndex ? { ...day, places: [...day.places, newPlace] } : day
    ));
    setShowBookmarkModal(false);
    setSelectedDayIndex(null);
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
        ? { ...day, places: day.places.map((place, pIndex) => pIndex === placeIndex ? { ...place, memo } : place) }
        : day
    ));
  };

  // --- Whiteboard -> Day 드롭 핸들러 ---
  const handleDropFromWhiteboard = (e, dayIndex) => {
    e.preventDefault();
    setShowMemoModal(false);
    try {
      const placeData = e.dataTransfer.getData('text/plain');
      const place = JSON.parse(placeData);
      const normalizedPlace = normalizePlaceData(place);
      const newPlace = { ...normalizedPlace, id: `${normalizedPlace.id}-${Date.now()}` };
      
      setDailyPlans(prev => prev.map((day, index) =>
        index === dayIndex ? { ...day, places: [...day.places, newPlace] } : day
      ));
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };
  
  // --- Place Drag & Drop 핸들러 ---
  const handlePlaceDragStart = (e, place, dayIndex, placeIndex) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ placeId: place.id, dayIndex, placeIndex }));
    setDraggedPlaceId(place.id);
    setDraggedFromDay(dayIndex);
    setDraggedFromIndex(placeIndex);
    setIsDragging(true);
    e.target.style.opacity = '0.5';
  };

  const handlePlaceDrop = (e, targetDayIndex, targetPlaceIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    const { dayIndex: sourceDayIndex, placeIndex: sourcePlaceIndex } = dragData;

    if (sourceDayIndex === targetDayIndex && sourcePlaceIndex === targetPlaceIndex) return;

    setDailyPlans(prev => {
      const newPlans = [...prev];
      const draggedPlace = newPlans[sourceDayIndex].places[sourcePlaceIndex];
      newPlans[sourceDayIndex].places.splice(sourcePlaceIndex, 1);
      
      let adjustedTargetIndex = targetPlaceIndex;
      if (sourceDayIndex === targetDayIndex && sourcePlaceIndex < targetPlaceIndex) {
        adjustedTargetIndex -= 1;
      }
      newPlans[targetDayIndex].places.splice(adjustedTargetIndex, 0, draggedPlace);
      return newPlans;
    });

    handlePlaceDragEnd(e);
  };
  
  const handlePlaceDragOver = (e, dayIndex, placeIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging) {
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
    setIsDragging(false);
    setDragOverIndex(null);
    setDraggedPlaceId(null);
    setDraggedFromDay(null);
    setDraggedFromIndex(null);
    
    document.querySelectorAll('.place-item').forEach(item => {
      item.style.opacity = '1';
      item.classList.remove('drag-over-place');
    });
  };

  // --- 모달 관련 핸들러 ---
  const handleOpenBookmarkModal = (e, dayIndex) => {
    if (showMemoModal) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setBookmarkModalPosition({ x: rect.right + 10, y: rect.top });
    setSelectedDayIndex(dayIndex);
    setShowBookmarkModal(true);
  };

  const handleOpenMemoModal = (place, dayTitle, position) => {
    setShowBookmarkModal(false);
    setSelectedDayIndex(null);
    setMemoModalData({ place, dayTitle, memo: place.memo || '', position });
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

  if (!isOpen || !isMounted) return null;

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
            <DailyScheduleBlock
              key={day.id}
              day={day}
              dayIndex={dayIndex}
              onUpdateTitle={updateDayTitle}
              onRemoveDay={removeDailyPlan}
              onAddPlaceClick={handleOpenBookmarkModal}
              onDayDrop={handleDropFromWhiteboard}
              onDayDragOver={handleDragOver}
              onDayDragLeave={handleDragLeave}
              // Place 관련 props
              places={day.places}
              onRemovePlace={removePlace}
              onUpdatePlaceMemo={updatePlaceMemo}
              onOpenMemoModal={handleOpenMemoModal}
              // Place Drag & Drop 관련 props
              dragState={{ isDragging, draggedPlaceId, dragOverIndex, draggedFromDay }}
              onPlaceDragStart={handlePlaceDragStart}
              onPlaceDragOver={handlePlaceDragOver}
              onPlaceDragLeave={handlePlaceDragLeave}
              onPlaceDrop={handlePlaceDrop}
              onPlaceDragEnd={handlePlaceDragEnd}
            />
          ))}
          
          <Button className="add-day-button" onClick={addDailyPlan}>
            + 일정 추가
          </Button>
        </div>
      </div>
      
      {showBookmarkModal && (
        <BookmarkModal
          isOpen={showBookmarkModal}
          onClose={() => { setShowBookmarkModal(false); setSelectedDayIndex(null); }}
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