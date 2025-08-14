import { useMemo } from 'react';
import { useStompWebSocket } from './useStompWebSocket';

// useStompPlaceBlock
// - 내부적으로 화이트보드 토픽(`/topic/whiteboard/{planId}`)을 사용합니다.
// - 수신: { action, ...payload } -> onMessage({ type: action, payload })로 변환
// - 송신: sendMessage(type, payload) -> send(action=type, ...payload)
export const useStompPlaceBlock = ({ planId, onMessage, accessToken, wsUrl }) => {
  const handleIncoming = useMemo(() => {
    return (body) => {
      if (!body) return;
      const { action, ...rest } = body;
      if (!action) return;
      // 기존 컴포넌트 호환: { type, payload }
      onMessage?.({ type: action, payload: rest });
    };
  }, [onMessage]);

  const { sendMessage: sendWB, connected } = useStompWebSocket({
    planId,
    wsUrl,
    onMessage: handleIncoming,
    accessToken,
  });

  // 기존 시그니처 유지: sendMessage(type, payload)
  const sendMessage = (type, payload = {}) => {
    if (!type) return;
    // 화이트보드 규약: { action, ...payload }
    sendWB(type, payload || {});
  };

  const connectionStatus = connected ? 'CONNECTED' : 'DISCONNECTED';
  const myUuid = null; // 현재 UUID 에코 억제 미사용. 추후 필요 시 확장

  return { sendMessage, connectionStatus, myUuid };
};
