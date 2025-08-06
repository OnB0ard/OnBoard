import React from 'react';
import DailyPlaceBlock from './DailyPlaceBlock';
import { Button } from '../atoms/Button';

const DailyScheduleBlock = ({
  day,
  dayIndex,
  isDragging,
  isSwapTarget,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDragLeave,
  onUpdateTitle,
  onRemoveDay,
  onAddPlaceClick,
  onDayClick, // 일차 클릭 핸들러 (지도 마커 표시용)
  places,
  onRemovePlace,
  onUpdatePlaceMemo,
  onOpenMemoModal,
  dragState, // 장소 드래그 상태
  onPlaceDragStart,
  onPlaceDragOver,
  onPlaceDragLeave,
  onPlaceDrop,
  onPlaceDragEnd
}) => {
  const { isDragging: isPlaceDragging, draggedPlaceId, dragOverIndex, draggedFromDay } = dragState;

  // 일차 클릭 핸들러 (드래그와 구분)
  const handleDayClick = (e) => {
    // 드래그 중이거나 input 요소 클릭시 무시
    if (isDragging || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
      return;
    }
    
    // 이벤트 버블링 방지
    e.stopPropagation();
    
    if (onDayClick) {
      onDayClick(dayIndex);
    }
  };

  return (
    <div
      className={`daily-plan-block ${
        isDragging ? 'dragging' : ''
      } ${
        isSwapTarget ? 'drag-over-day' : ''
      }`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={(e) => onDragOver(e, dayIndex)}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
    >
      <div className="day-header" onClick={handleDayClick} style={{ cursor: 'pointer' }}>
        <input
          type="text"
          value={day.title}
          onChange={(e) => onUpdateTitle(day.id, e.target.value)}
          className="day-title-input"
        />
        <button
          onClick={() => onRemoveDay(day.id)}
          className="remove-day-button"
        >
          삭제
        </button>
      </div>

      <div className="places-container">
        {places.map((place, placeIndex) => (
          <DailyPlaceBlock
            key={place.id}
            place={place}
            dayIndex={dayIndex}
            placeIndex={placeIndex}
            isDragging={isPlaceDragging && draggedPlaceId === place.id}
            dragOverIndex={dragOverIndex}
            isSwapTarget={dragState.swapTargetPlaceIndex === placeIndex}
            onDragStart={onPlaceDragStart}
            onDragOver={onPlaceDragOver}
            onDragLeave={onPlaceDragLeave}
            onDrop={onPlaceDrop}
            onDragEnd={onPlaceDragEnd}
            onRemove={() => onRemovePlace(dayIndex, placeIndex)}
            onUpdateMemo={(memo) => onUpdatePlaceMemo(dayIndex, placeIndex, memo)}
            dayTitle={day.title}
            onOpenMemoModal={onOpenMemoModal}
          />
        ))}

        <Button
          className="add-place-button"
          onClick={(e) => onAddPlaceClick(e, dayIndex)}
        >
          +
        </Button>
      </div>
    </div>
  );
};

export default DailyScheduleBlock;