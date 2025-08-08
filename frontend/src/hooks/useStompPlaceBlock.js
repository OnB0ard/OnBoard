import { useEffect, useRef, useState } from 'react';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useStompPlaceBlock = ({ planId, onMessage }) => {
  const clientRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [myUuid, setMyUuid] = useState(null);

  useEffect(() => {
    if (!planId) {
      console.log('📋 planId가 없어서 PlaceBlock WebSocket 연결하지 않음');
      return;
    }

    const client = new Stomp.Client({
      webSocketFactory: () => new SockJS('http://70.12.247.36:8080/ws'),
      reconnectDelay: 5000,
      debug: () => {},
    });

    client.onConnect = () => {
      console.log('[STOMP PlaceBlock] Connected');
      setConnectionStatus('CONNECTED');

      client.subscribe(`/topic/placeblock/${planId}`, (message) => {
        const body = JSON.parse(message.body);
        onMessage(body);
      });
    };

    client.onStompError = (frame) => {
      console.error('[STOMP PlaceBlock] Error:', frame.headers['message']);
      console.error('[STOMP PlaceBlock] Details:', frame.body);
      setConnectionStatus('DISCONNECTED');
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [planId, onMessage]);

  const sendMessage = (type, payload) => {
    const client = clientRef.current;
    if (client && client.connected) {
      client.publish({
        destination: `/app/placeblock/${planId}`,
        body: JSON.stringify({ type, payload }),
      });
    } else {
      console.warn('PlaceBlock WebSocket 연결이 준비되지 않음:', {
        hasClient: !!client,
        connected: client?.connected
      });
    }
  };

  return { sendMessage, connectionStatus, myUuid };
};
