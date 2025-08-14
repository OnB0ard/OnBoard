import React, { Fragment, useEffect, useState } from 'react';

import DailyPlaceBlock from './DailyPlaceBlock';
import { Button } from '../atoms/Button';
import Icon from '../atoms/Icon';

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

  // IME(한글 등) 조합 입력에서 버벅임 방지를 위한 로컬 상태
  const [title, setTitle] = useState(day.title || '');
  const [isComposing, setIsComposing] = useState(false);
  const MAX_TITLE_LEN = 15; // 일차 제목 최대 길이
  const [isCollapsed, setIsCollapsed] = useState(false); // 장소 리스트 접기/펼치기 상태

  // 외부 day.title 변경 시(다른 곳에서 수정되었을 때) 조합 중이 아니면 동기화
  useEffect(() => {
    if (!isComposing) {
      const synced = (day.title || '').slice(0, MAX_TITLE_LEN);
      setTitle(synced);
    }
  }, [day.title, isComposing]);

  // 어떤 경로로든 title이 15자를 넘으면 즉시 보정
  useEffect(() => {
    if ((title || '').length > MAX_TITLE_LEN) {
      setTitle((title || '').slice(0, MAX_TITLE_LEN));
    }
  }, [title]);

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
      style={{}}
    >
      <div className="day-header">
        <span className="day-title inline-block border border-gray-200 bg-gray-50 rounded-lg px-2 py-1 mr-2">
        <input
          type="text"
          value={title}
          maxLength={MAX_TITLE_LEN}
          onInput={(e) => {
            const v = (e.target.value || '').slice(0, MAX_TITLE_LEN);
            if (v !== title) setTitle(v);
          }}
          onKeyDown={(e) => {
            if (isComposing) return; // 조합 중에는 차단하지 않음
            const controlKey = e.ctrlKey || e.metaKey || e.altKey;
            const isNavOrEditKey = [
              'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'
            ].includes(e.key);
            if (!controlKey && !isNavOrEditKey && (title || '').length >= MAX_TITLE_LEN) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            const paste = (e.clipboardData?.getData('text') || '');
            if (!paste) return;
            const selectionStart = e.currentTarget.selectionStart ?? (title || '').length;
            const selectionEnd = e.currentTarget.selectionEnd ?? selectionStart;
            const current = title || '';
            const nextRaw = current.slice(0, selectionStart) + paste + current.slice(selectionEnd);
            const next = nextRaw.slice(0, MAX_TITLE_LEN);
            if (next !== nextRaw) {
              e.preventDefault();
              setTitle(next);
              if (!isComposing) {
                onUpdateTitle(day.id, next);
              }
            }
          }}
          onChange={(e) => {
            const newValue = (e.target.value || '').slice(0, MAX_TITLE_LEN);
            setTitle(newValue);
            if (!isComposing) {
              onUpdateTitle(day.id, newValue);
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionUpdate={(e) => {
            // 조합 중에도 표시값이 15자를 넘지 않도록 즉시 보정
            const composingValue = (e.target.value || '').slice(0, MAX_TITLE_LEN);
            if (composingValue !== title) {
              setTitle(composingValue);
            }
          }}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            const composedValue = (e.target.value || '').slice(0, MAX_TITLE_LEN);
            setTitle(composedValue);
            onUpdateTitle(day.id, composedValue);
          }}
          onBlur={() => {
            const finalValue = (title || '').slice(0, MAX_TITLE_LEN);
            if (finalValue !== day.title) {
              setTitle(finalValue);
              onUpdateTitle(day.id, finalValue);
            }
          }}
          className="day-title-input"
        />
        </span>
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="border-none bg-transparent rounded-md mr-2 cursor-pointer hover:bg-gray-100 focus:outline-none transition-colors inline-flex items-center justify-center w-11 h-11"
            style={{ marginLeft: 9 }}
            aria-label={isCollapsed ? '장소 목록 펼치기' : '장소 목록 접기'}
          >
            <img
              src="/images/arrow.png"
              alt={isCollapsed ? '펼치기 아이콘' : '접기 아이콘'}
              style={{
                width: 13,
                height: 12,
                transform: isCollapsed ? 'none' : 'scaleY(-1)',
                transition: 'transform 150ms ease-in-out'
              }}
            />
          </button>
          <button
            onClick={() => onDayClick(dayIndex)}
            className="border-none bg-transparent rounded-md mr-2 cursor-pointer hover:bg-gray-100 focus:outline-none transition-colors inline-flex items-center justify-center w-11 h-11"
            aria-label="일차 위치를 지도에서 보기"
          >
            <Icon type="map" />
          </button>
        <span>
        <button
          onClick={() => onRemoveDay(day.id)}
          className="remove-day-button"
        >
          삭제
        </button>
        </span>
      </div>
      {!isCollapsed && (
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
          북마크 열기
        </Button>
      </div>
      )}
    </div>
  );
};

export default DailyScheduleBlock;