import { useEffect, useMemo } from 'react';
import useBookmarkWebSocket from './useBookmarkWebSocket';
import useBookmarkStore from '../store/mapStore/useBookmarkStore';

// PlanPage 전용: 단일 Bookmark WS 연결을 생성하고 전역 스토어에 sender를 주입
export function usePlanBookmarkWS({ planId, accessToken }) {
  const wsHeaders = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  const {
    handleBookmarkWsMessage,
    setBookmarkWsSenders,
    clearBookmarkWsSenders,
  } = useBookmarkStore();

  const { sendCreate, sendDelete } = useBookmarkWebSocket({
    planId,
    onMessage: handleBookmarkWsMessage,
    headers: wsHeaders,
  });

  useEffect(() => {
    setBookmarkWsSenders({ sendCreate, sendDelete });
    return () => {
      clearBookmarkWsSenders();
    };
  }, [sendCreate, sendDelete, setBookmarkWsSenders, clearBookmarkWsSenders]);
}
