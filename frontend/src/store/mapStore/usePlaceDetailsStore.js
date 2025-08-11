import { create } from 'zustand';
import { categorizePlaceTypes } from './utils';
import useMapCoreStore from './useMapCoreStore';

/**
 * Place Details Store
 * Handles place selection and detailed information
 */
const usePlaceDetailsStore = create((set, get) => ({
  // --- Place Details State ---
  selectedPlace: null,
  isPlaceDetailModalOpen: false,
  placeDetailPosition: { x: 0, y: 0 },
  
  // --- Place Details Actions ---
  setIsPlaceDetailModalOpen: (isOpen) => set({ isPlaceDetailModalOpen: isOpen }),
  
  setPlaceDetailPosition: (position) => set({ placeDetailPosition: position }),
  
  closePlaceDetailModal: () => set({ isPlaceDetailModalOpen: false }),
  
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  
  clearSelectedPlace: () => set({ selectedPlace: null }),
  
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
