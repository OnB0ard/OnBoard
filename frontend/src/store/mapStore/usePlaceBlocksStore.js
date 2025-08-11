import { create } from 'zustand';
import usePlaceDetailsStore from './usePlaceDetailsStore';
import useMapCoreStore from './useMapCoreStore';

/**
 * Place Blocks Store
 * Manages place blocks for UI interactions (방별로 저장)
 */
const usePlaceBlocksStore = create(
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
           id: place?.id ?? (Date.now() + Math.random()),
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
          // Debug log: print updated coordinates whenever a PlaceBlock moves
          try {
            const updated = updatedBlocks.find((b) => b.id === id);
            if (updated) {
              console.log('📍 PlaceBlock position updated', {
                id,
                placeName: updated.placeName,
                position: updated.position,
              });
            } else {
              console.log('📍 PlaceBlock position updated (block not found after update)', { id, position });
            }
          } catch (e) {
            console.warn('Failed to log updated PlaceBlock position', e);
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

      // 서버 초기 로드(REST)로 받은 whiteBoardPlaces를 로컬 스토어로 치환
      // serverPlaces: Array<any> (화이트보드 장소 DTO 목록)
      // planIdOverride: number | string (명시적 planId 지정)
      replaceAllFromServer: (serverPlaces = [], planIdOverride) => {
        const currentPlanId = planIdOverride || get().activePlanId;
        if (!currentPlanId) {
          console.error('[PlaceBlocksStore] replaceAllFromServer: active planId not set');
          return;
        }

        // 서버 DTO -> 로컬 PlaceBlock 형태로 매핑
        const mapped = (Array.isArray(serverPlaces) ? serverPlaces : []).map((d) => {
          try {
            const id = d?.whiteBoardObjectId ?? d?.id ?? (Date.now() + Math.random());
            const obj = d?.objectInfo || d || {};
            const x = Number(obj.x ?? d?.x ?? 0);
            const y = Number(obj.y ?? d?.y ?? 0);

            const wp = d?.whiteBoardPlace || d?.place || {};
            const place = {
              id,
              googlePlaceId: wp.googlePlaceId ?? wp.placeId ?? null,
              placeName: wp.placeName ?? wp.name ?? 'Unknown Place',
              address: wp.address ?? null,
              latitude: wp.latitude ?? null,
              longitude: wp.longitude ?? null,
              googleImg: wp.imageUrl ? [wp.imageUrl] : (Array.isArray(wp.googleImg) ? wp.googleImg : []),
              rating: wp.rating ?? null,
              ratingCount: wp.ratingCount ?? null,
              siteUrl: wp.siteUrl ?? null,
              placeUrl: wp.placeUrl ?? null,
              phoneNumber: wp.phoneNumber ?? null,
              primaryCategory: wp.category ?? wp.primaryCategory ?? null,
            };
            return { ...place, position: { x, y } };
          } catch (e) {
            console.warn('[PlaceBlocksStore] Failed to map server place item', d, e);
            return null;
          }
        }).filter(Boolean);

        set((state) => ({
          placeBlocksByPlan: {
            ...state.placeBlocksByPlan,
            [currentPlanId]: mapped,
          },
          placeBlocks: mapped,
        }));
      },

      // PlaceBlock 마커 숨김/표시 관리
      setHidePlaceBlockMarkers: (hide) => {
        set({ hidePlaceBlockMarkers: hide });
      },
      
      fetchDetailsAndAddBlock: async (placeId, position, planIdOverride, onWebSocketMessage) => {
        // planId는 반드시 호출부에서 명시적으로 전달하도록 강제
        const numericPlanId = Number(planIdOverride);
        if (!Number.isFinite(numericPlanId) || numericPlanId <= 0) {
          console.error('[PlaceBlock] Invalid planId for place block operation. Received:', planIdOverride);
          return null;
        }

        const { _fetchAndProcessPlaceDetails } = usePlaceDetailsStore.getState();
        try {
          const placeDetails = await _fetchAndProcessPlaceDetails(placeId);
          if (placeDetails) {
            if (onWebSocketMessage) {
              const objectInfo = { x: position.x, y: position.y };
              // placeDetails는 usePlaceDetailsStore의 processedPlace 형태
              const whiteBoardPlace = {
                googlePlaceId: placeDetails.googlePlaceId ?? placeId,
                placeName: placeDetails.placeName,
                latitude: placeDetails.latitude,
                longitude: placeDetails.longitude,
                address: placeDetails.address,
                rating: placeDetails.rating,
                ratingCount: placeDetails.ratingCount,
                placeUrl: placeDetails.placeUrl,
                phoneNumber: placeDetails.phoneNumber,
                siteUrl: placeDetails.siteUrl,
                imageUrl: Array.isArray(placeDetails.googleImg) && placeDetails.googleImg.length > 0 ? placeDetails.googleImg[0] : null,
                category: placeDetails.primaryCategory,
              };
              const cleanedWhiteBoardPlace = Object.fromEntries(
                Object.entries(whiteBoardPlace).filter(([, v]) => v !== null && v !== undefined && v !== '')
              );
              try {
                console.groupCollapsed('[WS][placeblock][SEND] CREATE_PLACE');
                console.log('destination planId (path):', numericPlanId);
                console.log('body.whiteBoardId:', numericPlanId);
                console.log('objectInfo:', objectInfo);
                console.log('whiteBoardPlace (cleaned):', cleanedWhiteBoardPlace);
                console.groupEnd();
              } catch (_) {
                // ignore logging errors
              }
              onWebSocketMessage('CREATE_PLACE', {
                whiteBoardId: numericPlanId,
                type: 'PLACE',
                objectInfo,
                whiteBoardPlace: cleanedWhiteBoardPlace,
              });
            }
            // 로컬 추가는 서버 에코(CREATE 수신)에서 수행
            return placeDetails;
          }
        } catch (error) {
          console.error('Failed to fetch place details for block:', error);
        }
        return null;
      }
    })
);

export default usePlaceBlocksStore;
