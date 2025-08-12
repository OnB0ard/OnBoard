import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useDailyPlanStore = create(
  devtools(
    persist((set, get) => ({
      // === 기본 상태 ===
      dailyPlans: [],
      planId: null, // 현재 편집 중인 계획 ID (뷰)
      // 방별 일정 영속 저장소 (북마크와 동일한 패턴)
      activePlanId: null,
      plansByPlanId: {}, // { [planId]: DailyPlan[] }
      
      // === 지도 마커 상태 ===
      selectedDayForMap: null, // 지도에 마커를 표시할 선택된 일차 인덱스
      showDayMarkersOnMap: false, // 지도에 일차 마커 표시 여부

      // === 모달 상태 ===
      showBookmarkModal: false,
      selectedDayIndex: null,
      bookmarkModalPosition: { x: 0, y: 0 },
      showMemoModal: false,
      memoModalData: {
        place: null,
        dayTitle: '',
        memo: '',
        position: { x: 0, y: 0 }
      },

      // === 드래그 앤 드롭 상태 ===
      // 장소 드래그 상태
      draggedPlaceId: null,
      draggedFromDay: null,
      draggedFromIndex: null,
      isDragging: false,
      dragOverIndex: null,
      // 교환 대상 포커스 상태
      swapTargetDayIndex: null,
      swapTargetPlaceIndex: null,
      
      // 일차 드래그 상태
      draggedDayIndex: null,

      // 내부 공통 헬퍼: 활성 플랜의 일정 동시 업데이트
      _applyToActivePlans: (produceNewPlans) => set((state) => {
        const key = state.activePlanId || state.planId || 'global';
        const currentPlans = state.dailyPlans;
        const newPlans = produceNewPlans(currentPlans, state);
        return {
          dailyPlans: newPlans,
          plansByPlanId: { ...state.plansByPlanId, [key]: newPlans },
        };
      }),

    // === WS용 ID 기반 헬퍼/액션 ===
    // 일차 ID로 dayIndex 찾기
    findDayIndexById: (dayScheduleId) => {
      const state = useDailyPlanStore.getState();
      return (state.dailyPlans || []).findIndex((d) => d.id === dayScheduleId);
    },
    // dayPlaceId로 placeIndex 찾기
    findPlaceIndexByDayPlaceId: (dayIndex, dayPlaceId) => {
      const state = useDailyPlanStore.getState();
      const places = state.dailyPlans?.[dayIndex]?.places || [];
      return places.findIndex((p) => p.id === dayPlaceId);
    },
    // 서버 브로드캐스트 기반 삽입 (CREATE)
    insertPlaceByServer: (dayScheduleId, insertIndex, placeObj) => get()._applyToActivePlans((plans) => {
      const idx = plans.findIndex((d) => d.id === dayScheduleId);
      if (idx < 0) return plans;
      const newPlans = [...plans];
      const day = newPlans[idx];
      const places = [...(day.places || [])];
      const pos = Math.max(0, Math.min(insertIndex, places.length));
      // 중복 방지: 동일 id가 이미 있으면 무시
      if (places.some((p) => p.id === placeObj.id)) return plans;
      places.splice(pos, 0, placeObj);
      // 배열 순서 기준으로 indexOrder 재계산 (1-based)
      const normalized = places.map((p, i) => ({ ...p, indexOrder: i + 1 }));
      newPlans[idx] = { ...day, places: normalized };
      return newPlans;
    }),
    // 메모 갱신 (RENAME)
    updatePlaceMemoById: (dayScheduleId, dayPlaceId, memo) => get()._applyToActivePlans((plans) => {
      const idx = plans.findIndex((d) => d.id === dayScheduleId);
      if (idx < 0) return plans;
      const newPlans = [...plans];
      const day = newPlans[idx];
      const places = (day.places || []).map((p) => (p.id === dayPlaceId ? { ...p, memo } : p));
      newPlans[idx] = { ...day, places };
      return newPlans;
    }),
    // 같은 일차 내 재정렬 (UPDATE_INNER)
    reorderPlacesById: (dayScheduleId, dayPlaceId, toIndex) => get()._applyToActivePlans((plans) => {
      const dIdx = plans.findIndex((d) => d.id === dayScheduleId);
      if (dIdx < 0) return plans;
      const newPlans = [...plans];
      const day = newPlans[dIdx];
      const places = [...(day.places || [])];
      const fromIndex = places.findIndex((p) => p.id === dayPlaceId);
      if (fromIndex < 0) return plans;
      // 먼저 제거 후, 새로운 길이를 기준으로 toIndex를 클램프 (끝으로 이동 허용)
      const [moved] = places.splice(fromIndex, 1);
      const insertIndex = Math.max(0, Math.min(toIndex, places.length));
      places.splice(insertIndex, 0, moved);
      // 배열 순서 기준으로 indexOrder 재계산 (1-based)
      const normalized = places.map((p, i) => ({ ...p, indexOrder: i + 1 }));
      newPlans[dIdx] = { ...day, places: normalized };
      return newPlans;
    }),
    // 다른 일차로 이동 (UPDATE_OUTER)
    movePlaceAcrossDaysById: (dayPlaceId, fromDayScheduleId, toDayScheduleId, toIndex) => get()._applyToActivePlans((plans) => {
      const fromIdx = plans.findIndex((d) => d.id === fromDayScheduleId);
      const toIdx = plans.findIndex((d) => d.id === toDayScheduleId);
      if (fromIdx < 0 || toIdx < 0) return plans;
      const newPlans = [...plans];
      const fromDay = newPlans[fromIdx];
      const toDay = newPlans[toIdx];
      const fromPlaces = [...(fromDay.places || [])];
      const toPlaces = [...(toDay.places || [])];
      const srcIndex = fromPlaces.findIndex((p) => p.id === dayPlaceId);
      if (srcIndex < 0) return plans;
      const [moved] = fromPlaces.splice(srcIndex, 1);
      const insertIndex = Math.max(0, Math.min(toIndex, toPlaces.length));
      toPlaces.splice(insertIndex, 0, moved);
      // 양쪽 일차 모두 indexOrder 재계산 (1-based)
      const normalizedFrom = fromPlaces.map((p, i) => ({ ...p, indexOrder: i + 1 }));
      const normalizedTo = toPlaces.map((p, i) => ({ ...p, indexOrder: i + 1 }));
      newPlans[fromIdx] = { ...fromDay, places: normalizedFrom };
      newPlans[toIdx] = { ...toDay, places: normalizedTo };
      return newPlans;
    }),
    // 삭제 (DELETE)
    removePlaceById: (dayScheduleId, dayPlaceId) => get()._applyToActivePlans((plans) => {
      const idx = plans.findIndex((d) => d.id === dayScheduleId);
      if (idx < 0) return plans;
      const newPlans = [...plans];
      const day = newPlans[idx];
      const places = (day.places || []).filter((p) => p.id !== dayPlaceId);
      newPlans[idx] = { ...day, places };
      return newPlans;
    }),

      // === 일차 관련 액션 ===
      setDailyPlans: (plans) => get()._applyToActivePlans(() => plans),
      
      addDailyPlan: () => get()._applyToActivePlans((plans) => {
        const newDay = {
          id: Date.now(),
          title: `${plans.length + 1}일차`,
          places: [],
        };
        return [...plans, newDay];
      }),

      removeDailyPlan: (dayId) => get()._applyToActivePlans((plans) => (
        plans.filter((day) => day.id !== dayId)
      )),

      updateDayTitle: (dayId, newTitle) => get()._applyToActivePlans((plans) => (
        plans.map((day) => (day.id === dayId ? { ...day, title: newTitle } : day))
      )),

      reorderDailyPlans: (fromIndex, toIndex) => get()._applyToActivePlans((plans) => {
        const newPlans = [...plans];
        const [draggedItem] = newPlans.splice(fromIndex, 1);
        newPlans.splice(toIndex, 0, draggedItem);
        return newPlans;
      }),

      // 일차 위치 교환 (새로운 방식)
      swapDailyPlans: (fromIndex, toIndex) => get()._applyToActivePlans((plans) => {
        if (fromIndex === toIndex) return plans;
        const newPlans = [...plans];
        [newPlans[fromIndex], newPlans[toIndex]] = [newPlans[toIndex], newPlans[fromIndex]];
        return newPlans;
      }),

      // === 장소 관련 액션 ===
      addPlaceToDay: (dayIndex, place, insertIndex = -1) => get()._applyToActivePlans((plans) => {
        console.log('📝 addPlaceToDay 호출:', { dayIndex, placeName: place.name, insertIndex });
        const normalizedPlace = get().normalizePlaceData(place);
        const newPlace = { ...normalizedPlace, id: `${normalizedPlace.id}-${Date.now()}` };
        return plans.map((day, index) => {
          if (index === dayIndex) {
            const newPlaces = [...day.places];
            if (insertIndex === -1 || insertIndex >= newPlaces.length) newPlaces.push(newPlace);
            else newPlaces.splice(insertIndex, 0, newPlace);
            return { ...day, places: newPlaces };
          }
          return day;
        });
      }),

      removePlace: (dayIndex, placeIndex) => get()._applyToActivePlans((plans) => (
        plans.map((day, index) =>
          index === dayIndex
            ? { ...day, places: day.places.filter((_, pIndex) => pIndex !== placeIndex) }
            : day
        )
      )),

      updatePlaceMemo: (dayIndex, placeIndex, memo) => get()._applyToActivePlans((plans) => (
        plans.map((day, index) =>
          index === dayIndex
            ? {
                ...day,
                places: day.places.map((place, pIndex) => (pIndex === placeIndex ? { ...place, memo } : place)),
              }
            : day
        )
      )),

      reorderPlaces: (sourceDayIndex, sourcePlaceIndex, targetDayIndex, targetPlaceIndex) => get()._applyToActivePlans((plans) => {
        const newPlans = [...plans];
        const draggedPlace = newPlans[sourceDayIndex].places[sourcePlaceIndex];
        
        // 소스에서 제거
        newPlans[sourceDayIndex].places.splice(sourcePlaceIndex, 1);
        
        // 타겟에 삽입 (같은 날짜 내에서 이동할 때 인덱스 조정)
        let adjustedTargetIndex = targetPlaceIndex;
        if (sourceDayIndex === targetDayIndex && sourcePlaceIndex < targetPlaceIndex) {
          adjustedTargetIndex -= 1;
        }
        newPlans[targetDayIndex].places.splice(adjustedTargetIndex, 0, draggedPlace);
        return newPlans;
      }),

      // 장소 위치 교환 (새로운 방식)
      swapPlaces: async (sourceDayIndex, sourcePlaceIndex, targetDayIndex, targetPlaceIndex) => {
        const state = useDailyPlanStore.getState();
        
        if (sourceDayIndex === targetDayIndex && sourcePlaceIndex === targetPlaceIndex) {
          return; // 같은 위치면 아무것도 하지 않음
        }
        
        const newPlans = [...state.dailyPlans];
        
        // 같은 일차 내에서 교환
        if (sourceDayIndex === targetDayIndex) {
          const places = [...newPlans[sourceDayIndex].places];
          [places[sourcePlaceIndex], places[targetPlaceIndex]] = [places[targetPlaceIndex], places[sourcePlaceIndex]];
          newPlans[sourceDayIndex] = { ...newPlans[sourceDayIndex], places };
        }
        // 다른 일차 간 교환
        else {
          const sourcePlace = newPlans[sourceDayIndex].places[sourcePlaceIndex];
          const targetPlace = newPlans[targetDayIndex].places[targetPlaceIndex];
          
          // 소스 일차에서 타겟 장소로 교체
          const newSourcePlaces = [...newPlans[sourceDayIndex].places];
          newSourcePlaces[sourcePlaceIndex] = targetPlace;
          newPlans[sourceDayIndex] = { ...newPlans[sourceDayIndex], places: newSourcePlaces };
          
          // 타겟 일차에서 소스 장소로 교체
          const newTargetPlaces = [...newPlans[targetDayIndex].places];
          newTargetPlaces[targetPlaceIndex] = sourcePlace;
          newPlans[targetDayIndex] = { ...newPlans[targetDayIndex], places: newTargetPlaces };
        }
        
        // 로컬 상태 및 플랜별 저장소 업데이트
        const key = state.activePlanId || state.planId || 'global';
        set({ dailyPlans: newPlans, plansByPlanId: { ...state.plansByPlanId, [key]: newPlans } });
        
        // REST API 호출 제거: 순서 변경은 WS 브로드캐스트를 신뢰함
        // 필요시 상위 컴포넌트에서 WS 전송을 담당
      },

      // === 기본 액션 ===
      setPlanId: (planId) => set((state) => ({
        planId,
        activePlanId: planId,
        dailyPlans: state.plansByPlanId[planId] || [],
      })),
      
      // === 지도 마커 액션 ===
      selectDayForMap: (dayIndex) => set({ 
        selectedDayForMap: dayIndex, 
        showDayMarkersOnMap: true 
      }),
      clearDayMarkersFromMap: () => set({ 
        selectedDayForMap: null, 
        showDayMarkersOnMap: false 
      }),
      toggleDayMarkersOnMap: (dayIndex) => set((state) => {
        // 같은 일차를 다시 클릭하면 마커 숨기기
        if (state.selectedDayForMap === dayIndex && state.showDayMarkersOnMap) {
          return { 
            selectedDayForMap: null, 
            showDayMarkersOnMap: false 
          };
        }
        // 다른 일차 또는 처음 클릭시 마커 표시
        return { 
          selectedDayForMap: dayIndex, 
          showDayMarkersOnMap: true 
        };
      }),

      
      // === 드래그 앤 드롭 액션 ===
      setDayDragState: (draggedDayIndex) => set({ draggedDayIndex }),
      
      setPlaceDragState: (isDragging, draggedPlaceId = null, draggedFromDay = null, draggedFromIndex = null) => set({
        isDragging,
        draggedPlaceId,
        draggedFromDay,
        draggedFromIndex,
        dragOverIndex: null
      }),
      setDraggedDayIndex: (index) => set({ draggedDayIndex: index }),
      setDraggedPlaceId: (id) => set({ draggedPlaceId: id }),
      setDragOverIndex: (index) => set({ dragOverIndex: index }),
      setDraggedFromDay: (dayIndex) => set({ draggedFromDay: dayIndex }),
      setSwapTargetDayIndex: (index) => set({ swapTargetDayIndex: index }),
      setSwapTargetPlaceIndex: (index) => set({ swapTargetPlaceIndex: index }),

      clearDragState: () => set({
        draggedDayIndex: null,
        isDragging: false,
        draggedPlaceId: null,
        draggedFromDay: null,
        draggedFromIndex: null,
        dragOverIndex: null,
        swapTargetDayIndex: null,
        swapTargetPlaceIndex: null
      }),

      // === 모달 관련 액션 ===
      openBookmarkModal: (dayIndex, position) => set({
        showBookmarkModal: true,
        selectedDayIndex: dayIndex,
        bookmarkModalPosition: position
      }),

      closeBookmarkModal: () => set({
        showBookmarkModal: false,
        selectedDayIndex: null
      }),

      openMemoModal: (place, dayTitle, memo, position) => set({
        showMemoModal: true,
        memoModalData: { place, dayTitle, memo, position }
      }),

      closeMemoModal: () => set({
        showMemoModal: false,
        memoModalData: {
          place: null,
          dayTitle: '',
          memo: '',
          position: { x: 0, y: 0 }
        }
      }),

      // === 유틸리티 함수 ===
      normalizePlaceData: (place) => {
        // 사진 URL 처리 - Google Places API Photo 객체와 일반 URL 문자열 모두 지원
        let photoUrl = place.imageUrl;
        
        if (!photoUrl && place.photos && place.photos[0]) {
          const photo = place.photos[0];
          // Google Places API Photo 객체인 경우 (getUrl 함수가 있음)
          if (typeof photo.getUrl === 'function') {
            try {
              photoUrl = photo.getUrl({ maxWidth: 100, maxHeight: 100 });
            } catch (error) {
              console.warn('Photo getUrl 오류:', error);
            }
          }
          // 일반 문자열 URL인 경우
          else if (typeof photo === 'string') {
            photoUrl = photo;
          }
          // 객체 형태로 URL이 들어있는 경우
          else if (photo.url || photo.src || photo.imageUrl) {
            photoUrl = photo.url || photo.src || photo.imageUrl;
          }
        }
        
        // googleImg 배열도 확인
        if (!photoUrl && place.googleImg && place.googleImg[0]) {
          photoUrl = place.googleImg[0];
        }
        
        // 위도/경도 데이터 추출 (실제 데이터 구조에 맞게 수정)
        let latitude = null;
        let longitude = null;
        
        // 1. 직접 latitude/longitude 필드
        if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
          latitude = place.latitude;
          longitude = place.longitude;
        }
        // 2. 직접 lat/lng 필드 
        else if (typeof place.lat === 'number' && typeof place.lng === 'number') {
          latitude = place.lat;
          longitude = place.lng;
        }
        // 3. Google Places API geometry 객체 (함수 형태)
        else if (place.geometry && typeof place.geometry.location?.lat === 'function') {
          latitude = place.geometry.location.lat();
          longitude = place.geometry.location.lng();
        }
        // 4. geometry.location이 객체인 경우
        else if (place.geometry && place.geometry.location && 
                 typeof place.geometry.location.lat === 'number' && 
                 typeof place.geometry.location.lng === 'number') {
          latitude = place.geometry.location.lat;
          longitude = place.geometry.location.lng;
        }
        // 5. location 객체 직접 확인
        else if (place.location && 
                 typeof place.location.lat === 'number' && 
                 typeof place.location.lng === 'number') {
          latitude = place.location.lat;
          longitude = place.location.lng;
        }
        // 6. x, y 좌표 (일부 시스템에서 사용)
        else if (typeof place.x === 'number' && typeof place.y === 'number') {
          latitude = place.y; // y는 보통 latitude
          longitude = place.x; // x는 보통 longitude
        }
        
        console.log('🗺️ normalizePlaceData - 위도/경도 추출:', {
          placeName: place.name || place.displayName || place.placeName,
          originalPlace: place,
          extractedLat: latitude,
          extractedLng: longitude,
          availableFields: Object.keys(place)
        });
        
        return {
          id: place.id || place.place_id || place.googlePlaceId,
          name: place.name || place.displayName || place.placeName,
          address: place.address || place.formatted_address,
          rating: place.rating,
          ratingCount: place.ratingCount || place.user_ratings_total,
          imageUrl: photoUrl,
          latitude: latitude,
          longitude: longitude,
          primaryCategory: place.primaryCategory, // primaryCategory 추가
          originalData: place,
        };
      },

      // === 초기화 ===
      resetStore: () => set({
        showBookmarkModal: false,
        selectedDayIndex: null,
        bookmarkModalPosition: { x: 0, y: 0 },
        showMemoModal: false,
        memoModalData: {
          place: null,
          dayTitle: '',
          memo: '',
          position: { x: 0, y: 0 }
        },
        draggedPlaceId: null,
        draggedFromDay: null,
        draggedFromIndex: null,
        isDragging: false,
        dragOverIndex: null,
        draggedDayIndex: null
      })
    }),
    {
      name: 'daily-plan-per-plan',
      partialize: (state) => ({ plansByPlanId: state.plansByPlanId, activePlanId: state.activePlanId }),
    }
  ))
);

export default useDailyPlanStore;
