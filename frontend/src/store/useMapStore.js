import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  // --- 상태 (State) ---
  textQuery: '',
  places: [],
  selectedPlace: null,
  isMapVisible: true,
  isModalOpen: false,
  mapInstance: null,

  // --- 액션 (Actions) ---
  setTextQuery: (query) => set({ textQuery: query }),
  setPlaces: (places) => set({ places }),
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  setIsMapVisible: (visible) => set({ isMapVisible: visible }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setMapInstance: (map) => set({ mapInstance: map }),

  // --- 비동기 로직 및 복합 액션 ---
  findPlaces: async (placesLib, coreLib) => {
    const { textQuery, mapInstance, setPlaces, setIsModalOpen } = get();
    if (!placesLib || !mapInstance || !coreLib || !textQuery) {
      setPlaces([]);
      return;
    }
    
    const request = { textQuery, fields: ['displayName', 'location', 'businessStatus', 'id', 'types'], maxResultCount: 20 };
    try {
      const { places: foundPlaces } = await placesLib.Place.searchByText(request);
      setPlaces(foundPlaces);
      setIsModalOpen(true);

      if (foundPlaces.length > 1) {
        const bounds = new coreLib.LatLngBounds();
        foundPlaces.forEach(p => bounds.extend(p.location));
        mapInstance.fitBounds(bounds);
      } else if (foundPlaces.length === 1) {
        mapInstance.panTo(foundPlaces[0].location);
        mapInstance.setZoom(13);
      }
    } catch (e) {
      console.error("검색 오류:", e);
    }
  },

  handleMarkerClick: async (place) => {
    const { setSelectedPlace, setIsModalOpen } = get();
    const detailFields = ['id', 'displayName', 'formattedAddress', 'photos', 'rating', 'userRatingCount', 'websiteURI'];
    try {
      await place.fetchFields({ fields: detailFields });
      setSelectedPlace(place);
      setIsModalOpen(false);
    } catch (e) {
      console.error("상세 정보 로딩 실패:", e);
    }
  },
}));

export default useMapStore;