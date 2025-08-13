import { useCallback } from 'react';
import { useStompDaySchedule } from '@/hooks/useStompDaySchedule';

// PlanPage 전용: DaySchedule STOMP 연결 래퍼 훅
// 사용법: const { connected, createDay, renameDay, moveDayRealtime, updateSchedule, deleteDay } = usePlanDayScheduleWS({ planId, accessToken });
export function usePlanDayScheduleWS({ planId, accessToken, wsUrl = 'https://i13a504.p.ssafy.io/ws' }) {
  const handleDayScheduleMessage = useCallback((msg) => {
    // 공통 로깅 (필요 시 외부 콜백으로 확장 가능)
    console.groupCollapsed('[DaySchedule][RECV]', msg?.action);
    console.log(msg);
    console.groupEnd();
  }, []);

  const day = useStompDaySchedule({
    planId,
    wsUrl,
    accessToken,
    onMessage: handleDayScheduleMessage,
    onSubscribed: () => {
      console.log('[DaySchedule] subscribed');
    },
  });

  return day;
}
