// hooks/useMouseWebSocket.js
import { useEffect, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import throttle from 'lodash.throttle';

/**
 * WebSocket 연결과 마우스 좌표 전송을 담당하는 커스텀 훅
 * @param {string} username 사용자 이름 (쿼리 파라미터로 전송)
 * @param {string} url WebSocket 서버 주소
 * @param {number} throttleMs 메시지 전송 제한 시간 (ms)
 */
export const useMouseWebSocket = ({ username, url = 'ws://70.12.247.38:8000', throttleMs = 50 }) => {
  
  //useWebSocket(...) 반환값 구조
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(url, {
    queryParams: { username },
    share: true,
    retryOnError: true,
    shouldReconnect: () => true,
  });

  const throttledSend = useRef(throttle(sendJsonMessage, throttleMs));

  useEffect(() => {
    // 최초 초기화 시 (0,0) 위치 전송
    sendJsonMessage({ x: 0, y: 0 });

    // 핸들러 정의
    const handleMouseMove = (e) => {
      throttledSend.current({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 💡 클린업 필수!
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      throttledSend.current.cancel(); // throttle clear
    };
  }, [sendJsonMessage]);

  return {
    lastJsonMessage,
    readyState,
    sendJsonMessage, // 필요시 외부에서 수동 호출도 가능
  };
};
