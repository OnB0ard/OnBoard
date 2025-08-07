import React, { Fragment } from 'react';
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
  onPlaceDragEnd,
  // 드롭 존 핸들러들
  onDropZoneDragOver,
  onDropZoneDragLeave,
  onDropZoneDrop
}) => {
  const { isDragging: isPlaceDragging, draggedPlaceId, dragOverIndex, draggedFromDay } = dragState;

  // 일차 클릭 핸들러 (드래그와 구분)
  const handleDayClick = (e) => {
    // 드래그 중이면 무시
    if (isDragging) {
      return;
    }
    
    // title input과 버튼 클릭시 무시
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || 
        e.target.classList.contains('day-title-input') ||
        e.target.classList.contains('remove-day-button') ||
        e.target.classList.contains('add-place-button')) {
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
      onClick={handleDayClick}
      style={{ cursor: 'pointer' }}
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
        {/* 첫 번째 장소 위 드롭 존 */}
        {places.length > 0 && (
          <div 
            className="place-drop-zone place-drop-zone-top"
            onDragOver={(e) => onDropZoneDragOver(e, dayIndex, 0)}
            onDragLeave={onDropZoneDragLeave}
            onDrop={(e) => onDropZoneDrop(e, dayIndex, 0)}
          />
        )}
        
        {places.map((place, placeIndex) => (
          <Fragment key={place.id}>
            <DailyPlaceBlock
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
            
            {/* 각 장소 아래 드롭 존 */}
            <div 
              className="place-drop-zone place-drop-zone-between"
              onDragOver={(e) => onDropZoneDragOver(e, dayIndex, placeIndex + 1)}
              onDragLeave={onDropZoneDragLeave}
              onDrop={(e) => onDropZoneDrop(e, dayIndex, placeIndex + 1)}
            />
          </Fragment>
        ))}
        
        {/* 장소가 없을 때의 드롭 존 */}
        {places.length === 0 && (
          <div 
            className="place-drop-zone place-drop-zone-empty"
            onDragOver={(e) => onDropZoneDragOver(e, dayIndex, 0)}
            onDragLeave={onDropZoneDragLeave}
            onDrop={(e) => onDropZoneDrop(e, dayIndex, 0)}
          >
            <span className="drop-zone-hint">여기에 장소를 드래그하세요</span>
          </div>
        )}

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