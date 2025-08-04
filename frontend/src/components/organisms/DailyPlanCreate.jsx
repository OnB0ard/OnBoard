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
      const newPlace = {
        ...place,
        id: `${place.id}-${Date.now()}`
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
      
      const newPlace = {
        ...place,
        id: `${place.id}-${Date.now()}`
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
    setDraggedPlaceId(place.id);
    setDraggedFromDay(dayIndex);
    setDraggedFromIndex(placeIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePlaceDrop = (e, targetDayIndex, targetPlaceIndex) => {
    e.preventDefault();
    if (draggedPlaceId !== null) {
      setDailyPlans(prev => {
        const newPlans = [...prev];
        const draggedPlace = newPlans[draggedFromDay].places[draggedFromIndex];
        
        newPlans[draggedFromDay].places.splice(draggedFromIndex, 1);
        
        if (targetDayIndex === draggedFromDay) {
          newPlans[targetDayIndex].places.splice(targetPlaceIndex, 0, draggedPlace);
        } else {
          newPlans[targetDayIndex].places.splice(targetPlaceIndex, 0, draggedPlace);
        }
        
        return newPlans;
      });
    }
    
    setDraggedPlaceId(null);
    setDraggedFromDay(null);
    setDraggedFromIndex(null);
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
                    onDragStart={(e) => handlePlaceDragStart(e, place, dayIndex, placeIndex)}
                    onDragOver={(e) => e.preventDefault()}
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