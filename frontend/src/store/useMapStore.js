import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  // --- 상태 (State) ---
  placeBlocks: [],
  mapInstance: null,
  placesService: null,
  placeConstructor: null, // Note: This might be part of a legacy or different API approach.
  textQuery: '',
  places: [],
  selectedPlace: null,
  isMapVisible: true,
  isModalOpen: false,
  isPlaceDetailModalOpen: false,
  placeDetailPosition: { x: 0, y: 0 },
  inputValue: '',
  searchResults: [], // 검색 결과
  hasSearched: false, // 검색이 실행되었는지 여부
  isSearching: false, // 현재 검색 중인지 여부
  pagination: null, // 검색 결과 페이지네이션 객체
  autocompletePredictions: [], // 자동완성 추천 목록
  markerPosition: null,
  markerType: null,
  lastMapPosition: null,
  bookmarkedPlaces: [],
  
  // === 일차별 마커 상태 ===
  dayMarkers: [], // 일차별 장소 마커 데이터
  showDayMarkers: false, // 일차 마커 표시 여부

  // --- 헬퍼 함수 (Helper Function) ---
  // Google Maps API의 types를 사용자 친화적인 카테고리로 분류하는 함수
  categorizePlaceTypes: (types) => {
    if (!types || types.length === 0) {
      return { primaryCategory: '기타', categories: ['기타'] };
    }

    const categories = new Set();
    let primaryCategory = '기타';

    // Google Places API type을 한글 카테고리로 매핑
    const typeMap = {
      // 숙소 (Accommodation)
      lodging: '숙소', hotel: '숙소', motel: '숙소', resort: '숙소', hostel: '숙소',
      // 식당 (Restaurant)
      restaurant: '식당', food: '식당', meal_takeaway: '식당', meal_delivery: '식당', bar: '식당',
      // 카페 (Cafe)
      cafe: '카페', coffee_shop: '카페',
      // 상점 (Store)
      store: '상점', shopping_mall: '상점', book_store: '상점', clothing_store: '상점',
      department_store: '상점', electronics_store: '상점', furniture_store: '상점',
      hardware_store: '상점', home_goods_store: '상점', jewelry_store: '상점',
      pet_store: '상점', shoe_store: '상점', supermarket: '상점', convenience_store: '상점',
      pharmacy: '상점', liquor_store: '상점', florist: '상점',
      // 명소 (Attraction)
      point_of_interest: '명소', tourist_attraction: '명소', amusement_park: '명소',
      aquarium: '명소', art_gallery: '명소', museum: '명소', park: '명소', zoo: '명소',
      stadium: '명소', landmark: '명소', place_of_worship: '명소',
      hindu_temple: '명소', church: '명소', mosque: '명소', synagogue: '명소',
      // 기타/다중 분류 (Other/Multi-category)
      bakery: '기타/상점/카페/식당', // 베이커리는 문맥에 따라 다르게 분류될 수 있음
      // 'establishment'는 너무 광범위하므로 다른 유형이 없을 때만 고려
      establishment: '기타',
    };

    // primaryCategory 결정을 위한 카테고리 우선순위 (높은 순서)
    const categoryOrder = ['카페', '식당', '숙소', '상점', '명소', '기타'];

    for (const type of types) {
      const mappedCategory = typeMap[type];
      if (mappedCategory) {
        // 다중 카테고리 (예: '기타/상점/카페/식당') 처리
        if (mappedCategory.includes('/')) {
          mappedCategory.split('/').forEach(cat => categories.add(cat));
        } else {
          categories.add(mappedCategory);
        }
      } else {
        categories.add('기타'); // 매핑되지 않은 타입은 '기타'로 분류
      }
    }

    // primaryCategory 결정 로직
    for (const orderCat of categoryOrder) {
      if (categories.has(orderCat)) {
        primaryCategory = orderCat;
            break; // 우선순위가 높은 카테고리를 찾으면 중단
      }
    }

    // 특정 타입에 대한 primaryCategory 예외 처리 (e.g., bakery)
    // 다른 더 명확한 카테고리가 없으면 '상점'으로 우선 지정
    if (types.includes('bakery')) {
      if (!categories.has('식당') && !categories.has('카페')) {
        primaryCategory = '상점';
      }
    }

    return {
      primaryCategory: primaryCategory, // 주요 카테고리 (UI 표시용)
      categories: Array.from(categories) // 모든 관련 카테고리
    };
  },

  // --- 액션 (Actions) ---
  // 내부 헬퍼: 장소 상세 정보를 가져와 처리하는 비동기 함수
  _fetchAndProcessPlaceDetails: (placeId) => {
    return new Promise((resolve, reject) => {
      const { placesService, categorizePlaceTypes } = get();
      if (!placesService) {
        console.error('PlacesService is not initialized.');
        return reject(new Error('PlacesService is not initialized.'));
      }

      const request = {
        placeId: placeId,
        fields: [
          'place_id', 'name', 'formatted_address', 'geometry', 'photos',
          'rating', 'types', 'user_ratings_total', 'reviews', 'opening_hours',
          'website', 'international_phone_number'
        ],
      };

      placesService.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const { primaryCategory, categories } = categorizePlaceTypes(place.types);
          const photoUrl = place.photos && place.photos.length > 0
            ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 })
            : null;

          const processedPlace = {
            ...place,
            googlePlaceId: place.place_id,
            primaryCategory,
            categories,
            photoUrl,
          };
          resolve(processedPlace);
        } else {
          console.error(`Place details request failed for placeId ${placeId} with status: ${status}`);
          reject(new Error(`Failed to fetch place details: ${status}`));
        }
      });
    });
  },

  setMapInstance: (map) => set({ mapInstance: map }),
  setPlacesService: (service) => set({ placesService: service }),
  setPlaceConstructor: (constructor) => set({ placeConstructor: constructor }),
  setInputValue: (value) => set({ inputValue: value }),
  setLastMapPosition: (position) => set({ lastMapPosition: position }),
  setIsMapVisible: (isVisible) => set({ isMapVisible: isVisible }),
  setIsPlaceDetailModalOpen: (isOpen) => set({ isPlaceDetailModalOpen: isOpen }),
  closePlaceDetailModal: () => set({ isPlaceDetailModalOpen: false }),
  clearSearch: () => {
    const { isPlaceDetailModalOpen } = get();
    // 상세 정보 모달이 열려있을 때는 검색창을 닫지 않음
    if (isPlaceDetailModalOpen) {
      set({ inputValue: '', autocompletePredictions: [] });
      return;
    }

    set({
      inputValue: '',
      searchResults: [],
      hasSearched: false,
      isSearching: false,
      autocompletePredictions: [],
    });
  },

  fetchAutocompletePredictions: (input) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps JavaScript API with Places library is not loaded.');
      return;
    }

    if (!input) {
      set({ autocompletePredictions: [] });
      return;
    }

    const autocompleteService = new window.google.maps.places.AutocompleteService();
    autocompleteService.getPlacePredictions(
      { input },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          set({ autocompletePredictions: predictions, hasSearched: false });
        } else {
          set({ autocompletePredictions: [] });
        }
      }
    );
  },

  handlePlaceSelection: async (placeId, openModal = true) => {
    const { placeConstructor, mapInstance, categorizePlaceTypes, panToPlace } = get();
    if (!placeConstructor || !placeId) {
      console.error('PlacesService not available or invalid placeId');
      return null;
    }

    try {
      const place = new placeConstructor({ id: placeId });

      const fieldsToFetch = [
        'id', 'displayName', 'formattedAddress', 'location', 'photos',
        'rating', 'types', 'websiteURI', 'userRatingCount', 'nationalPhoneNumber', 'reviews',
      ];

      await place.fetchFields({ fields: fieldsToFetch });

      const categorized = categorizePlaceTypes(place.types);
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName)}&query_place_id=${place.id}`;

      // --- 👇 여기가 핵심 수정 부분입니다 ---
      // getUrl() 대신 getURI()를 사용합니다.
      const photoUrls = (place.photos && place.photos.length > 0)
        ? place.photos.map(p => p.getURI())
        : [];
      // --- 👆 여기까지 ---


      const processedPlace = {
        googlePlaceId: place.id,
        placeName: place.displayName,
        address: place.formattedAddress,
        latitude: place.location.lat(),
        longitude: place.location.lng(),
        googleImg: photoUrls,
        rating: place.rating,
        ratingCount: place.userRatingCount,
        siteUrl: place.websiteURI,
        phoneNumber: place.nationalPhoneNumber,
        reviews: place.reviews ? place.reviews.map(r => ({ author_name: r.author_name, rating: r.rating, text: r.text, relative_time_description: r.relative_time_description })) : [],
        primaryCategory: categorized.primaryCategory,
        categories: categorized.categories,
        googleUrl: searchUrl,
      };

      set({
        selectedPlace: processedPlace,
        isPlaceDetailModalOpen: openModal,
      });

      if (mapInstance) {
        panToPlace(processedPlace);
      }
      return processedPlace;
    } catch (error) {
      console.error('장소 상세 정보 로딩 실패:', error);
      set({ isPlaceDetailModalOpen: false });
      return null;
    }
  },

  fetchDetailsAndAddBlock: async (placeId, position) => {
    const { handlePlaceSelection, addPlaceBlock } = get();
    const detailedPlace = await handlePlaceSelection(placeId, false);
    if (detailedPlace) {
      addPlaceBlock(detailedPlace, position);
    }
  },

  toggleBookmark: (place) => {
    set((state) => {
      const googlePlaceId = place.googlePlaceId || place.place_id;
      const isCurrentlyBookmarked = state.bookmarkedPlaces.some(
        (p) => (p.googlePlaceId || p.place_id) === googlePlaceId
      );

      const newBookmarkedPlaces = isCurrentlyBookmarked
        ? state.bookmarkedPlaces.filter(
            (p) => (p.googlePlaceId || p.place_id) !== googlePlaceId
          )
        : [...state.bookmarkedPlaces, { ...place, googlePlaceId }];

      // searchResults의 북마크 상태 업데이트
      const newSearchResults = state.searchResults.map((p) =>
        (p.googlePlaceId || p.place_id) === googlePlaceId
          ? { ...p, isBookmarked: !isCurrentlyBookmarked }
          : p
      );

      // selectedPlace의 북마크 상태 업데이트
      const newSelectedPlace =
        state.selectedPlace &&
        (state.selectedPlace.googlePlaceId || state.selectedPlace.place_id) ===
          googlePlaceId
          ? { ...state.selectedPlace, isBookmarked: !isCurrentlyBookmarked }
          : state.selectedPlace;

      return {
        bookmarkedPlaces: newBookmarkedPlaces,
        searchResults: newSearchResults,
        selectedPlace: newSelectedPlace,
      };
    });
  },

  isBookmarked: (googlePlaceId) => {
    if (!googlePlaceId) return false;
    const { bookmarkedPlaces } = get();
    return bookmarkedPlaces.some(p => (p.googlePlaceId || p.place_id) === googlePlaceId);
  },

  performTextSearch: () => {
    const { inputValue, placesService, mapInstance, categorizePlaceTypes } = get();
    if (!inputValue.trim() || !placesService) return;

    set({ isSearching: true, hasSearched: true, autocompletePredictions: [] });

    const request = {
      query: inputValue,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos', 'rating', 'types', 'user_ratings_total'],
    };

    if (mapInstance) {
      request.bounds = mapInstance.getBounds();
    }

    placesService.textSearch(request, (results, status, pagination) => {
      const { isLoadingMore, searchResults: currentResults } = get();

      if (status === 'OK' && results) {
        const processedResults = results.map(place => {
          const categorized = categorizePlaceTypes(place.types);
          return {
            ...place,
            primaryCategory: categorized.primaryCategory,
            categories: categorized.categories,
          };
        });

        const newSearchResults = isLoadingMore
          ? [...currentResults, ...processedResults]
          : processedResults;

        set({
          searchResults: newSearchResults,
          isSearching: false,
          isLoadingMore: false,
          pagination: pagination.hasNextPage ? pagination : null,
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

  // Other actions can be kept as they are if they don't need changes.
  // For example:
  addPlaceBlock: (place, position) => {
    const newBlock = {
      ...place,
      id: Date.now() + Math.random(),
      position,
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

  panToPlace: (place) => {
    const { mapInstance } = get();
    if (!mapInstance || !place) return;

    let location;
    if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
      location = { lat: place.latitude, lng: place.longitude };
    } else if (place.geometry && typeof place.geometry.location?.lat === 'function') {
      location = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    } else {
      console.error('panToPlace: Could not determine location from place object.', place);
      return;
    }

    mapInstance.panTo(location);
    mapInstance.setZoom(15);

    set({
      markerPosition: location,
      markerType: place.primaryCategory || '기타',
    });
  },

  // === 일차별 마커 액션 ===
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
    set({ 
      dayMarkers: [], 
      showDayMarkers: false 
    });
  },
}));

export default useMapStore;