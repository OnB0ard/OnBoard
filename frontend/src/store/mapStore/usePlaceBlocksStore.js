import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import usePlaceDetailsStore from './usePlaceDetailsStore';
import useMapCoreStore from './useMapCoreStore';

/**
 * Place Blocks Store
 * Manages place blocks for UI interactions (방별로 저장)
 */
const usePlaceBlocksStore = create(
  persist(
    (set, get) => ({
      // --- Place Blocks State ---
      activePlanId: null, // 현재 활성화된 방 ID
      placeBlocksByPlan: {}, // 방별로 PlaceBlock 저장
      placeBlocks: [], // 현재 활성화된 방의 PlaceBlock들 (호환성을 위해 유지)
      hidePlaceBlockMarkers: false, // PlaceBlock 마커 숨김 상태
  
      // --- Place Blocks Actions ---
      setActivePlanId: (planId) => set((state) => {
        const currentBlocks = state.placeBlocksByPlan[planId] || [];
        return {
          activePlanId: planId,
          placeBlocks: currentBlocks,
        };
      }),

      addPlaceBlock: (place, position, planIdOverride) => {
         const currentPlanId = planIdOverride || get().activePlanId;
         if (!currentPlanId) {
           console.error('No active planId for place block operation.');
           return;
         }

         const newBlock = {
           ...place,
           id: Date.now() + Math.random(),
           position,
         };
         
         set((state) => {
           const currentPlanBlocks = state.placeBlocksByPlan[currentPlanId] || [];
           const newBlocksForPlan = [...currentPlanBlocks, newBlock];
           
           return {
             placeBlocksByPlan: {
               ...state.placeBlocksByPlan,
               [currentPlanId]: newBlocksForPlan,
             },
             placeBlocks: newBlocksForPlan, // 호환성을 위해 유지
           };
         });
         
         return newBlock;
       },

      removePlaceBlock: (id, planIdOverride) => {
        const currentPlanId = planIdOverride || get().activePlanId;
        if (!currentPlanId) {
          console.error('No active planId for place block operation.');
          return;
        }

        set((state) => {
          const currentPlanBlocks = state.placeBlocksByPlan[currentPlanId] || [];
          const updatedBlocks = currentPlanBlocks.filter((block) => block.id !== id);
          
          // 모든 PlaceBlock이 삭제되었을 때 임시 마커도 정리
          if (updatedBlocks.length === 0) {
            const { clearMarker } = useMapCoreStore.getState();
            clearMarker();
          }
          
          return {
            placeBlocksByPlan: {
              ...state.placeBlocksByPlan,
              [currentPlanId]: updatedBlocks,
            },
            placeBlocks: updatedBlocks, // 호환성을 위해 유지
          };
        });
      },

      updatePlaceBlockPosition: (id, position, planIdOverride) => {
        const currentPlanId = planIdOverride || get().activePlanId;
        if (!currentPlanId) {
          console.error('No active planId for place block operation.');
          return;
        }

        set((state) => {
          const currentPlanBlocks = state.placeBlocksByPlan[currentPlanId] || [];
          const updatedBlocks = currentPlanBlocks.map((block) => 
            block.id === id ? { ...block, position } : block
          );
          
          return {
            placeBlocksByPlan: {
              ...state.placeBlocksByPlan,
              [currentPlanId]: updatedBlocks,
            },
            placeBlocks: updatedBlocks, // 호환성을 위해 유지
          };
        });
      },

      // PlaceBlock 마커 숨김/표시 관리
      setHidePlaceBlockMarkers: (hide) => {
        set({ hidePlaceBlockMarkers: hide });
      },
      
             fetchDetailsAndAddBlock: async (placeId, position, planIdOverride, onWebSocketMessage) => {
         const currentPlanId = planIdOverride || get().activePlanId;
         if (!currentPlanId) {
           console.error('No active planId for place block operation.');
           return null;
         }

         const { _fetchAndProcessPlaceDetails } = usePlaceDetailsStore.getState();
         try {
           const placeDetails = await _fetchAndProcessPlaceDetails(placeId);
           if (placeDetails) {
             const newBlock = get().addPlaceBlock(placeDetails, position, currentPlanId);
             
             // WebSocket 메시지 전송 (콜백이 제공된 경우)
             if (onWebSocketMessage) {
               onWebSocketMessage('PLACEBLOCK_ADDED', {
                 place: placeDetails,
                 position
               });
             }
             
             return placeDetails;
           }
         } catch (error) {
           console.error('Failed to fetch place details for block:', error);
         }
         return null;
       }
    }),
    {
      name: 'place-blocks-per-plan', // localStorage key
      partialize: (state) => ({
        activePlanId: state.activePlanId,
        placeBlocksByPlan: state.placeBlocksByPlan,
        placeBlocks: state.placeBlocks,
      }),
    }
  )
);

export default usePlaceBlocksStore;
