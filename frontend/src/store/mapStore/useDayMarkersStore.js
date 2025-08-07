import { create } from 'zustand';
import usePlaceBlocksStore from './usePlaceBlocksStore';

/**
 * Day Markers Store
 * Handles day-specific markers on the map
 */
const useDayMarkersStore = create((set, get) => ({
  // --- Day Markers State ---
  dayMarkers: [], // 일차별 장소 마커 데이터
  showDayMarkers: false, // 일차 마커 표시 여부
  
  // --- Day Markers Actions ---
  setDayMarkers: (places, dayIndex) => {
    console.log('🗺️ 지도 스토어에 일차 마커 설정:', { dayIndex, placesCount: places.length });
    
    // 좌표 정보가 있는 장소들만 필터링
    const validPlaces = places.filter(place => 
      place && 
      typeof place.latitude === 'number' && 
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) && 
      !isNaN(place.longitude)
    );
    
    console.log('📍 유효한 장소 마커:', validPlaces.map(place => ({
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      primaryCategory: place.primaryCategory || '기타'
    })));
    
    // PlaceBlock 마커 숨기기
    const { setHidePlaceBlockMarkers } = usePlaceBlocksStore.getState();
    if (validPlaces.length > 0) {
      setHidePlaceBlockMarkers(true);
    }
    
    set({ 
      dayMarkers: validPlaces.map(place => ({
        id: place.id || `day-${dayIndex}-${place.name}`,
        position: { lat: place.latitude, lng: place.longitude },
        type: place.primaryCategory || '기타',
        name: place.name,
        dayIndex: dayIndex
      })),
      showDayMarkers: validPlaces.length > 0
    });
  },
  
  clearDayMarkers: () => {
    console.log('🗺️ 지도에서 일차 마커 제거');
    
    // PlaceBlock 마커 다시 표시
    const { setHidePlaceBlockMarkers } = usePlaceBlocksStore.getState();
    setHidePlaceBlockMarkers(false);
    
    set({ 
      dayMarkers: [], 
      showDayMarkers: false 
    });
  },
  
  toggleDayMarkers: () => {
    set(state => ({ showDayMarkers: !state.showDayMarkers }));
  }
}));

export default useDayMarkersStore;
