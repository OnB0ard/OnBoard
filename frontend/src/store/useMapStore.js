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
  // processedPlace 객체를 받아 화이트보드에 블록을 추가하는 액션
  addPlaceBlock: (place, position) => {
    const newBlock = {
      ...place, // 상세 정보 전체를 복사
      id: Date.now() + Math.random(), // 고유 ID 생성
      position, // 드롭된 위치
    };
    set((state) => ({ placeBlocks: [...state.placeBlocks, newBlock] }));
  },

  // place_id로 상세 정보를 가져온 후 PlaceBlock을 추가하는 통합 액션
  fetchDetailsAndAddBlock: async (placeId, position) => {
    const { handlePlaceSelection, addPlaceBlock } = get();
    // 상세 정보를 비동기적으로 가져옵니다.
    const detailedPlace = await handlePlaceSelection(placeId);
    if (detailedPlace) {
      // 상세 정보를 기반으로 블록을 추가합니다.
      addPlaceBlock(detailedPlace, position);
    }
  },

  removePlaceBlock: (id) => {
    set((state) => ({ 
      placeBlocks: state.placeBlocks.filter((block) => block.id !== id) 
    }));
  },

  // Pin(PlaceBlock)의 위치를 업데이트하는 액션
  updatePlaceBlockPosition: (id, position) => {
    set((state) => ({
      placeBlocks: state.placeBlocks.map((block) => 
        block.id === id ? { ...block, position } : block
      ),
    }));
  },

  performTextSearch: () => {
    const { inputValue, placesService, mapInstance, categorizePlaceTypes } = get();
    if (!inputValue.trim() || !placesService) return;

    set({ isSearching: true, hasSearched: true, autocompletePredictions: [] });

    const request = {
      query: inputValue,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos', 'rating', 'types', 'userRatingCount'],
    };

    if (mapInstance) {
      request.bounds = mapInstance.getBounds();
    }

    placesService.textSearch(request, (results, status, pagination) => {
      const { isLoadingMore, searchResults: currentResults } = get();

      if (status === 'OK' && results) {
        // 검색 결과의 각 장소에 대해 types 데이터를 전처리하여 카테고리 정보를 추가
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
    const { placeConstructor, mapInstance, categorizePlaceTypes } = get();
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

      // 상세 정보로 가져온 장소의 types 데이터를 전처리하여 카테고리 정보 추가
      const categorized = categorizePlaceTypes(place.types);

      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName)}`;

      // Google Place 객체를 일반 객체로 변환하여 안정성을 확보합니다.
            // Photo 객체에서 URL을 미리 추출하여 문자열 배열로 변환합니다.

      const photoUrls = ''
            
      console.log(photoUrls); // 생성된 이미지 URL 배열 확인
      const processedPlace = {
        googlePlaceId: place.id,
        placeName: place.displayName,
        address: place.formattedAddress,
        latitude: place.location.lat(),
        longitude: place.location.lng(),
        googleImg: photoUrls, // URL 문자열 배열을 저장
        rating: place.rating,
        ratingCount: place.userRatingCount,
        siteUrl: place.websiteURI,
        phoneNumber: place.nationalPhoneNumber,
        reviews: place.reviews ? place.reviews.map(r => ({ author_name: r.author_name, rating: r.rating, text: r.text, relative_time_description: r.relative_time_description })) : [],
        primaryCategory: categorized.primaryCategory,
        categories: categorized.categories,
        googleUrl: searchUrl,
      };
      console.log(processedPlace)

      const newLocation = { lat: processedPlace.latitude, lng: processedPlace.longitude };

      set({
        selectedPlace: processedPlace,
        markerPosition: newLocation,
        markerType: categorized.primaryCategory,
      });

      if (mapInstance && newLocation) {
        mapInstance.panTo(newLocation);
        mapInstance.setZoom(15);
      }
      return processedPlace;
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