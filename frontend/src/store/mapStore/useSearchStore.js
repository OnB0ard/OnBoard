import { create } from 'zustand';
import { categorizePlaceTypes } from './utils';
import useMapCoreStore from './useMapCoreStore';

/**
 * Search Store
 * Manages search, autocomplete and search results
 */
const useSearchStore = create((set, get) => ({
  // --- Search State ---
  inputValue: '',
  textQuery: '',
  searchResults: [],
  hasSearched: false,
  isSearching: false,
  pagination: null,
  autocompletePredictions: [],
  
  // --- Search Actions ---
  setInputValue: (value) => set({ inputValue: value }),
  
  clearSearch: () => {
    set({
      inputValue: '',
      searchResults: [],
      hasSearched: false,
      isSearching: false,
      pagination: null,
      autocompletePredictions: [],
    });
  },
  
  fetchAutocompletePredictions: (input) => {
    const placesService = useMapCoreStore.getState().placesService;
    const mapInstance = useMapCoreStore.getState().mapInstance;
    
    if (!placesService || !input) {
      set({ autocompletePredictions: [] });
      return;
    }
    
    // AutocompleteService 객체 생성
    const autocompleteService = new window.google.maps.places.AutocompleteService();
    
    const request = {
      input: input,
      types: ['establishment'], // 장소 유형으로 제한
    };
    
    if (mapInstance) {
      request.bounds = mapInstance.getBounds();
    }
    
    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        set({ autocompletePredictions: predictions });
      } else {
        set({ autocompletePredictions: [] });
      }
    });
  },
  
  performTextSearch: () => {
    const { inputValue, isSearching } = get();
    const placesService = useMapCoreStore.getState().placesService;
    const mapInstance = useMapCoreStore.getState().mapInstance;
    
    if (!placesService || !inputValue || isSearching) {
      return;
    }
    
    set({ 
      isSearching: true,
      hasSearched: true,
    });
    
    const request = {
      query: inputValue,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos', 'rating', 'types', 'user_ratings_total'],
    };
    
    if (mapInstance) {
      request.bounds = mapInstance.getBounds();
    }
    
    placesService.textSearch(request, (results, status, pagination) => {
      const { isLoadingMore, searchResults: currentResults } = get();
      // Simple log to inspect result shapes
      try {
        const len = Array.isArray(results) ? results.length : null;
        const sample = Array.isArray(results)
          ? results.slice(0, 3).map((r) => ({
              name: r?.name,
              place_id: r?.place_id,
              hasPhotos: !!r?.photos?.length,
              photoHasGetUrl: typeof r?.photos?.[0]?.getUrl === 'function',
            }))
          : null;
        // console.log('[textSearch]', { status, resultsLen: len, sample });
        console.log(results)
      } catch (e) {
        console.log('[textSearch:log-failed]', e);
      }
      
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
  
  loadMoreResults: () => {
    const { pagination, isLoadingMore } = get();
    
    if (!pagination || isLoadingMore) {
      return;
    }
    
    set({ isLoadingMore: true });
    
    pagination.nextPage();
  }
}));

export default useSearchStore;
