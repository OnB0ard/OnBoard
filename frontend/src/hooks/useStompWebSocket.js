// src/hooks/useStompWebSocket.js
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useStompWebSocket = ({
  planId,
  wsUrl,
  onMessage,
  accessToken,
  onSubscribed,   // ← 새로 추가: 구독 완료 시 호출
}) => {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const connectedRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const onSubscribedRef = useRef(onSubscribed);
  const planIdRef = useRef(planId);
  const tokenRef = useRef(accessToken); 
  const outboxRef = useRef([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onSubscribedRef.current = onSubscribed; }, [onSubscribed]);
  useEffect(() => { planIdRef.current = planId; }, [planId]);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  useEffect(() => {
    if (clientRef.current) return;
    const base = wsUrl || `${location.protocol}//${location.host}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(base),
      reconnectDelay: 5000,
      // 하트비트 주기를 줄여 idle 타임아웃과 백그라운드 스로틀에 더 견고하게 대응
      heartbeatIncoming: 5000,
      heartbeatOutgoing: 5000,
      debug: (str) => console.log('[STOMP raw]', str),

      onConnect: (frame) => {
        connectedRef.current = true;
        setConnected(true);
        console.log('[WS] connected. frame headers:', frame?.headers);
        // pending publish flush
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
      try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS] unsubscribe cleanup error', e); }
      subRef.current = null;
      if (clientRef.current?.active) clientRef.current.deactivate();
      clientRef.current = null;
    };
  }, [wsUrl]);

  // 토큰 변경 시 안전한 재연결(헤더 갱신 -> deactivate -> activate)
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    if (!tokenRef.current || tokenRef.current.length < 10) {
      console.warn('[WS] token missing -> keep disconnected');
      if (client.active) client.deactivate();
      return;
    }

    client.connectHeaders = { Authorization: `Bearer ${tokenRef.current}` };

    if (client.active) {
      try {
        client
          .deactivate()
          .then(() => client.activate())
          .catch((e) => {
            console.warn('[WS] deactivate failed, re-activating anyway', e);
            client.activate();
          });
      } catch (e) {
        console.warn('[WS] deactivate threw, re-activating anyway', e);
        client.activate();
      }
    } else {
      client.activate();
    }
  }, [accessToken]);

  // 탭이 다시 보일 때 연결이 없으면 재연결 시도
  useEffect(() => {
    const onVisibility = () => {
      const client = clientRef.current;
      if (!client) return;
      if (document.visibilityState === 'visible' && !client.connected) {
        try { client.activate(); } catch (e) { console.debug('[WS] visibility activate error', e); }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // 연결 + planId 준비시 구독/재구독
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connectedRef.current) return;

    if (planIdRef.current == null) {
      console.warn('[WS] planId missing -> skip subscribe');
      return;
    }

    // 기존 구독 해제 후 새 토픽 구독
    try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS] previous unsubscribe error', e); }
    subRef.current = client.subscribe(
      `/topic/whiteboard/${planIdRef.current}`,
      (msg) => {
        try {
          // 일부 브로커/프록시에서 \u0000(널문자) 끝에 붙는 경우가 있어 안전 파싱
          const raw = typeof msg.body === 'string'
            ? (function trimNulls(s) { let t = s; while (t.endsWith('\u0000')) { t = t.slice(0, -1); } return t; })(msg.body)
            : msg.body;
          const body = JSON.parse(raw);
          onMessageRef.current?.(body);
        } catch (e) {
          console.error('[STOMP] JSON parse error:', e, 'raw:', msg?.body);
        }
      }
    );
    console.log('[WS] SUBSCRIBE -> /topic/whiteboard/' + planIdRef.current);

    // 구독 완료 콜백 (여기서 초기 GET을 트리거 하도록 WhiteBoard에서 사용)
    onSubscribedRef.current?.(planIdRef.current);

    return () => {
      try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS] unsubscribe error', e); }
      subRef.current = null;
    };
  }, [connected, planId]); // planId 바뀌면 재구독

  const sendMessage = (action, payload = {}) => {
    const client = clientRef.current;

    if (planIdRef.current == null) {
      console.warn('[WS] send skipped: missing planId');
      return;
    }

    const destination = `/app/whiteboard/${planIdRef.current}`;
    const publishPayload = {
      destination,
      body: JSON.stringify({ action, ...payload }),
      headers: { 'content-type': 'application/json' },
    };

    try {
      const parsed = { action, ...payload };
      // 전송 로그: 목적지 planId와 body 내 whiteBoardId 동시 확인
      console.groupCollapsed('[WS][SEND]');
      console.log('destination:', destination);
      if (parsed && typeof parsed === 'object') {
        console.log('body.action:', parsed.action);
        console.log('body.whiteBoardId:', parsed.whiteBoardId);
      }
      console.groupEnd();
    } catch (_) {
      // ignore logging errors
    }

    if (client && client.connected) client.publish(publishPayload);
    else outboxRef.current.push(publishPayload);
  };

  return { sendMessage, connected };
};
