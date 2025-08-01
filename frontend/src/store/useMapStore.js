import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  placeBlocks: [], // 화이트보드에 있는 장소 블록들
  mapInstance: null,
  placesService: null,
  // --- 상태 (State) ---
  textQuery: '',
  places: [],
  selectedPlace: null,
  isMapVisible: true,
  isModalOpen: false,

  // Autocomplete Search Modal State
  inputValue: '',
  searchResults: [], // 검색 결과
  hasSearched: false, // 검색 실행 여부
  isSearching: false, // 검색 중 상태
  markerPosition: null, // 지도에 표시할 마커 위치
  autocompletePredictions: [], // 자동완성 예측 결과를 저장할 상태,
  lastMapPosition: null, // 마지막 지도 위치(center, zoom) 저장
  
  // 북마크 관련 상태
  bookmarkedPlaces: [], // 북마크된 장소들

  // --- 액션 (Actions) ---
  setTextQuery: (query) => set({ textQuery: query }),
  setPlaces: (places) => set({ places }),
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  setIsMapVisible: (visible) => set({ isMapVisible: visible }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setMapInstance: (map) => set({ mapInstance: map }),
  setLastMapPosition: (position) => set({ lastMapPosition: position }),
  // Autocomplete Search Modal Actions
  setPlacesService: (service) => set({ placesService: service }),
  setInputValue: (value) => set({ inputValue: value }),
  clearSearch: () => set({ 
    inputValue: '',
    textQuery: '',
    searchResults: [], 
    hasSearched: false, 
    autocompletePredictions: [],
    markerPosition: null, // 마커 위치 초기화
    isSearching: false,
  }),

  // PlaceBlock 관련 액션
  addPlaceBlock: (place, position) => {
    // 이제 드래그 데이터는 imageUrl을 포함한 경량 객체입니다.
    const newBlock = {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating,
      imageUrl: place.imageUrl, // 전달받은 imageUrl을 그대로 사용합니다.
      id: Date.now() + Math.random(), // 고유 ID
      position, // 드롭된 위치
    };
    set((state) => ({ placeBlocks: [...state.placeBlocks, newBlock] }));
  },

  removePlaceBlock: (id) => {
    set((state) => ({ 
      placeBlocks: state.placeBlocks.filter((block) => block.id !== id) 
    }));
  },

  updatePlaceBlockPosition: (id, position) => {
    set((state) => ({
      placeBlocks: state.placeBlocks.map((block) => 
        block.id === id ? { ...block, position } : block
      ),
    }));
  },

  // 북마크 관련 액션
  addBookmark: (place) => {
    set((state) => {
      const isAlreadyBookmarked = state.bookmarkedPlaces.some(
        bookmarked => bookmarked.place_id === place.place_id
      );
      
      if (isAlreadyBookmarked) {
        return state; // 이미 북마크되어 있으면 추가하지 않음
      }
      
      const bookmarkData = {
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        rating: place.rating,
        types: place.types,
        photos: place.photos,
        addedAt: new Date().toISOString(),
      };
      
      return {
        bookmarkedPlaces: [...state.bookmarkedPlaces, bookmarkData]
      };
    });
  },

  removeBookmark: (placeId) => {
    set((state) => ({
      bookmarkedPlaces: state.bookmarkedPlaces.filter(
        place => place.place_id !== placeId
      )
    }));
  },

  toggleBookmark: (place) => {
    set((state) => {
      const isBookmarked = state.bookmarkedPlaces.some(
        bookmarked => bookmarked.place_id === place.place_id
      );
      
      if (isBookmarked) {
        // 북마크 제거
        return {
          bookmarkedPlaces: state.bookmarkedPlaces.filter(
            bookmarked => bookmarked.place_id !== place.place_id
          )
        };
      } else {
        // 북마크 추가
        const bookmarkData = {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          rating: place.rating,
          types: place.types,
          photos: place.photos,
          addedAt: new Date().toISOString(),
        };
        
        return {
          bookmarkedPlaces: [...state.bookmarkedPlaces, bookmarkData]
        };
      }
    });
  },

  isBookmarked: (placeId) => {
    const state = get();
    return state.bookmarkedPlaces.some(place => place.place_id === placeId);
  },

  performTextSearch: () => {
    const { inputValue, placesService } = get();
    if (!inputValue.trim() || !placesService) return;

    set({ isSearching: true, hasSearched: true, autocompletePredictions: [] });

    const request = {
      query: inputValue,
      fields: ['name', 'formatted_address', 'place_id', 'geometry', 'photos', 'types', 'rating'],
    };

    placesService.textSearch(request, (results, status) => {
      if (status === 'OK' && results) {
        set({ searchResults: results, isSearching: false });
      } else {
        set({ searchResults: [], isSearching: false });
      }
    });
  },

  handlePlaceSelection: (placeId) => {
    return new Promise((resolve, reject) => {
      const { placesService, mapInstance } = get();
      if (!placesService || !placeId) {
        return reject(new Error('PlacesService not available'));
      }

      const request = {
        placeId,
        fields: ['name', 'formatted_address', 'place_id', 'geometry', 'photos', 'types', 'rating'],
      };

      placesService.getDetails(request, (place, status) => {
        if (status === 'OK' && place && place.geometry) {
          const newQuery = place.formatted_address || place.name;
          set({
            textQuery: newQuery,
            inputValue: place.name, // 입력창에는 장소 이름만 표시
            searchResults: [place], // 검색 결과를 선택된 장소로 설정
            selectedPlace: place,
            hasSearched: true, // 검색한 것으로 처리
            autocompletePredictions: [], // 예측 목록 초기화
            markerPosition: place.geometry.location, // 마커 위치 업데이트
          });

          if (mapInstance) {
            mapInstance.panTo(place.geometry.location);
            mapInstance.setZoom(15);
          }
          resolve(place); // 성공 시 place 객체로 resolve
        } else {
          console.error('장소 세부 정보를 가져오는 데 실패했습니다:', status);
          reject(new Error('Failed to get place details')); // 실패 시 reject
        }
      });
    });
  },

  // 자동완성 예측 가져오기
  fetchAutocompletePredictions: (input) => {
    // 사용자가 다시 입력을 시작하면, 이전 검색 결과 상태를 초기화합니다.
    set({ hasSearched: false, searchResults: [] });

    if (!input) {
      set({ autocompletePredictions: [] });
      return;
    }
    const autocompleteService = new window.google.maps.places.AutocompleteService();
    autocompleteService.getPlacePredictions(
      { input },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          set({ autocompletePredictions: predictions });
        } else {
          set({ autocompletePredictions: [] });
        }
      }
    );
  },


}));

export default useMapStore;