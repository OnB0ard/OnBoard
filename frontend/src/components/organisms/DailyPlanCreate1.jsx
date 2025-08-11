import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import DailyScheduleBlock from './DailyScheduleBlock';
import BookmarkModal from './BookmarkModal';
import PlanMemoModal from './PlanMemoModal';
import { Button } from '../atoms/Button';
import useDailyPlanStore from '../../store/useDailyPlanStore';
import { useDayMarkersStore } from '../../store/mapStore';
import { savePlanSchedule, getPlanSchedule } from '../../apis/planSchedule';
import { useStompSchedule } from '../../hooks/useStompSchedule';
import './DailyPlanCreate1.css';

const DailyPlanCreate1 = ({ isOpen, onClose, bookmarkedPlaces = [], position, planId }) => {
  const modalRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const lastLoadedPlanIdRef = useRef(null);
  const saveCacheTimeoutRef = useRef(null);
  
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
    setDailyPlans,
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
    toggleDayMarkersOnMap
  } = useDailyPlanStore();

  // 지도 스토어에서 일차별 마커 액션들 가져오기
  const { setDayMarkers, clearDayMarkers } = useDayMarkersStore();
  // WebSocket 연결 설정 (화이트보드와 동일한 구조)
  const { sendMessage, connectionStatus, myUuid } = useStompSchedule({
    planId,
    onMessage: (msg) => {
      const { type, payload, uuid } = msg;

      console.log('실시간 일정 업데이트 수신:', msg);

      // 내가 보낸 메시지는 무시 (로컬에 이미 반영됨)
      if (uuid === myUuid) return;

      switch (type) {
        case 'PLAN_UPDATED':
          console.log('전체 일정 업데이트 수신');
          break;
        case 'PLACE_ADDED':
          addPlaceToDay(payload.dayIndex, payload.place, payload.insertIndex);
          break;
        case 'PLACE_REMOVED':
          removePlace(payload.dayIndex, payload.placeIndex);
          break;
        case 'PLACE_MOVED':
          reorderPlaces(
            payload.fromDayIndex,
            payload.fromPlaceIndex,
            payload.toDayIndex,
            payload.toPlaceIndex
          );
          break;
        case 'DAY_ADDED':
          addDailyPlan();
          break;
        case 'DAY_REMOVED':
          removeDailyPlan(payload.dayId);
          break;
        case 'DAY_REORDERED':
          reorderDailyPlans(payload.fromIndex, payload.toIndex);
          break;
        default:
          console.warn('알 수 없는 메시지 타입:', type);
      }
    }
  });



  // planId가 "실제로 변경될 때만" 초기화/로드 수행
  useEffect(() => {
    if (!planId) return;
    if (lastLoadedPlanIdRef.current === planId) {
      // 같은 방이면 재초기화/재로드 금지
      return;
    }
    setPlanId(planId);
    console.log('📋 planId 변경 감지 및 로드:', planId);
    clearDayMarkers();
    // 1) 로컬 캐시 우선 로드
    try {
      const cached = localStorage.getItem(`plan-schedules:${planId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setDailyPlans(parsed);
          console.log('🗂️ 로컬 캐시 일정 로드 완료');
        }
      }
    } catch (e) {
      console.warn('로컬 캐시 로드 실패:', e);
    }
    // 2) 서버 일정 불러오기 (새 방에서만)
    loadPlanSchedule(/*isPlanChange*/ true);
    lastLoadedPlanIdRef.current = planId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, setPlanId]);

  // 기존 일정 불러오기 함수
  const loadPlanSchedule = async (isPlanChange = false) => {
    try {
      console.log('📅 기존 일정 불러오기 시작:', planId);
      // 이미 로컬에 일정이 있고 동일 방이라면 로드를 생략하여 플리커/초기화 방지
      if (!isPlanChange && dailyPlans && dailyPlans.length > 0) {
        console.log('⏭️ 로컬 일정이 있어 서버 로드를 건너뜀');
        return;
      }
      const scheduleData = await getPlanSchedule(planId);
      
    if (scheduleData && Array.isArray(scheduleData.schedules) && scheduleData.schedules.length > 0) {
        // 백엔드 데이터를 프론트엔드 형식으로 변환
        const convertedPlans = scheduleData.schedules.map((schedule, index) => ({
          id: Date.now() + index,
          title: schedule.title || `${schedule.day}일차`,
                     places: schedule.places.map((place, placeIndex) => {
             // 서버에서 받은 장소 데이터 로깅
             console.log(`🔍 서버에서 받은 장소 ${placeIndex}:`, {
               name: place.placeName,
               imageUrl: place.imageUrl,
               googleImg: place.googleImg,
               photos: place.photos,
               originalData: place
             });
             
             // 이미지 URL 처리 - 다양한 소스에서 가져오기
             let imageUrl = place.imageUrl;
             
             // 1. googleImg 배열 확인
             if (!imageUrl && place.googleImg && Array.isArray(place.googleImg) && place.googleImg[0]) {
               imageUrl = place.googleImg[0];
               console.log(`📸 googleImg에서 이미지 URL 찾음:`, imageUrl);
             }
             
             // 2. photos 배열 확인
             if (!imageUrl && place.photos && Array.isArray(place.photos) && place.photos[0]) {
               const photo = place.photos[0];
               if (typeof photo.getUrl === 'function') {
                 try {
                   imageUrl = photo.getUrl({ maxWidth: 100, maxHeight: 100 });
                   console.log(`📸 photos.getUrl()에서 이미지 URL 찾음:`, imageUrl);
                 } catch (error) {
                   console.warn('Photo getUrl 오류:', error);
                 }
               } else if (typeof photo.getURI === 'function') {
                 try {
                   imageUrl = photo.getURI();
                   console.log(`📸 photos.getURI()에서 이미지 URL 찾음:`, imageUrl);
                 } catch (error) {
                   console.warn('Photo getURI 오류:', error);
                 }
               } else if (typeof photo === 'string') {
                 imageUrl = photo;
                 console.log(`📸 photos 문자열에서 이미지 URL 찾음:`, imageUrl);
               } else if (photo && (photo.url || photo.src || photo.imageUrl)) {
                 imageUrl = photo.url || photo.src || photo.imageUrl;
                 console.log(`📸 photos 객체에서 이미지 URL 찾음:`, imageUrl);
               }
             }
             
             // 3. originalData에서도 확인
             if (!imageUrl && place.originalData) {
               const original = place.originalData;
               if (original.imageUrl) {
                 imageUrl = original.imageUrl;
                 console.log(`📸 originalData.imageUrl에서 이미지 URL 찾음:`, imageUrl);
               } else if (original.googleImg && Array.isArray(original.googleImg) && original.googleImg[0]) {
                 imageUrl = original.googleImg[0];
                 console.log(`📸 originalData.googleImg에서 이미지 URL 찾음:`, imageUrl);
               } else if (original.photos && Array.isArray(original.photos) && original.photos[0]) {
                 const photo = original.photos[0];
                 if (typeof photo === 'string') {
                   imageUrl = photo;
                   console.log(`📸 originalData.photos 문자열에서 이미지 URL 찾음:`, imageUrl);
                 } else if (photo && (photo.url || photo.src || photo.imageUrl)) {
                   imageUrl = photo.url || photo.src || photo.imageUrl;
                   console.log(`📸 originalData.photos 객체에서 이미지 URL 찾음:`, imageUrl);
                 }
               }
             }
             
             console.log(`🎯 최종 이미지 URL:`, imageUrl);
            
            return {
              id: `${place.googlePlaceId}-${Date.now()}-${placeIndex}`,
              name: place.placeName,
              address: place.address,
              latitude: place.latitude,
              longitude: place.longitude,
              rating: place.rating,
              ratingCount: place.ratingCount,
              imageUrl: imageUrl,
              phoneNumber: place.phoneNumber,
              placeUrl: place.placeUrl,
              siteUrl: place.siteUrl,
              primaryCategory: place.category,
              memo: place.memo || '',
              originalData: place
            };
          })
        }));
        
        // 스토어에 일정 설정
        setDailyPlans(convertedPlans);
        console.log('✅ 기존 일정 불러오기 완료:', convertedPlans);
        // 서버 일정 도착 시 캐시 갱신
        try {
          localStorage.setItem(`plan-schedules:${planId}`, JSON.stringify(convertedPlans));
        } catch (e) {
          console.warn('서버 일정 캐시 저장 실패:', e);
        }
    } else if (isPlanChange) {
      // 방이 바뀐 경우에만 빈 일정으로 초기화
      // setDailyPlans([]);
      // console.log('ℹ️ 해당 방에 저장된 일정 없음. 빈 일정으로 초기화');
    } else {
      console.log('ℹ️ 서버 일정 없음이지만 동일 방이므로 현재 로컬 상태 유지');
    }
    } catch (error) {
      console.error('❌ 기존 일정 불러오기 실패:', error);
      // 에러가 발생해도 빈 일정으로 시작
    }
  };

  // 일정 자동 저장 함수
  const autoSavePlanSchedule = async () => {
    try {
      if (dailyPlans.length > 0) {
        console.log('💾 일정 자동 저장 시작');
        await savePlanSchedule(planId, dailyPlans);
        console.log('✅ 일정 자동 저장 완료');
        
        // WebSocket으로도 전체 일정 업데이트 알림
        sendMessage('PLAN_SAVED', {
          planId,
          dailyPlans
        });
      }
    } catch (error) {
      console.error('❌ 일정 자동 저장 실패:', error);
    }
  };

  // 일정이 변경될 때마다 자동 저장 (디바운스 적용)
  useEffect(() => {
    if (!planId || dailyPlans.length === 0) return;
    
    const saveTimeout = setTimeout(() => {
      autoSavePlanSchedule();
    }, 2000); // 2초 후 저장
    
    return () => clearTimeout(saveTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyPlans, planId]);

  // 로컬 캐시에 항상 최신 일정 저장 (가벼운 디바운스)
  useEffect(() => {
    if (!planId) return;
    if (saveCacheTimeoutRef.current) clearTimeout(saveCacheTimeoutRef.current);
    saveCacheTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`plan-schedules:${planId}`, JSON.stringify(dailyPlans));
      } catch (e) {
        console.warn('캐시 저장 실패:', e);
      }
    }, 400);
    return () => {
      if (saveCacheTimeoutRef.current) clearTimeout(saveCacheTimeoutRef.current);
    };
  }, [dailyPlans, planId]);

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
    
    // 마우스 위치에 따른 상단/하단 구분
    if (draggedDayIndex !== null && draggedDayIndex !== dayIndex) {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const mouseY = e.clientY;
      const blockCenter = rect.top + rect.height / 2;
      
      // 마우스가 블록 상반부에 있으면 상단 삽입, 하반부에 있으면 하단 삽입
      const isTopHalf = mouseY < blockCenter;
      
      // 드롭 위치 정보를 스토어에 저장
      setSwapTargetDayIndex(dayIndex);
      
      // 상단/하단 정보를 DOM에 데이터 속성으로 추가
      target.setAttribute('data-drop-position', isTopHalf ? 'top' : 'bottom');
      
      console.log(`드래그 오버: 일차 ${dayIndex}, 위치: ${isTopHalf ? '상단' : '하단'}`);
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
    
    const handleDayDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 드롭 위치 데이터 속성 정리
      const target = e.currentTarget;
      target.removeAttribute('data-drop-position');
      
      // 자동 스크롤 중지
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
    
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
        
        // 드롭 위치에 따른 인덱스 조정
        const target = e.currentTarget;
        const dropPosition = target.getAttribute('data-drop-position');
        let targetIndex = dayIndex;
        
        // 하단에 드롭하는 경우 인덱스를 1 증가
        if (dropPosition === 'bottom') {
          targetIndex = dayIndex + 1;
        }
        
        console.log('일차 위치 이동 실행:', { 
          from: draggedDayIndex, 
          to: dayIndex, 
          position: dropPosition,
          finalIndex: targetIndex 
        });
        
        reorderDailyPlans(draggedDayIndex, targetIndex);
        
        // WebSocket으로 일정 순서 변경 알림
        sendMessage('DAY_REORDERED', {
          fromIndex: draggedDayIndex,
          toIndex: targetIndex
        });
        
        clearDragState();
        return;
      }
    }
    
    // 화이트보드에서 장소 드래그 처리 (text/plain)
    const placeDataString = e.dataTransfer.getData('text/plain');
    if (placeDataString) {
      try {
        const dragData = JSON.parse(placeDataString);
        console.log('텍스트 드래그 데이터:', dragData);
        
        // 페이지 PlaceBlock 타입인 경우 처리 거부 (드롭 존에서만 처리해야 함)
        if (dragData.type === 'page-place') {
          console.log('⚠️ 페이지 PlaceBlock은 드롭 존에서만 처리 가능 - 일차 드롭 무시');
          return;
        }
        
        // 기존 화이트보드 장소 처리 (타입이 없는 경우)
        if (!dragData.type && (dragData.placeName || dragData.name)) {
          console.log('화이트보드에서 장소 드롭:', dragData);
          console.log('일차에 장소 추가:', { dayIndex, place: dragData });
          addPlaceToDay(dayIndex, dragData);
          return;
        }
        
        console.log('⚠️ 지원되지 않는 텍스트 드래그 데이터:', dragData);
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
    
    // 드롭 위치 데이터 속성 정리
    const target = e.currentTarget;
    target.removeAttribute('data-drop-position');
    
    // 교환 대상 포커스 해제
    setSwapTargetDayIndex(null);
    
    // 드래그 오버 시각적 피드백 제거
    target.classList.remove('drag-over-day');
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
        // 마우스 위치에 따른 상단/하단 구분
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const mouseY = e.clientY;
        const blockCenter = rect.top + rect.height / 2;
        
        // 마우스가 블록 상반부에 있으면 상단 삽입, 하반부에 있으면 하단 삽입
        const isTopHalf = mouseY < blockCenter;
        
        console.log('포커스 효과 적용:', { placeIndex, position: isTopHalf ? '상단' : '하단' });
        
        setSwapTargetPlaceIndex(placeIndex);
        setDragOverIndex(placeIndex);
        
        // 상단/하단 정보를 DOM에 데이터 속성으로 추가
        target.setAttribute('data-drop-position', isTopHalf ? 'top' : 'bottom');
        target.classList.add('drag-over-place');
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
    
    // 드롭 위치 데이터 속성 정리
    const target = e.currentTarget;
    target.removeAttribute('data-drop-position');
    
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

    // 1. 북마크에서 드래그한 장소 처리
    if (dragData.type === 'bookmark-place') {
      console.log('📌 북마크 장소 드롭 처리');
      
      // 드롭 위치에 따른 인덱스 조정
      const target = e.currentTarget;
      const dropPosition = target.getAttribute('data-drop-position');
      let insertIndex = targetPlaceIndex;
      
      // 하단에 드롭하는 경우 인덱스를 1 증가
      if (dropPosition === 'bottom') {
        insertIndex = targetPlaceIndex + 1;
      }
      
      console.log('🎯 북마크 장소 삽입:', {
        place: dragData.place.name,
        dayIndex: targetDayIndex,
        insertIndex,
        position: dropPosition
      });
      
      // 지정된 위치에 장소 추가
      addPlaceToDay(targetDayIndex, dragData.place, insertIndex);
      
      // WebSocket으로 장소 추가 알림
      sendMessage('PLACE_ADDED', {
        dayIndex: targetDayIndex,
        place: dragData.place,
        insertIndex
      });
      
      // 북마크 모달은 열어둠 (연속 추가를 위해)
      
      return;
    }
    
    // 2. 페이지 PlaceBlock 처리
    if (dragData.type === 'page-place' && dragData.place) {
      console.log('🏢 페이지 PlaceBlock 드롭 처리');
      
      // 드롭 위치에 따른 인덱스 조정
      const target = e.currentTarget;
      const dropPosition = target.getAttribute('data-drop-position');
      let insertIndex = targetPlaceIndex;
      
      // 하단에 드롭하는 경우 인덱스를 1 증가
      if (dropPosition === 'bottom') {
        insertIndex = targetPlaceIndex + 1;
      }
      
      // PlaceBlock 데이터를 DailyPlaceBlock 형식으로 변환
      const placeData = dragData.place;
      const normalizedPlace = {
        id: placeData.id,
        name: placeData.placeName || placeData.name,
        address: placeData.address,
        rating: placeData.rating,
        ratingCount: placeData.ratingCount,
        imageUrl: placeData.googleImg && placeData.googleImg[0],
        latitude: placeData.latitude || placeData.lat,
        longitude: placeData.longitude || placeData.lng,
        primaryCategory: placeData.primaryCategory,
        originalData: placeData
      };
      
      // 지정된 위치에 장소 추가
      addPlaceToDay(targetDayIndex, normalizedPlace, insertIndex);
      
      // WebSocket으로 장소 추가 알림
      sendMessage('PLACE_ADDED', {
        dayIndex: targetDayIndex,
        place: normalizedPlace,
        insertIndex
      });
      
      return;
    }

    // 기존 장소 드래그 처리
    if (dragData.type !== 'place') {
      console.log('❌ 지원되지 않는 드래그 타입 - 종료');
      return;
    }

    const { dayIndex: sourceDayIndex, placeIndex: sourcePlaceIndex } = dragData;
  
    // 드롭 위치에 따른 인덱스 조정
    const target = e.currentTarget;
    const dropPosition = target.getAttribute('data-drop-position');
    let finalTargetPlaceIndex = targetPlaceIndex;
    
    // 하단에 드롭하는 경우 인덱스를 1 증가
    if (dropPosition === 'bottom') {
      finalTargetPlaceIndex = targetPlaceIndex + 1;
    }
    
    if (sourceDayIndex === targetDayIndex && sourcePlaceIndex === finalTargetPlaceIndex) {
      console.log('❌ 같은 위치로 드롭 - 취소');
      handlePlaceDragEnd(e);
      return;
    }

    console.log('🔄 장소 위치 이동 실행 시작!');
    
    try {
      reorderPlaces(sourceDayIndex, sourcePlaceIndex, targetDayIndex, finalTargetPlaceIndex);
      
      // WebSocket으로 장소 이동 알림
      sendMessage('PLACE_MOVED', {
        fromDayIndex: sourceDayIndex,
        fromPlaceIndex: sourcePlaceIndex,
        toDayIndex: targetDayIndex,
        toPlaceIndex: finalTargetPlaceIndex
      });
      
      console.log('✅ 장소 이동 성공!');
    } catch (error) {
      console.error('❌ 장소 이동 오류:', error);
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

  const addPlaceFromBookmark = (place, insertIndex = -1) => {
    console.log('📝 addPlaceFromBookmark 호출:', { selectedDayIndex, placeName: place.name, insertIndex });
    if (selectedDayIndex === null) return;
    addPlaceToDay(selectedDayIndex, place, insertIndex);
    closeBookmarkModal();
  };

  // === 드롭 존 핸들러들 ===
  const handleDropZoneDragOver = (e, dayIndex, insertIndex) => {
    console.log('🔄 handleDropZoneDragOver 호출:', { dayIndex, insertIndex, target: e.currentTarget.className });
    e.preventDefault();
    e.stopPropagation();
    
    // 북마크 장소(application/json) 또는 페이지 PlaceBlock(text/plain) 허용
    const hasJsonData = e.dataTransfer.types.includes('application/json');
    const hasTextData = e.dataTransfer.types.includes('text/plain');
    
    if (!hasJsonData && !hasTextData) {
      console.log('❌ 지원되는 드래그 데이터 없음');
      return;
    }
    
    e.dataTransfer.dropEffect = 'copy';
    
    // 드롭 존 시각적 피드백
    e.currentTarget.classList.add('drop-zone-active');
    
    console.log('✅ 드롭 존 활성화:', { dayIndex, insertIndex });
  };

  const handleDropZoneDragLeave = (e) => {
    console.log('🚫 handleDropZoneDragLeave 호출');
    e.preventDefault();
    e.stopPropagation();
    
    // 드롭 존 시각적 피드백 제거
    e.currentTarget.classList.remove('drop-zone-active');
  };

  const handleDropZoneDrop = (e, dayIndex, insertIndex) => {
    console.log('🎯 handleDropZoneDrop 호출:', { dayIndex, insertIndex, target: e.currentTarget.className });
    e.preventDefault();
    e.stopPropagation();
    
    // 드롭 존 시각적 피드백 제거
    e.currentTarget.classList.remove('drop-zone-active');
    
    try {
      // 1. 북마크 장소 (application/json) 처리
      let dragDataStr = e.dataTransfer.getData('application/json');
      
      if (dragDataStr) {
        const dragData = JSON.parse(dragDataStr);
        
        if (dragData.type === 'bookmark-place' && dragData.place) {
          console.log('📌 북마크 장소 드롭:', {
            place: dragData.place.name,
            dayIndex,
            insertIndex
          });
          
          // 지정된 위치에 장소 추가
          addPlaceToDay(dayIndex, dragData.place, insertIndex);
          
          // 북마크 모달은 열어둠 (연속 추가를 위해)
          return;
        }
      }
      
      // 2. 페이지 PlaceBlock (text/plain) 처리
      dragDataStr = e.dataTransfer.getData('text/plain');
      
      if (dragDataStr) {
        const dragData = JSON.parse(dragDataStr);
        
        // 페이지 PlaceBlock 타입 확인
        if (dragData.type === 'page-place' && dragData.place) {
          console.log('🏢 페이지 PlaceBlock 드롭:', {
            place: dragData.place.placeName || dragData.place.name,
            dayIndex,
            insertIndex
          });
          
          // PlaceBlock 데이터를 DailyPlaceBlock 형식으로 변환
          const placeData = dragData.place;
          const normalizedPlace = {
            id: placeData.id,
            name: placeData.placeName || placeData.name,
            address: placeData.address,
            rating: placeData.rating,
            ratingCount: placeData.ratingCount,
            imageUrl: placeData.googleImg && placeData.googleImg[0],
            latitude: placeData.latitude || placeData.lat,
            longitude: placeData.longitude || placeData.lng,
            primaryCategory: placeData.primaryCategory,
            originalData: placeData
          };
          
          // 지정된 위치에 장소 추가
          addPlaceToDay(dayIndex, normalizedPlace, insertIndex);
          return;
        }
      }
      
      console.log('❌ 지원되는 드래그 데이터가 없음');
    } catch (error) {
      console.error('❌ 드롭 존 드롭 오류:', error);
    }
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
      
      // WebSocket으로 메모 업데이트 알림
      sendMessage('PLAN_UPDATED', {
        plans: dailyPlans.map((day, idx) => 
          idx === dayIndex 
            ? { 
                ...day, 
                places: day.places.map((p, pIdx) => 
                  pIdx === placeIndex 
                    ? { ...p, memo }
                    : p
                )
              }
            : day
        )
      });
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
        latitude: place.latitude,
        longitude: place.longitude,
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
            onRemoveDay={(dayId) => {
              removeDailyPlan(dayId);
              // WebSocket으로 일정 삭제 알림
              sendMessage('DAY_REMOVED', { dayId });
            }}
            onAddPlaceClick={handleAddPlaceClick}
            onDayClick={handleDayClick}
            places={day.places || []}
            onRemovePlace={(dayIndex, placeIndex) => {
              const placeId = dailyPlans[dayIndex].places[placeIndex].id;
              removePlace(dayIndex, placeIndex);
              // WebSocket으로 장소 제거 알림
              sendMessage('PLACE_REMOVED', { dayIndex, placeId });
            }}
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
            // 드롭 존 핸들러들
            onDropZoneDragOver={handleDropZoneDragOver}
            onDropZoneDragLeave={handleDropZoneDragLeave}
            onDropZoneDrop={handleDropZoneDrop}
          />
        ))}
          
          <Button 
            className="add-day-button" 
            onClick={() => {
              const newDay = addDailyPlan();
                      // WebSocket으로 일정 추가 알림
        sendMessage('DAY_ADDED', { day: newDay });
            }}
          >
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
           planId={planId}
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