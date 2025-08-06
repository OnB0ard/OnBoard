import React from 'react';
import DailyPlaceBlock from './DailyPlaceBlock';
import { Button } from '../atoms/Button';

// 이 컴포넌트는 단일 '일차'의 UI와 인터랙션을 담당합니다.
// 부모로부터 필요한 모든 데이터와 이벤트 핸들러를 props로 전달받습니다.
const DailyScheduleBlock = ({
  day,
  dayIndex,
  onUpdateTitle,
  onRemoveDay,
  onAddPlaceClick,
  onDayDrop,
  onDayDragOver,
  onDayDragLeave,
  // Place 관련 props
  places,
  onRemovePlace,
  onUpdatePlaceMemo,
  onOpenMemoModal,
  // Place Drag & Drop 관련 props
  dragState,
  onPlaceDragStart,
  onPlaceDragOver,
  onPlaceDragLeave,
  onPlaceDrop,
  onPlaceDragEnd
}) => {
  const { isDragging, draggedPlaceId, dragOverIndex, draggedFromDay } = dragState;

  return (
    <div
      className="daily-plan-block"
      onDragOver={(e) => onDayDragOver(e, dayIndex)}
      onDragLeave={onDayDragLeave}
      onDrop={(e) => onDayDrop(e, dayIndex)}
    >
      <div className="day-header">
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
          <div
            key={place.id}
            className="place-item"
            draggable="true"
            data-dragging={isDragging && draggedPlaceId === place.id}
            data-drop-target={isDragging && dragOverIndex === placeIndex && draggedFromDay === dayIndex}
            onDragStart={(e) => onPlaceDragStart(e, place, dayIndex, placeIndex)}
            onDragOver={(e) => onPlaceDragOver(e, dayIndex, placeIndex)}
            onDragLeave={onPlaceDragLeave}
            onDragEnd={onPlaceDragEnd}
            onDrop={(e) => onPlaceDrop(e, dayIndex, placeIndex)}
          >
            <DailyPlaceBlock
              place={place}
              onRemove={() => onRemovePlace(dayIndex, placeIndex)}
              onEdit={() => {}}
              onMemoUpdate={(memo) => onUpdatePlaceMemo(dayIndex, placeIndex, memo)}
              dayTitle={day.title}
              onOpenMemoModal={onOpenMemoModal}
            />
          </div>
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