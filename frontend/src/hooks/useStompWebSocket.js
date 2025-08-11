// src/hooks/useStompWebSocket.js
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useStompWebSocket = ({ planId, wsUrl, onMessage, accessToken }) => {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const connectedRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const planIdRef = useRef(planId);
  const tokenRef = useRef(accessToken); 
  const outboxRef = useRef([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { planIdRef.current = planId; }, [planId]);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  useEffect(() => {
    if (clientRef.current) return;
    const base = wsUrl || `${location.protocol}//${location.host}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(base),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('[STOMP raw]', str),

      // ⚠️ 여기서는 구독하지 않습니다.
      onConnect: (frame) => {
        connectedRef.current = true;
        setConnected(true);
        console.log('[WS] connected. frame headers:', frame?.headers);
        // 큐 flush만
        if (outboxRef.current.length) {
          outboxRef.current.forEach((p) => client.publish(p));
          outboxRef.current = [];
        }
      },
      onDisconnect: () => {
        connectedRef.current = false;
        setConnected(false);
      },
      onWebSocketClose: (e) => {
        connectedRef.current = false;
        setConnected(false);
        console.warn('[WS] closed:', e?.code, e?.reason);
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers?.message);
        console.error('[STOMP] Details:', frame.body);
      },
      onWebSocketError: (e) => {
        console.error('[WS] Error:', e?.message || e);
      },
    });

    clientRef.current = client;

    return () => {
      try { subRef.current?.unsubscribe(); } catch {}
      subRef.current = null;
      if (clientRef.current?.active) clientRef.current.deactivate();
      clientRef.current = null;
    };
  }, [wsUrl]);

  // ✅ 토큰 준비되면 activate / 토큰 없으면 비활성화
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    if (!tokenRef.current || tokenRef.current.length < 10) {
      console.warn('[WS] token missing -> keep disconnected');
      if (client.active) client.deactivate();
      return;
    }

    if (connectedRef.current && client.active) return; // 이미 연결됨

    client.connectHeaders = { Authorization: `Bearer ${tokenRef.current}` };
    client.activate();
  }, [accessToken]);

  // ✅ 연결 + planId 준비시 구독/재구독
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connectedRef.current) return;

    if (!planIdRef.current && planIdRef.current !== 0) {
      console.warn('[WS] planId missing -> skip subscribe');
      return;
    }

    try { subRef.current?.unsubscribe(); } catch {}
    subRef.current = client.subscribe(
      `/topic/whiteboard/${planIdRef.current}`,
      (msg) => {
        try {
          const body = JSON.parse(msg.body);
          onMessageRef.current?.(body);
        } catch (e) {
          console.error('[STOMP] JSON parse error:', e);
        }
      }
    );
    console.log('[WS] SUBSCRIBE -> /topic/whiteboard/' + planIdRef.current);

    return () => {
      try { subRef.current?.unsubscribe(); } catch {}
      subRef.current = null;
    };
  }, [connected, planId]); // planId 바뀌면 재구독

  const sendMessage = (action, payload = {}) => {
    const client = clientRef.current;

    if (!planIdRef.current && planIdRef.current !== 0) {
      console.warn('[WS] send skipped: missing planId');
      return;
    }

    const destination = `/app/whiteboard/${planIdRef.current}`;
    const publishPayload = {
      destination,
      body: JSON.stringify({ action, ...payload }),
      headers: { 'content-type': 'application/json' },
    };

    if (client && client.connected) client.publish(publishPayload);
    else outboxRef.current.push(publishPayload);
  };

  return { sendMessage, connected };
};
