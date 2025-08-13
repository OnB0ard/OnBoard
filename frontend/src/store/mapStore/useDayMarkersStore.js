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
    const dayColors = [
      '#FF6B6B', // 1일차 (강렬한 빨강)
      '#4ECDC4', // 2일차 (청록색)
      '#45B7D1', // 3일차 (하늘색)
      '#F7B801', // 4일차 (선명한 노랑)
      '#5E8C6A', // 5일차 (짙은 녹색)
      '#F28C28', // 6일차 (주황색)
      '#C70039', // 7일차 (진홍색)
      '#9B59B6', // 8일차 (자주색)
      '#34495E', // 9일차 (남색)
      '#F3A683', // 10일차 (살구색)
    ];
    const markerColor = dayColors[dayIndex % dayColors.length]; // 순환 색상 사용
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
      primaryCategory: place.primaryCategory || place.category || '기타'
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
        type: place.primaryCategory || place.category || '기타',
        name: place.name,
        dayIndex: dayIndex,
        color: markerColor, // 마커 색상 추가
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
