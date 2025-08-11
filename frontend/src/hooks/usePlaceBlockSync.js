import { useMemo } from 'react';
import { usePlaceBlocksStore } from '../store/mapStore';
import { useStompPlaceBlock } from './useStompPlaceBlock';

/**
 * usePlaceBlockSync
 * - STOMP(WebSocket) 연결을 캡슐화하고, 수신 메시지를 Zustand 스토어에 반영합니다.
 * - PlanPage 등 UI 컴포넌트는 이 훅을 통해 sendMessage만 사용하면 됩니다.
 *
 * @param {object} params
 * @param {string|number} params.planId - 현재 플랜 ID
 * @param {string} params.accessToken - 인증 토큰
 * @param {string} [params.wsUrl] - WS 엔드포인트
 * @returns {{
 *   sendMessage: (type: string, payload: any) => void,
 *   connectionStatus: string,
 * }}
 */
export function usePlaceBlockSync({ planId, accessToken, wsUrl = 'https://i13a504.p.ssafy.io/ws' }) {
  const {
    addPlaceBlock,
    removePlaceBlock,
    updatePlaceBlockPosition,
  } = usePlaceBlocksStore();

  const onMessage = useMemo(() => (msg) => {
    try {
      const { type, payload } = msg || {};
      switch (type) {
        case 'CREATE_PLACE': {
          const { objectInfo, whiteBoardPlace, whiteBoardObjectId } = payload || {};
          if (!objectInfo || !whiteBoardPlace) break;
          const position = { x: objectInfo.x, y: objectInfo.y };
          const place = {
            id: whiteBoardObjectId,
            googlePlaceId: whiteBoardPlace.googlePlaceId,
            placeName: whiteBoardPlace.placeName,
            address: whiteBoardPlace.address,
            latitude: whiteBoardPlace.latitude,
            longitude: whiteBoardPlace.longitude,
            googleImg: whiteBoardPlace.imageUrl ? [whiteBoardPlace.imageUrl] : [],
            rating: whiteBoardPlace.rating,
            ratingCount: whiteBoardPlace.ratingCount,
            siteUrl: whiteBoardPlace.siteUrl,
            placeUrl: whiteBoardPlace.placeUrl,
            phoneNumber: whiteBoardPlace.phoneNumber,
            primaryCategory: whiteBoardPlace.category,
          };
          addPlaceBlock(place, position, planId);
          break;
        }
        case 'MOVE': {
          const { whiteBoardObjectId, objectInfo } = payload || {};
          if (!whiteBoardObjectId || !objectInfo) break;
          updatePlaceBlockPosition(whiteBoardObjectId, { x: objectInfo.x, y: objectInfo.y }, planId);
          break;
        }
        case 'DELETE': {
          const { whiteBoardObjectId } = payload || {};
          if (!whiteBoardObjectId) break;
          removePlaceBlock(whiteBoardObjectId, planId);
          break;
        }
        default:
          break;
      }
    } catch (e) {
      // 수신 처리에서의 모든 예외는 콘솔에만 남기고 앱이 죽지 않게 함
      console.warn('[usePlaceBlockSync] onMessage error:', e);
    }
  }, [addPlaceBlock, removePlaceBlock, updatePlaceBlockPosition, planId]);

  const { sendMessage, connectionStatus } = useStompPlaceBlock({
    planId,
    accessToken,
    wsUrl,
    onMessage,
  });

  return { sendMessage, connectionStatus };
}
