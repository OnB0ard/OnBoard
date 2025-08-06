import { create } from 'zustand';
import { updatePlaceOrder } from '../apis/placeOrderUpdate';
import { devtools } from 'zustand/middleware';

const useDailyPlanStore = create(
  devtools(
    (set, get) => ({
      // === 기본 상태 ===
      dailyPlans: [],
      planId: null, // 현재 편집 중인 계획 ID
      
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

      // === 일차 관련 액션 ===
      addDailyPlan: () => set((state) => {
        const newDay = { 
          id: Date.now(), 
          title: `${state.dailyPlans.length + 1}일차`, 
          places: [] 
        };
        return {
          dailyPlans: [...state.dailyPlans, newDay]
        };
      }),

      removeDailyPlan: (dayId) => set((state) => ({
        dailyPlans: state.dailyPlans.filter(day => day.id !== dayId)
      })),

      updateDayTitle: (dayId, newTitle) => set((state) => ({
        dailyPlans: state.dailyPlans.map(day => 
          day.id === dayId ? { ...day, title: newTitle } : day
        )
      })),

      reorderDailyPlans: (fromIndex, toIndex) => set((state) => {
        const newPlans = [...state.dailyPlans];
        const [draggedItem] = newPlans.splice(fromIndex, 1);
        newPlans.splice(toIndex, 0, draggedItem);
        return { dailyPlans: newPlans };
      }),

      // 일차 위치 교환 (새로운 방식)
      swapDailyPlans: (fromIndex, toIndex) => set((state) => {
        if (fromIndex === toIndex) return state;
        
        const newPlans = [...state.dailyPlans];
        // 두 요소의 위치를 교환
        [newPlans[fromIndex], newPlans[toIndex]] = [newPlans[toIndex], newPlans[fromIndex]];
        return { dailyPlans: newPlans };
      }),

      // === 장소 관련 액션 ===
      addPlaceToDay: (dayIndex, place) => set((state) => {
        const normalizedPlace = get().normalizePlaceData(place);
        const newPlace = { ...normalizedPlace, id: `${normalizedPlace.id}-${Date.now()}` };
        
        return {
          dailyPlans: state.dailyPlans.map((day, index) =>
            index === dayIndex ? { ...day, places: [...day.places, newPlace] } : day
          )
        };
      }),

      removePlace: (dayIndex, placeIndex) => set((state) => ({
        dailyPlans: state.dailyPlans.map((day, index) =>
          index === dayIndex
            ? { ...day, places: day.places.filter((_, pIndex) => pIndex !== placeIndex) }
            : day
        )
      })),

      updatePlaceMemo: (dayIndex, placeIndex, memo) => set((state) => ({
        dailyPlans: state.dailyPlans.map((day, index) =>
          index === dayIndex
            ? {
                ...day,
                places: day.places.map((place, pIndex) =>
                  pIndex === placeIndex ? { ...place, memo } : place
                )
              }
            : day
        )
      })),

      reorderPlaces: (sourceDayIndex, sourcePlaceIndex, targetDayIndex, targetPlaceIndex) => set((state) => {
        const newPlans = [...state.dailyPlans];
        const draggedPlace = newPlans[sourceDayIndex].places[sourcePlaceIndex];
        
        // 소스에서 제거
        newPlans[sourceDayIndex].places.splice(sourcePlaceIndex, 1);
        
        // 타겟에 삽입 (같은 날짜 내에서 이동할 때 인덱스 조정)
        let adjustedTargetIndex = targetPlaceIndex;
        if (sourceDayIndex === targetDayIndex && sourcePlaceIndex < targetPlaceIndex) {
          adjustedTargetIndex -= 1;
        }
        newPlans[targetDayIndex].places.splice(adjustedTargetIndex, 0, draggedPlace);
        
        return { dailyPlans: newPlans };
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
        
        // 로컬 상태 업데이트
        set({ dailyPlans: newPlans });
        
        // API 호출을 위한 데이터 변환
        try {
          const nthPlaceList = newPlans.map((day, dayIndex) => ({
            dayScheduleId: day.id || dayIndex + 1, // dayScheduleId 사용 또는 fallback
            dayPlaceList: day.places.map((place, placeIndex) => ({
              dayPlaceId: place.id || place.dayPlaceId, // dayPlaceId 사용
              indexOrder: placeIndex + 1 // 1부터 시작하는 순서
            }))
          }));
          
          console.log('📡 API 전송 데이터:', { nthPlaceList });
          
          // planId를 얻어와야 함 (상태에서 또는 props로)
          const planId = state.planId || state.currentPlanId; // planId 가져오기
          
          if (planId) {
            await updatePlaceOrder(planId, { nthPlaceList });
            console.log('✅ 장소 순서 API 업데이트 성공!');
          } else {
            console.warn('⚠️ planId가 없어 API 호출을 건너뛰니다.');
          }
        } catch (error) {
          console.error('❌ 장소 순서 API 업데이트 실패:', error);
          // API 실패 시 사용자에게 알림 (선택사항)
          // alert('장소 순서 업데이트에 실패했습니다. 다시 시도해주세요.');
        }
      },

      // === 기본 액션 ===
      setPlanId: (planId) => set({ planId }),
      
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
        const photoUrl = place.imageUrl || 
          (place.photos && place.photos[0]?.getUrl({ maxWidth: 100, maxHeight: 100 })) || 
          (place.googleImg && place.googleImg[0]);
        
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
          originalData: place,
        };
      },

      // === 초기화 ===
      resetStore: () => set({
        dailyPlans: [],
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
      name: 'daily-plan-store',
    }
  )
);

export default useDailyPlanStore;
