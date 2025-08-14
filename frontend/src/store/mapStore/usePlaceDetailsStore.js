import { create } from 'zustand';
import { categorizePlaceTypes } from './utils';
import useMapCoreStore from './useMapCoreStore';
import { getPlaceDetail } from '@/apis/placeDetail';

/**
 * Place Details Store
 * Handles place selection and detailed information
 */
const usePlaceDetailsStore = create((set, get) => ({
  // --- Place Details State ---
  selectedPlace: null,
  isPlaceDetailModalOpen: false,
  placeDetailPosition: { x: 0, y: 0 },
  placeDetailAlign: 'sidebar', // 'sidebar' | 'center'
  
  // --- Place Details Actions ---
  setIsPlaceDetailModalOpen: (isOpen) => set({ isPlaceDetailModalOpen: isOpen }),
  
  setPlaceDetailPosition: (position) => set({ placeDetailPosition: position }),
  setPlaceDetailAlign: (align) => set({ placeDetailAlign: align }),
  
  closePlaceDetailModal: () => set({ isPlaceDetailModalOpen: false }),
  
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  
  clearSelectedPlace: () => set({ selectedPlace: null }),
  
  /**
   * Open Place Detail by backend placeId
   * - Fetches from our backend and maps fields to the modal format
   */
  openPlaceDetailByPlaceId: async (placeId, openModal = true, align = 'sidebar') => {
    if (!placeId) return null;
    try {
      const res = await getPlaceDetail(placeId);
      // API 컨테이너 유연 처리: body 또는 data 직접
      const data = (res && (res.body || res.data || res)) ?? null;
      if (!data) throw new Error('Empty place detail response');

      const processedPlace = {
        // 백엔드 DTO 매핑
        placeId: data.placeId,
        googlePlaceId: data.googlePlaceId,
        placeName: data.placeName,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        phoneNumber: data.phoneNumber,
        rating: data.rating,
        ratingCount: data.ratingCount,
        placeUrl: data.placeUrl,
        siteUrl: data.siteUrl,
        // 모달에서 기대하는 필드 호환
        googleImg: data.imageUrl ? [data.imageUrl] : [],
        primaryCategory: data.category || undefined,
        categories: data.category ? [data.category] : [],
        reviews: [], // 백엔드 스펙에 리뷰 없음
      };

      set({ selectedPlace: processedPlace, isPlaceDetailModalOpen: openModal, placeDetailAlign: align });

      // 맵 이동 (선택사항)
      try {
        const { panToPlace } = useMapCoreStore.getState();
        panToPlace?.(processedPlace);
      } catch (e) {
        console.debug('[placeDetail] panToPlace failed (backend case):', e);
      }

      return processedPlace;
    } catch (error) {
      console.error('[placeDetail] backend fetch failed:', error);
      set({ isPlaceDetailModalOpen: false });
      return null;
    }
  },

  /**
   * Open Place Detail from a candidate object
   * - If has placeId -> fetch from backend
   * - Else, open modal with best-effort mapping from candidate
   */
  openPlaceDetailFromCandidate: async (candidate, openModal = true, align = 'sidebar') => {
    try {
      if (!candidate) return null;
      const placeId = candidate.placeId ?? candidate.id ?? null;
      if (placeId) {
        return await get().openPlaceDetailByPlaceId(placeId, openModal, align);
      }

      // fallback: 후보 데이터를 그대로 모달에 매핑
      const processedPlace = {
        googlePlaceId: candidate.googlePlaceId ?? candidate.place_id,
        placeName: candidate.placeName ?? candidate.name ?? candidate.displayName,
        address: candidate.address ?? candidate.formatted_address,
        latitude: candidate.latitude ?? candidate.location?.lat?.() ?? candidate.geometry?.location?.lat?.(),
        longitude: candidate.longitude ?? candidate.location?.lng?.() ?? candidate.geometry?.location?.lng?.(),
        googleImg: candidate.googleImg || candidate.photos?.map(p => (typeof p.getUrl === 'function' ? p.getUrl({ maxWidth: 800, maxHeight: 600 }) : p)) || [],
        rating: candidate.rating,
        ratingCount: candidate.ratingCount ?? candidate.user_ratings_total,
        siteUrl: candidate.siteUrl ?? candidate.websiteURI ?? candidate.website,
        phoneNumber: candidate.phoneNumber ?? candidate.nationalPhoneNumber ?? candidate.formatted_phone_number,
        reviews: candidate.reviews || [],
        primaryCategory: candidate.primaryCategory,
        categories: candidate.categories || [],
        placeUrl: candidate.placeUrl,
      };

      set({ selectedPlace: processedPlace, isPlaceDetailModalOpen: openModal, placeDetailAlign: align });

      try {
        const { panToPlace } = useMapCoreStore.getState();
        panToPlace?.(processedPlace);
      } catch (_) {}

      return processedPlace;
    } catch (e) {
      console.error('[placeDetail] open from candidate failed:', e);
      set({ isPlaceDetailModalOpen: false });
      return null;
    }
  },
  
  handlePlaceSelection: async (placeId, openModal = true) => {
    const { placeConstructor, mapInstance } = useMapCoreStore.getState();
    const { panToPlace } = useMapCoreStore.getState();
    
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

      const photoUrls = (place.photos && place.photos.length > 0)
        ? place.photos.map(p => p.getURI())
        : [];

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
        reviews: place.reviews ? place.reviews.map(r => ({ 
          author_name: r.author_name, 
          rating: r.rating, 
          text: r.text, 
          relative_time_description: r.relative_time_description 
        })) : [],
        primaryCategory: categorized.primaryCategory,
        categories: categorized.categories,
        placeUrl: searchUrl,
      };

      set({
        selectedPlace: processedPlace,
        isPlaceDetailModalOpen: openModal,
        placeDetailAlign: 'sidebar',
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
  
  _fetchAndProcessPlaceDetails: async (placeId) => {
    const { placesService } = useMapCoreStore.getState();
    
    if (!placesService || !placeId) {
      console.error('PlacesService not available or invalid placeId');
      return null;
    }

    return new Promise((resolve, reject) => {
      placesService.getDetails(
        { placeId, fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'types', 'website', 'user_ratings_total', 'formatted_phone_number', 'reviews'] },
        (place, status) => {
          if (status !== 'OK' || !place) {
            reject(new Error('Failed to fetch place details'));
            return;
          }

          const categorized = categorizePlaceTypes(place.types);
          const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;

          const processedPlace = {
            googlePlaceId: place.place_id,
            placeName: place.name,
            address: place.formatted_address,
            latitude: place.geometry?.location.lat(),
            longitude: place.geometry?.location.lng(),
            googleImg: place.photos?.map(p => p.getUrl({ maxWidth: 800, maxHeight: 600 })) || [],
            rating: place.rating,
            ratingCount: place.user_ratings_total,
            siteUrl: place.website,
            phoneNumber: place.formatted_phone_number,
            reviews: place.reviews?.map(r => ({ 
              author_name: r.author_name, 
              rating: r.rating, 
              text: r.text, 
              relative_time_description: r.relative_time_description 
            })) || [],
            primaryCategory: categorized.primaryCategory,
            categories: categorized.categories,
            placeUrl: searchUrl,
          };

          resolve(processedPlace);
        }
      );
    });
  },
}));

export default usePlaceDetailsStore;
