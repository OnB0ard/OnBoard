import { create } from 'zustand';

/**
 * Core Map Store
 * Handles basic map functionality and Google Maps service instances
 */
const useMapCoreStore = create((set, get) => ({
  // --- Map State ---
  mapInstance: null,
  placesService: null,
  placeConstructor: null,
  isMapVisible: true,
  lastMapPosition: null,
  markerPosition: null,
  markerType: null,
  
  // --- Map Actions ---
  setMapInstance: (map) => set({ mapInstance: map }),
  
  setPlacesService: (service) => set({ placesService: service }),
  
  setPlaceConstructor: (constructor) => set({ placeConstructor: constructor }),
  
  setLastMapPosition: (position) => set({ lastMapPosition: position }),
  
  setIsMapVisible: (isVisible) => set({ isMapVisible: isVisible }),
  
  setMarker: (position, type = '기타') => set({ 
    markerPosition: position, 
    markerType: type 
  }),
  
  clearMarker: () => set({ 
    markerPosition: null, 
    markerType: null 
  }),
  
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
}));

export default useMapCoreStore;
