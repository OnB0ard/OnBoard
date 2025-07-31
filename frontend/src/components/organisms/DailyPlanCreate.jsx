import React, { useState, useRef, useEffect } from 'react';
import DailyPlaceBlock from './DailyPlaceBlock';
import BookmarkModal from './BookmarkModal';
import PlanMemoModal from './PlanMemoModal';
import { Button } from '../atoms/Button';
import './DailyPlanCreate.css';

const DailyPlanCreate = ({ isOpen, onClose, bookmarkedPlaces = [] }) => {
  const modalRef = useRef(null);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [draggedPlaceId, setDraggedPlaceId] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);
  const [bookmarkModalPosition, setBookmarkModalPosition] = useState({ x: 0, y: 0 });
  
  // 메모 모달 상태 관리
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoModalData, setMemoModalData] = useState({
    place: null,
    dayTitle: '',
    memo: '',
    position: { x: 0, y: 0 }
  });

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      // PlaceBlock이나 드래그 관련 요소 클릭 시 모달 닫지 않음
      if (event.target.closest('.place-block') || 
          event.target.closest('.daily-plan-block') ||
          event.target.closest('.places-container') ||
          event.target.closest('.bookmark-modal') ||
          event.target.closest('.plan-memo-modal')) { // 메모 모달 클릭도 무시
        return;
      }
      
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // DailyPlanCreate 모달이 닫힐 때 다른 모달들도 함께 닫기
  useEffect(() => {
    if (!isOpen) {
      setShowBookmarkModal(false);
      setShowMemoModal(false);
      setSelectedDayIndex(null);
    }
  }, [isOpen]);

  // 일정 블록 추가
  const addDailyPlan = () => {
    const newDay = {
      id: Date.now(),
      title: `${dailyPlans.length + 1}일차`,
      places: []
    };
    setDailyPlans(prev => [...prev, newDay]);
  };

  // 일정 블록 삭제
  const removeDailyPlan = (dayId) => {
    setDailyPlans(prev => prev.filter(day => day.id !== dayId));
  };

  // 일정 제목 수정
  const updateDayTitle = (dayId, newTitle) => {
    setDailyPlans(prev => prev.map(day => 
      day.id === dayId ? { ...day, title: newTitle } : day
    ));
  };

  // 북마크에서 장소 추가
  const addPlaceFromBookmark = (place) => {
    if (selectedDayIndex !== null) {
      const newPlace = {
        ...place,
        id: `${place.id}-${Date.now()}` // 고유 ID 생성
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

  // 화이트보드에서 드롭
  const handleDropFromWhiteboard = (e, dayIndex) => {
    e.preventDefault();
    console.log('DailyPlanCreate 드롭 이벤트 발생, 일정:', dayIndex + 1);
    
    // 메모 모달 닫기
    setShowMemoModal(false);
    
    try {
      const placeData = e.dataTransfer.getData('text/plain');
      console.log('드롭된 데이터:', placeData);
      const place = JSON.parse(placeData);
      
      // 고유 ID 생성
      const newPlace = {
        ...place,
        id: `${place.id}-${Date.now()}` // 고유 ID 생성
      };
      
      setDailyPlans(prev => prev.map((day, index) => 
        index === dayIndex 
          ? { ...day, places: [...day.places, newPlace] }
          : day
      ));
      
      console.log('화이트보드에서 장소가 일정에 추가되었습니다:', place.name, '일정:', dayIndex + 1);
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  // 드래그 오버 시 시각적 피드백
  const handleDragOver = (e, dayIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // 드래그 오버된 일정 블록에 시각적 피드백 추가
    const target = e.currentTarget;
    target.classList.add('drag-over');
  };

  // 드래그 리브 시 시각적 피드백 제거
  const handleDragLeave = (e) => {
    const target = e.currentTarget;
    target.classList.remove('drag-over');
  };

  // 일정 내부에서 장소 드래그 시작
  const handlePlaceDragStart = (e, place, dayIndex, placeIndex) => {
    setDraggedPlaceId(place.id);
    setDraggedFromDay(dayIndex);
    setDraggedFromIndex(placeIndex);
    e.dataTransfer.setData('text/plain', JSON.stringify(place));
    e.dataTransfer.effectAllowed = 'move';
  };

  // 일정 내부에서 장소 드롭
  const handlePlaceDrop = (e, targetDayIndex, targetPlaceIndex) => {
    e.preventDefault();
    
    if (draggedPlaceId && draggedFromDay !== null && draggedFromIndex !== null) {
      setDailyPlans(prev => {
        const newPlans = [...prev];
        const draggedPlace = newPlans[draggedFromDay].places[draggedFromIndex];
        
        // 원래 위치에서 제거
        newPlans[draggedFromDay].places.splice(draggedFromIndex, 1);
        
        // 새 위치에 추가
        if (targetDayIndex === draggedFromDay) {
          // 같은 일정 내에서 순서 변경
          newPlans[targetDayIndex].places.splice(targetPlaceIndex, 0, draggedPlace);
        } else {
          // 다른 일정으로 이동
          newPlans[targetDayIndex].places.splice(targetPlaceIndex, 0, draggedPlace);
        }
        
        return newPlans;
      });
    }
    
    setDraggedPlaceId(null);
    setDraggedFromDay(null);
    setDraggedFromIndex(null);
  };

  // 장소 삭제
  const removePlace = (dayIndex, placeIndex) => {
    setDailyPlans(prev => prev.map((day, index) => 
      index === dayIndex 
        ? { ...day, places: day.places.filter((_, pIndex) => pIndex !== placeIndex) }
        : day
    ));
  };

  // 메모 업데이트
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

  // 메모 모달 열기
  const handleOpenMemoModal = (place, dayTitle, position) => {
    // 북마크 모달 닫기
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

  // 메모 저장
  const handleMemoSave = (memo) => {
    const { place, dayTitle } = memoModalData;
    const dayIndex = dailyPlans.findIndex(day => day.title === dayTitle);
    const placeIndex = dailyPlans[dayIndex]?.places.findIndex(p => p.id === place.id);
    
    if (dayIndex !== -1 && placeIndex !== -1) {
      updatePlaceMemo(dayIndex, placeIndex, memo);
    }
    
    setShowMemoModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="daily-plan-modal">
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
                    // 메모 모달이 열려있으면 북마크 모달 열지 않음
                    if (showMemoModal) {
                      return;
                    }
                    
                    // 클릭한 + 버튼의 위치 계산
                    const rect = e.currentTarget.getBoundingClientRect();
                    console.log('+ 버튼 위치:', rect);
                    
                    // 일정짜기 모달 기준으로 북마크 모달 위치 설정 (메모 모달과 같은 간격)
                    const dailyPlanLeft = 70;
                    const dailyPlanWidth = 330;
                    const dailyPlanRight = dailyPlanLeft + dailyPlanWidth;
                    
                    const modalPosition = { 
                      x: dailyPlanRight + 10, // 일정짜기 모달 오른쪽에서 10px 떨어진 위치 (메모 모달과 동일)
                      y: 90 // 일정짜기 모달과 같은 top 위치
                    };
                    console.log('북마크 모달 위치:', modalPosition);
                    
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
      
      {/* 북마크 모달 */}
      {showBookmarkModal && (
        <BookmarkModal
          isOpen={showBookmarkModal}
          onClose={() => {
            console.log('북마크 모달 닫기 호출됨');
            setShowBookmarkModal(false);
            setSelectedDayIndex(null);
          }}
          bookmarkedPlaces={bookmarkedPlaces}
          onPlaceSelect={addPlaceFromBookmark}
          position={bookmarkModalPosition}
        />
      )}

      {/* 메모 모달 */}
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
    </div>
  );
};

export default DailyPlanCreate;