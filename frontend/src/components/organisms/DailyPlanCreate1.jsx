import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DailyScheduleBlock from './DailyScheduleBlock';
import BookmarkModal from './BookmarkModal';
import PlanMemoModal from './PlanMemoModal';
import { Button } from '../atoms/Button';
import useDailyPlanStore from '../../stores/useDailyPlanStore';
import useMapStore from '../../store/useMapStore';
import './DailyPlanCreate1.css';

const DailyPlanCreate1 = ({ isOpen, onClose, bookmarkedPlaces = [], position, planId }) => {
  const modalRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  
  // Zustand 스토어에서 상태와 액션들 가져오기
  const {
    // 상태
    dailyPlans,
    showBookmarkModal,
    selectedDayIndex,
    bookmarkModalPosition,
    showMemoModal,
    memoModalData,
    draggedPlaceId,
    draggedFromDay,
    draggedFromIndex,
    isDragging,
    dragOverIndex,
    draggedDayIndex,
    swapTargetDayIndex,
    swapTargetPlaceIndex,
    selectedDayForMap,
    showDayMarkersOnMap,
    
    // 액션
    setPlanId,
    addDailyPlan,
    removeDailyPlan,
    updateDayTitle,
    reorderDailyPlans,
    swapDailyPlans,
    addPlaceToDay,
    removePlace,
    updatePlaceMemo,
    reorderPlaces,
    swapPlaces,
    setDayDragState,
    setPlaceDragState,
    setDragOverIndex,
    clearDragState,
    openBookmarkModal,
    closeBookmarkModal,
    openMemoModal,
    closeMemoModal,
    resetStore,
    setDraggedDayIndex,
    setDraggedPlaceId,
    setDraggedFromDay,
    setSwapTargetDayIndex,
    setSwapTargetPlaceIndex,
    memoModalOpen,
    setMemoModalOpen,
    selectedPlace,
    setSelectedPlace,
    toggleDayMarkersOnMap,
    clearDayMarkersFromMap
  } = useDailyPlanStore();

  // 지도 스토어에서 일차별 마커 액션들 가져오기
  const { setDayMarkers, clearDayMarkers } = useMapStore();

  // planId가 변경될 때 스토어에 설정
  useEffect(() => {
    if (planId) {
      setPlanId(planId);
      console.log('📋 planId 설정됨:', planId);
    }
  }, [planId, setPlanId]);

  useEffect(() => {
    if (!isOpen) {
      closeBookmarkModal();
      closeMemoModal();
    }
  }, [isOpen, closeBookmarkModal, closeMemoModal]);

  // === 자동 스크롤 기능 ===
  const startAutoScroll = (direction, speed = 1) => {
    if (autoScrollIntervalRef.current) return; // 이미 스크롤 중이면 무시
    
    autoScrollIntervalRef.current = setInterval(() => {
      if (!scrollContainerRef.current) return;
      
      const scrollAmount = direction === 'up' ? -5 * speed : 5 * speed;
      scrollContainerRef.current.scrollTop += scrollAmount;
    }, 16); // 60fps로 부드러운 스크롤
  };

  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleAutoScroll = (e) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY;
    const scrollZone = 50; // 상단/하단 50px 영역에서 스크롤 트리거
    
    // 상단 스크롤 영역
    if (mouseY < rect.top + scrollZone) {
      const distance = rect.top + scrollZone - mouseY;
      const speed = Math.min(distance / scrollZone * 3, 3); // 최대 3배속
      startAutoScroll('up', speed);
    }
    // 하단 스크롤 영역
    else if (mouseY > rect.bottom - scrollZone) {
      const distance = mouseY - (rect.bottom - scrollZone);
      const speed = Math.min(distance / scrollZone * 3, 3); // 최대 3배속
      startAutoScroll('down', speed);
    }
    // 스크롤 영역 밖
    else {
      stopAutoScroll();
    }
  };

  // normalizePlaceData는 이제 스토어에서 제공됨

  // --- Day Drag & Drop 핸들러 ---
  const handleDayDragStart = (e, dayIndex) => {
    console.log('일차 드래그 시작:', dayIndex);
    setDayDragState(dayIndex);
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'day', dayIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDayDragOver = (e, dayIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 교환 대상 포커스 효과
    if (draggedDayIndex !== null && draggedDayIndex !== dayIndex) {
      setSwapTargetDayIndex(dayIndex);
    }
    
    // 자동 스크롤 처리
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY;
      const scrollThreshold = 50;
      
      // 상단 경계 근처에서 위로 스크롤
      if (mouseY - rect.top < scrollThreshold) {
        const distance = scrollThreshold - (mouseY - rect.top);
        const speed = Math.min(distance / scrollThreshold * 3, 3);
        
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            container.scrollTop -= speed;
          }, 16);
        }
      }
      // 하단 경계 근처에서 아래로 스크롤
      else if (rect.bottom - mouseY < scrollThreshold) {
        const distance = scrollThreshold - (rect.bottom - mouseY);
        const speed = Math.min(distance / scrollThreshold * 3, 3);
        
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            container.scrollTop += speed;
          }, 16);
        }
      }
      // 경계 밖에서는 자동 스크롤 중지
      else {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
      }
    }
  };

  const handleDayDrop = (e, dayIndex) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('일차 드롭 이벤트:', { dayIndex });
    
    // 자동 스크롤 중지
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    // 먼저 JSON 데이터 확인 (일차 드래그)
    const dragDataString = e.dataTransfer.getData('application/json');
    if (dragDataString) {
      const dragData = JSON.parse(dragDataString);
      console.log('드래그 데이터 (JSON):', dragData);
      
      if (dragData.type === 'day') {
        // 일차 위치 교환 로직
        console.log('일차 드롭 감지:', { from: draggedDayIndex, to: dayIndex });
        if (draggedDayIndex === null || draggedDayIndex === dayIndex) {
          console.log('일차 드롭 취소: 같은 위치이거나 유효하지 않은 드래그');
          return;
        }
        
        console.log('일차 위치 교환 실행:', { from: draggedDayIndex, to: dayIndex });
        swapDailyPlans(draggedDayIndex, dayIndex);
        clearDragState();
        return;
      }
    }
    
    // 화이트보드에서 장소 드래그 처리 (text/plain)
    const placeDataString = e.dataTransfer.getData('text/plain');
    if (placeDataString) {
      try {
        const place = JSON.parse(placeDataString);
        console.log('화이트보드에서 장소 드롭:', place);
        console.log('일차에 장소 추가:', { dayIndex, place });
        addPlaceToDay(dayIndex, place);
        return;
      } catch (error) {
        console.error('장소 데이터 파싱 오류:', error);
      }
    }
    
    console.log('처리 가능한 드래그 데이터가 없음');
  };

  const handleDayDragEnd = (e) => {
    console.log('일차 드래그 종료');
    e.stopPropagation();
    
    // 시각적 피드백 초기화
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.daily-plan-block').forEach(block => {
      block.classList.remove('drag-over-day');
      block.style.opacity = '1';
    });
    
    // 자동 스크롤 중단
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    clearDragState();
  };



  const handleDayDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 교환 대상 포커스 해제
    setSwapTargetDayIndex(null);
    
    // 드래그 오버 시각적 피드백 제거
    e.currentTarget.classList.remove('drag-over-day');
  };

  // --- Place Drag & Drop 핸들러 ---
  const handlePlaceDragStart = (e, place, dayIndex, placeIndex) => {
    // 이벤트 버블링 방지
    e.stopPropagation();
    
    console.log('장소 드래그 시작:', { place: place.name, dayIndex, placeIndex });
    console.log('드래그 상태 설정 전:', { draggedPlaceId, draggedFromDay, draggedFromIndex });
    
    setPlaceDragState(true, place.id, dayIndex, placeIndex);
    
    console.log('드래그 상태 설정 후:', { 
      isDragging: true, 
      draggedPlaceId: place.id, 
      draggedFromDay: dayIndex, 
      draggedFromIndex: placeIndex 
    });
    
    // dataTransfer 설정 강화
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
    
    // 장소 드래그 데이터 설정
    const placeData = {
      type: 'place',
      place: place,
      dayIndex: dayIndex,
      placeIndex: placeIndex
    };
    
    console.log('설정하는 드래그 데이터:', placeData);
    
    // 다양한 형식으로 데이터 설정
    e.dataTransfer.setData('application/json', JSON.stringify(placeData));
    e.dataTransfer.setData('text/plain', JSON.stringify(placeData));
    e.dataTransfer.setData('text/place-drag', JSON.stringify(placeData));
    
    // CSS 클래스로 시각적 피드백 적용
    e.currentTarget.classList.add('dragging');
    
    // 드래그 중 마우스 이동 이벤트 리스너 추가
    document.addEventListener('dragover', handleAutoScroll);
  };

  const handlePlaceDragOver = (e, dayIndex, placeIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('드래그 오버 호출:', { 
      draggedPlaceId, 
      isDragging, 
      targetDay: dayIndex, 
      targetPlace: placeIndex 
    });
    
    // 장소 드래그 중인지 확인
    if (draggedPlaceId) {
      console.log('장소 드래그 오버 상세:', { 
        targetDay: dayIndex, 
        targetPlace: placeIndex, 
        draggedFromDay, 
        draggedFromIndex,
        조건검사: draggedFromDay !== dayIndex || draggedFromIndex !== placeIndex
      });
      
      // 다른 장소 위에 드래그할 때만 포커스 효과 적용
      if (draggedFromDay !== dayIndex || draggedFromIndex !== placeIndex) {
        console.log('포커스 효과 적용:', placeIndex);
        setSwapTargetPlaceIndex(placeIndex);
        setDragOverIndex(placeIndex);
        e.currentTarget.classList.add('drag-over-place');
      } else {
        console.log('같은 장소로 드래그 - 포커스 효과 없음');
      }
    } else {
      console.log('드래그 중인 장소가 없음');
    }
  };

  const handlePlaceDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 교환 대상 포커스 해제
    setSwapTargetPlaceIndex(null);
    
    e.currentTarget.classList.remove('drag-over-place');
    setDragOverIndex(null);
  };

  const handlePlaceDrop = (e, targetDayIndex, targetPlaceIndex) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== 장소 드롭 이벤트 시작 ===');
    console.log('드롭 대상:', { targetDayIndex, targetPlaceIndex });
    console.log('현재 드래그 상태:', { draggedPlaceId, draggedFromDay, draggedFromIndex });

    // 다양한 형식으로 드래그 데이터 확인
    let dragDataString = e.dataTransfer.getData('application/json');
    console.log('드래그 데이터 (application/json):', dragDataString);
    
    if (!dragDataString) {
      dragDataString = e.dataTransfer.getData('text/place-drag');
      console.log('드래그 데이터 (text/place-drag):', dragDataString);
    }
    
    if (!dragDataString) {
      dragDataString = e.dataTransfer.getData('text/plain');
      console.log('드래그 데이터 (text/plain):', dragDataString);
    }
    
    if (!dragDataString) {
      console.log('❌ 모든 형식에서 드래그 데이터 없음 - 종료');
      return;
    }

    const dragData = JSON.parse(dragDataString);
    console.log('파싱된 드래그 데이터:', dragData);

    if (dragData.type !== 'place') {
      console.log('❌ 장소 드래그가 아님 - 종료');
      return;
    }

    const { dayIndex: sourceDayIndex, placeIndex: sourcePlaceIndex } = dragData;
    console.log('✅ 장소 교환 준비:', { 
      from: { day: sourceDayIndex, place: sourcePlaceIndex }, 
      to: { day: targetDayIndex, place: targetPlaceIndex } 
    });
    
    if (sourceDayIndex === targetDayIndex && sourcePlaceIndex === targetPlaceIndex) {
      console.log('❌ 같은 위치로 드롭 - 취소');
      handlePlaceDragEnd(e);
      return;
    }

    console.log('🔄 장소 위치 교환 실행 시작!');
    
    try {
      swapPlaces(sourceDayIndex, sourcePlaceIndex, targetDayIndex, targetPlaceIndex);
      console.log('✅ 장소 교환 성공!');
    } catch (error) {
      console.error('❌ 장소 교환 오류:', error);
    }

    handlePlaceDragEnd(e);
  };

  const handlePlaceDragEnd = (e) => {
    console.log('장소 드래그 종료');
    e.preventDefault();
    e.stopPropagation();
    
    // CSS 클래스로 시각적 피드백 초기화
    if (e.currentTarget) {
      e.currentTarget.classList.remove('dragging');
    }
    
    // 모든 장소 아이템 스타일 초기화
    document.querySelectorAll('.daily-place-block').forEach(item => {
      item.classList.remove('dragging', 'drag-over-place', 'swap-target');
    });
    
    // 자동 스크롤 중단 및 이벤트 리스너 제거
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    document.removeEventListener('dragover', handleAutoScroll);
    
    // 드래그 상태 초기화
    clearDragState();
  };

  // --- 모달 관련 핸들러 ---
  const handleAddPlaceClick = (e, dayIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    };
    openBookmarkModal(dayIndex, position);
  };

  const handleOpenBookmarkModal = (e, dayIndex) => {
    if (showMemoModal) return;
    const rect = e.currentTarget.getBoundingClientRect();
    openBookmarkModal(dayIndex, { x: rect.right + 10, y: rect.top });
  };

  const addPlaceFromBookmark = (place) => {
    if (selectedDayIndex === null) return;
    addPlaceToDay(selectedDayIndex, place);
    closeBookmarkModal();
  };

  const handleOpenMemoModal = (place, dayTitle, position) => {
    closeBookmarkModal();
    openMemoModal(place, dayTitle, place.memo || '', position);
  };

  const handleMemoSave = (memo) => {
    const { place, dayTitle } = memoModalData;
    const dayIndex = dailyPlans.findIndex(day => day.title === dayTitle);
    const placeIndex = dailyPlans[dayIndex]?.places.findIndex(p => p.id === place.id);
    if (dayIndex !== -1 && placeIndex !== -1) {
      updatePlaceMemo(dayIndex, placeIndex, memo);
    }
    closeMemoModal();
  };

  // === 지도 마커 핸들러 ===
  const handleDayClick = (dayIndex) => {
    console.log('🗺️ 일차 클릭 - 지도 마커 토글:', { dayIndex, selectedDayForMap, showDayMarkersOnMap });
    
    // 일차 선택 상태 토글
    toggleDayMarkersOnMap(dayIndex);
    
    // 선택된 일차의 장소 정보 가져오기
    const selectedDay = dailyPlans[dayIndex];
    
    if (selectedDay && selectedDay.places && selectedDay.places.length > 0) {
      console.log('📍 표시할 장소들:', selectedDay.places.map(place => ({
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        primaryCategory: place.primaryCategory
      })));
      
      // 같은 일차를 다시 클릭하면 마커 숨기기
      if (selectedDayForMap === dayIndex && showDayMarkersOnMap) {
        console.log('🙈 같은 일차 재클릭 - 마커 숨김');
        clearDayMarkers();
      } else {
        console.log('🗺️ 지도에 일차 마커 표시');
        // 지도에 일차별 마커 표시
        setDayMarkers(selectedDay.places, dayIndex);
      }
    } else {
      console.log('😕 해당 일차에 장소가 없음');
      // 장소가 없으면 마커 숨김
      clearDayMarkers();
    }
  };

  if (!isOpen) return null;

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
        
        <div className="daily-plan-body" ref={scrollContainerRef}>
          {dailyPlans.map((day, dayIndex) => (
          <DailyScheduleBlock
            key={day.id}
            day={day}
            dayIndex={dayIndex}
            isDragging={draggedDayIndex === dayIndex}
            isSwapTarget={swapTargetDayIndex === dayIndex}
            draggable={true}
            onDragStart={(e) => handleDayDragStart(e, dayIndex)}
            onDragOver={handleDayDragOver}
            onDrop={(e) => handleDayDrop(e, dayIndex)}
            onDragEnd={handleDayDragEnd}
            onDragLeave={handleDayDragLeave}
            onUpdateTitle={updateDayTitle}
            onRemoveDay={removeDailyPlan}
            onAddPlaceClick={handleAddPlaceClick}
            onDayClick={handleDayClick}
            places={day.places || []}
            onRemovePlace={removePlace}
            onUpdatePlaceMemo={updatePlaceMemo}
            onOpenMemoModal={handleOpenMemoModal}
            dragState={{
              isDragging,
              draggedPlaceId,
              dragOverIndex,
              draggedFromDay,
              swapTargetPlaceIndex
            }}
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
          onClose={closeBookmarkModal}
          bookmarkedPlaces={bookmarkedPlaces}
          onPlaceSelect={addPlaceFromBookmark}
          position={bookmarkModalPosition}
        />
      )}

      {showMemoModal && (
        <PlanMemoModal
          isOpen={showMemoModal}
          onClose={closeMemoModal}
          memo={memoModalData.memo}
          onSave={handleMemoSave}
          placeName={memoModalData.place?.name}
          dayTitle={memoModalData.dayTitle}
          position={memoModalData.position}
        />
      )}
    </div>,
    document.body
  );
};

export default DailyPlanCreate1;