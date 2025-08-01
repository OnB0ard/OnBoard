import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  placeBlocks: [], // 화이트보드에 있는 장소 블록들
  mapInstance: null,
  placesService: null,
  placeConstructor: null,
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
  isLoadingMore: false, // 추가 결과 로딩 중 상태
  pagination: null, // 검색 결과 페이지네이션 객체
  markerPosition: null, // 지도에 표시할 마커 위치
  autocompletePredictions: [], // 자동완성 예측 결과를 저장할 상태,
  lastMapPosition: null, // 마지막 지도 위치(center, zoom) 저장
  
  // 북마크 관련 상태
  bookmarkedPlaces: [], // 북마크된 장소들

  // --- 액션 (Actions) ---
  setTextQuery: (query) => set({ textQuery: query }),
  setPlaces: (places) => set({ places }),
  setSelectedPlace: (place) => {
    set({ selectedPlace: place });
  },
  setIsMapVisible: (visible) => set({ isMapVisible: visible }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setMapInstance: (map) => set({ mapInstance: map }),
  setLastMapPosition: (position) => set({ lastMapPosition: position }),
  // Autocomplete Search Modal Actions
  setPlacesService: (service) => set({ placesService: service }),
  setPlaceConstructor: (constructor) => set({ placeConstructor: constructor }),
  setInputValue: (value) => set({ inputValue: value }),
  clearSearch: () => set({ 
    inputValue: '',
    textQuery: '',
    searchResults: [], 
    hasSearched: false, 
    autocompletePredictions: [],
    markerPosition: null, // 마커 위치 초기화
    isSearching: false,
    pagination: null, // 페이지네이션 초기화
    isLoadingMore: false, // 추가 로딩 상태 초기화
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
    const { inputValue, placesService, mapInstance } = get();
    if (!inputValue.trim() || !placesService) return;

    set({ isSearching: true, hasSearched: true, autocompletePredictions: [] });

    const request = {
      query: inputValue,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos', 'rating', 'types'],
    };

    if (mapInstance) {
      request.bounds = mapInstance.getBounds();
    }

    placesService.textSearch(request, (results, status, pagination) => {
      const { isLoadingMore, searchResults: currentResults } = get();

      if (status === 'OK' && results) {

        const newSearchResults = isLoadingMore
          ? [...currentResults, ...results]
          : results;

        set({
          searchResults: newSearchResults,
          isSearching: false,
          isLoadingMore: false,
          pagination: pagination,
        });
      } else {
        set({ 
          isSearching: false, 
          isLoadingMore: false, 
          searchResults: isLoadingMore ? currentResults : [],
          pagination: isLoadingMore ? get().pagination : null,
        });
      }
    });
  },

  handlePlaceSelection: async (placeId) => {
    const { placeConstructor, mapInstance } = get();
    if (!placeConstructor || !placeId) {
      console.error('PlacesService not available or invalid placeId');
      return null;
    }

    try {
      const place = new placeConstructor({ id: placeId });

      const fieldsToFetch = [
        'id', 'displayName', 'formattedAddress', 'location', 'photos',
        'rating', 'types', 'websiteURI', 'userRatingCount', 'nationalPhoneNumber', 'reviews'
      ];

      await place.fetchFields({ fields: fieldsToFetch });

      console.log(place);

      set({
        selectedPlace: place,
        markerPosition: place.location,
      });

      if (mapInstance && place.location) {
        mapInstance.panTo(place.location);
        mapInstance.setZoom(15);
      }
      
      return place;
    } catch (error) {
      console.error('장소 상세 정보 로딩 실패:', error);
      return null;
    }
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

  fetchNextPage: () => {
    const { pagination, isLoadingMore } = get();

    if (!pagination || !pagination.hasNextPage || isLoadingMore) {
      return;
    }

    set({ isLoadingMore: true });

    pagination.nextPage(); // 다음 페이지 결과를 가져옴. 콜백은 최초 textSearch와 동일합니다.
  },

}));

export default useMapStore;