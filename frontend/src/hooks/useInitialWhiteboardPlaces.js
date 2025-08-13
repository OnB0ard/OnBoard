import { useEffect } from 'react';
import { usePlaceBlocksStore } from '../store/mapStore';
import { getWhiteBoardObjects } from '../apis/whiteBoardApi';

// planId 변경 시: 활성 plan 설정 + PLACE 타입 화이트보드 데이터 초기 로드
export function useInitialWhiteboardPlaces(planId) {
  const { setActivePlanId, replaceAllFromServer: replacePlaceBlocksFromServer } = usePlaceBlocksStore();

  // planId 활성화
  useEffect(() => {
    if (!planId) return;
    setActivePlanId(planId);
  }, [planId, setActivePlanId]);

  // 초기 PLACE 로드
  useEffect(() => {
    if (!planId) return;
    (async () => {
      try {
        const { whiteBoardPlaces } = await getWhiteBoardObjects(planId);
        replacePlaceBlocksFromServer(Array.isArray(whiteBoardPlaces) ? whiteBoardPlaces : [], planId);
      } catch (err) {
        console.error('화이트보드 PLACE 초기 로드 실패:', err);
      }
    })();
  }, [planId, replacePlaceBlocksFromServer]);
}
