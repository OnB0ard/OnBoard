import { create } from 'zustand';
import usePlaceDetailsStore from './usePlaceDetailsStore';
import useMapCoreStore from './useMapCoreStore';

/**
 * Place Blocks Store
 * Manages place blocks for UI interactions
 */
const usePlaceBlocksStore = create((set, get) => ({
  // --- Place Blocks State ---
  placeBlocks: [],
  hidePlaceBlockMarkers: false, // PlaceBlock 마커 숨김 상태
  
  // --- Place Blocks Actions ---
  addPlaceBlock: (place, position) => {
    const newBlock = {
      ...place,
      id: Date.now() + Math.random(),
      position,
    };
    set((state) => ({ placeBlocks: [...state.placeBlocks, newBlock] }));
  },

  removePlaceBlock: (id) => {
    set((state) => {
      const updatedBlocks = state.placeBlocks.filter((block) => block.id !== id);
      
      // 모든 PlaceBlock이 삭제되었을 때 임시 마커도 정리
      if (updatedBlocks.length === 0) {
        const { clearMarker } = useMapCoreStore.getState();
        clearMarker();
      }
      
      return { placeBlocks: updatedBlocks };
    });
  },

  updatePlaceBlockPosition: (id, position) => {
    set((state) => ({
      placeBlocks: state.placeBlocks.map((block) => 
        block.id === id ? { ...block, position } : block
      ),
    }));
  },

  // PlaceBlock 마커 숨김/표시 관리
  setHidePlaceBlockMarkers: (hide) => {
    set({ hidePlaceBlockMarkers: hide });
  },
  
  fetchDetailsAndAddBlock: async (placeId, position) => {
    const { _fetchAndProcessPlaceDetails } = usePlaceDetailsStore.getState();
    try {
      const placeDetails = await _fetchAndProcessPlaceDetails(placeId);
      if (placeDetails) {
        get().addPlaceBlock(placeDetails, position);
        return placeDetails;
      }
    } catch (error) {
      console.error('Failed to fetch place details for block:', error);
    }
    return null;
  }
}));

export default usePlaceBlocksStore;
