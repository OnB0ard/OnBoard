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
      // 서버가 { action, ...fields } 또는 { type, payload } 두 형식을 보낼 수 있어 표준화
      const { type, payload, action: topAction } = msg || {};
      const action = (topAction || type || '').toUpperCase();
      const payloadNorm = payload ?? msg; // payload가 없으면 전체 메시지를 payload로 간주
      switch (action) {
        case 'CREATE_PLACE': {
          const { type: payloadType, objectInfo, whiteBoardPlace, whiteBoardObjectId, placeId } = payloadNorm || {};
          if (payloadType && payloadType !== 'PLACE') break;
          if (!objectInfo || !whiteBoardPlace) break;
          const position = { x: objectInfo.x, y: objectInfo.y };
          const place = {
            placeId: placeId,
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
          try {
            console.groupCollapsed('[PlaceBlock][RECV] MOVE');
            console.log('payload:', payload);
            console.groupEnd();
          } catch (_) { void 0; }
          const { type: payloadType, whiteBoardObjectId, id, objectInfo } = payloadNorm || {};
          if (payloadType && payloadType !== 'PLACE') break;
          const targetId = whiteBoardObjectId ?? id;
          if (!targetId) break;
          const x = (objectInfo && objectInfo.x != null) ? objectInfo.x : payloadNorm?.x;
          const y = (objectInfo && objectInfo.y != null) ? objectInfo.y : payloadNorm?.y;
          if (typeof x === 'number' && typeof y === 'number') {
            updatePlaceBlockPosition(targetId, { x, y }, planId);
          }
          break;
        }
        case 'MODIFY': {
          try {
            console.groupCollapsed('[PlaceBlock][RECV] MODIFY');
            console.log('payload:', payload);
            console.groupEnd();
          } catch (_) { void 0; }
          const { type: payloadType, whiteBoardObjectId, id, objectInfo } = payloadNorm || {};
          if (payloadType && payloadType !== 'PLACE') break;
          const targetId = whiteBoardObjectId ?? id;
          if (!targetId) break;
          // 최종 커밋: 좌표 갱신
          const x = (objectInfo && objectInfo.x != null) ? objectInfo.x : payloadNorm?.x;
          const y = (objectInfo && objectInfo.y != null) ? objectInfo.y : payloadNorm?.y;
          if (typeof x === 'number' && typeof y === 'number') {
            updatePlaceBlockPosition(targetId, { x, y }, planId);
          }
          // temp 캐시는 현재 별도로 운용하지 않으므로 no-op
          break;
        }
        case 'DELETE': {
          try {
            console.groupCollapsed('[PlaceBlock][RECV] DELETE');
            console.log('payload:', payload);
            console.groupEnd();
          } catch (_) { void 0; }
          const { type: payloadType, whiteBoardObjectId, id } = payloadNorm || {};
          if (payloadType && payloadType !== 'PLACE') break;
          const targetId = whiteBoardObjectId ?? id;
          if (!targetId) break;
          removePlaceBlock(targetId);
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
