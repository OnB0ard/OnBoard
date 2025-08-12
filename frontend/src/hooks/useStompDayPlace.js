// src/hooks/useStompDayPlace.js
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * DayPlace 전용 STOMP 훅
 * - 구독: /topic/dayPlace/{planId}
 * - 발행: /app/dayPlace/{planId}
 * - 메시지 포맷: { action, ...payload }
 *
 * 액션 목록 (백엔드 컨트롤러 기준):
 *   CREATE: { dayScheduleId, placeId, indexOrder }
 *   RENAME: { dayScheduleId, dayPlaceId, memo }
 *   MOVE:   { ... } // 실시간 이동(저장 없음)
 *   UPDATE_INNER: { dayScheduleId, dayPlaceId, indexOrder, modifiedIndexOrder }
 *   UPDATE_OUTER: { dayScheduleId, dayPlaceId, modifiedDayScheduleId, indexOrder, modifiedIndexOrder }
 *   DELETE: { dayScheduleId, dayPlaceId }
 */
export const useStompDayPlace = ({ planId, wsUrl, accessToken, onMessage, onSubscribed }) => {
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

  // 클라이언트 초기화
  useEffect(() => {
    if (clientRef.current) return;
    const base = wsUrl || `${location.protocol}//${location.host}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(base),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('[STOMP raw]', str),
      onConnect: (frame) => {
        connectedRef.current = true;
        setConnected(true);
        console.log('[WS-DayPlace] connected', frame?.headers);
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
        console.warn('[WS-DayPlace] closed:', e?.code, e?.reason);
      },
      onStompError: (frame) => {
        console.error('[STOMP-DayPlace] Error:', frame.headers?.message);
        console.error('[STOMP-DayPlace] Details:', frame.body);
      },
      onWebSocketError: (e) => {
        console.error('[WS-DayPlace] Error:', e?.message || e);
      },
    });

    clientRef.current = client;

    return () => {
      try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS-DayPlace] unsubscribe cleanup error', e); }
      subRef.current = null;
      if (clientRef.current?.active) clientRef.current.deactivate();
      clientRef.current = null;
    };
  }, [wsUrl]);

  // 토큰 준비되면 활성화
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    if (!tokenRef.current || tokenRef.current.length < 10) {
      console.warn('[WS-DayPlace] token missing -> keep disconnected');
      if (client.active) client.deactivate();
      return;
    }

    if (connectedRef.current && client.active) return;

    client.connectHeaders = { Authorization: `Bearer ${tokenRef.current}` };
    client.activate();
  }, [accessToken]);

  // 구독/재구독
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connectedRef.current) return;

    if (planIdRef.current == null) {
      console.warn('[WS-DayPlace] planId missing -> skip subscribe');
      return;
    }

    try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS-DayPlace] previous unsubscribe error', e); }
    subRef.current = client.subscribe(
      `/topic/dayPlace/${planIdRef.current}`,
      (msg) => {
        try {
          const raw = typeof msg.body === 'string' ? msg.body.replace('\u0000+$', '') : msg.body;
          const body = JSON.parse(raw);
          onMessageRef.current?.(body);
        } catch (e) {
          console.error('[STOMP-DayPlace] JSON parse error:', e, 'raw:', msg?.body);
        }
      }
    );
    console.log('[WS-DayPlace] SUBSCRIBE -> /topic/dayPlace/' + planIdRef.current);

    onSubscribedRef.current?.(planIdRef.current);

    return () => {
      try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS-DayPlace] unsubscribe error', e); }
      subRef.current = null;
    };
  }, [connected, planId]);

  const publish = (action, payload = {}) => {
    const client = clientRef.current;
    if (planIdRef.current == null) {
      console.warn('[WS-DayPlace] send skipped: missing planId');
      return;
    }
    const destination = `/app/dayPlace/${planIdRef.current}`;
    const publishPayload = {
      destination,
      body: JSON.stringify({ action, ...payload }),
      headers: { 'content-type': 'application/json' },
    };
    if (client && client.connected) client.publish(publishPayload);
    else outboxRef.current.push(publishPayload);
  };

  // 액션별 헬퍼
  const sendMessage = (type, payload = {}) => publish(type, payload);
  const createPlace = ({ dayScheduleId, placeId, indexOrder }) => publish('CREATE', { dayScheduleId, placeId, indexOrder });
  const renameMemo = ({ dayScheduleId, dayPlaceId, memo }) => publish('RENAME', { dayScheduleId, dayPlaceId, memo });
  const updateInner = ({ dayScheduleId, dayPlaceId, indexOrder, modifiedIndexOrder }) =>
    publish('UPDATE_INNER', { dayScheduleId, dayPlaceId, indexOrder, modifiedIndexOrder });
  const updateOuter = ({ dayScheduleId, dayPlaceId, modifiedDayScheduleId, indexOrder, modifiedIndexOrder }) =>
    publish('UPDATE_OUTER', { dayScheduleId, dayPlaceId, modifiedDayScheduleId, indexOrder, modifiedIndexOrder });
  const deletePlace = ({ dayScheduleId, dayPlaceId }) => publish('DELETE', { dayScheduleId, dayPlaceId });

  return {
    connected,
    sendMessage,
    createPlace,
    renameMemo,
    updateInner,
    updateOuter,
    deletePlace,
  };
};
