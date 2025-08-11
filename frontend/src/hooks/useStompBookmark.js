import { useEffect, useRef, useState } from 'react';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useStompBookmark = ({ planId, onMessage }) => { 
  // onMessage : 메시지 수신 시 호출할 콜백 함수
  // planId : 북마크 세션 식별자(topic 식별에 사용)
  const clientRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [myUuid, setMyUuid] = useState(null);

  useEffect(() => {
    if (!planId) {
      console.log('📋 planId가 없어서 북마크 WebSocket 연결하지 않음');
      return;
    }

    const client = new Stomp.Client({
      webSocketFactory: () => new SockJS('http://70.12.247.36:8080/ws'),
      // STOMP 클라이언트가 사용하는 WebSocket 객체(SockJS) 생성

      reconnectDelay: 5000,
      debug: () => {}, // 필요하면 console.log로 바꿔도 됨
    });

    client.onConnect = () => {//연결 성공시
      console.log('[STOMP Bookmark] Connected');
      setConnectionStatus('CONNECTED');

      client.subscribe(`/topic/bookmark/${planId}`, (message) => {
        const body = JSON.parse(message.body);
        onMessage(body);// 북마크 관리에서 전달한 핸들러 실행
      });
    };

    client.onStompError = (frame) => {
      console.error('[STOMP Bookmark] Error:', frame.headers['message']);
      console.error('[STOMP Bookmark] Details:', frame.body);
      setConnectionStatus('DISCONNECTED');
    };

    client.activate();  //연결 시작
    clientRef.current = client; //참조 저장

    return () => {
      client.deactivate();
    };
  }, [planId, onMessage]);

  // type 데이터로 분기.ver
  const sendMessage = (type, payload) => { //북마크 관리에서 전송할 type과 payload 넘김
    const client = clientRef.current;
    if (client && client.connected) {
      client.publish({  //publish : 서버의 특정 Topic으로 메시지 보내는 작업
        destination: `/app/bookmark/${planId}`, // 서버에서 @MessageMapping("/bookmark/{planId}")로 받음
        body: JSON.stringify({ type, payload }),
      });
    } else {
      console.warn('북마크 WebSocket 연결이 준비되지 않음:', { 
        hasClient: !!client, 
        connected: client?.connected 
      });
    }
  };

  return { sendMessage, connectionStatus, myUuid };
};
