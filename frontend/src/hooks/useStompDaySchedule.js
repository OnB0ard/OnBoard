// src/hooks/useStompDaySchedule.js
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * DaySchedule 전용 STOMP 훅
 * - 구독: /topic/daySchedule/{planId}
 * - 발행: /app/daySchedule/{planId}
 * - 메시지 포맷: { action, ...payload }
 *
 * 액션 목록 (백엔드 컨트롤러 기준):
 *   CREATE: { title, dayOrder }
 *   RENAME: { dayScheduleId, title }
 *   MOVE: { dayScheduleId, dayOrder, modifiedDayOrder }   // 실시간 이동(저장 없음)
 *   UPDATE_SCHEDULE: { dayScheduleId, dayOrder, modifiedDayOrder }
 *   DELETE: { dayScheduleId }
 */
export const useStompDaySchedule = ({
  planId,
  wsUrl,
  accessToken,
  onMessage,
  onSubscribed,
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
        console.log('[WS-DaySchedule] connected', frame?.headers);
        // 보류된 publish 전송
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
        console.warn('[WS-DaySchedule] closed:', e?.code, e?.reason);
      },
      onStompError: (frame) => {
        console.error('[STOMP-DaySchedule] Error:', frame.headers?.message);
        console.error('[STOMP-DaySchedule] Details:', frame.body);
      },
      onWebSocketError: (e) => {
        console.error('[WS-DaySchedule] Error:', e?.message || e);
      },
    });

    clientRef.current = client;

    return () => {
      try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS-DaySchedule] unsubscribe cleanup error', e); }
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
      console.warn('[WS-DaySchedule] token missing -> keep disconnected');
      if (client.active) client.deactivate();
      return;
    }

    if (connectedRef.current && client.active) return; // 이미 연결됨

    client.connectHeaders = { Authorization: `Bearer ${tokenRef.current}` };
    client.activate();
  }, [accessToken]);

  // 구독/재구독
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connectedRef.current) return;

    if (planIdRef.current == null) {
      console.warn('[WS-DaySchedule] planId missing -> skip subscribe');
      return;
    }

    try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS-DaySchedule] previous unsubscribe error', e); }
    subRef.current = client.subscribe(
      `/topic/daySchedule/${planIdRef.current}`,
      (msg) => {
        try {
          const raw = typeof msg.body === 'string' ? msg.body.replace('\u0000+$', '') : msg.body;
          const body = JSON.parse(raw);
          onMessageRef.current?.(body);
        } catch (e) {
          console.error('[STOMP-DaySchedule] JSON parse error:', e, 'raw:', msg?.body);
        }
      }
    );
    console.log('[WS-DaySchedule] SUBSCRIBE -> /topic/daySchedule/' + planIdRef.current);

    onSubscribedRef.current?.(planIdRef.current);

    return () => {
      try { subRef.current?.unsubscribe(); } catch (e) { console.debug('[WS-DaySchedule] unsubscribe error', e); }
      subRef.current = null;
    };
  }, [connected, planId]);

  const publish = (action, payload = {}) => {
    const client = clientRef.current;

    if (planIdRef.current == null) {
      console.warn('[WS-DaySchedule] send skipped: missing planId');
      return;
    }

    const destination = `/app/daySchedule/${planIdRef.current}`;
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
  const createDay = ({ title, dayOrder }) => publish('CREATE', { title, dayOrder });
  const renameDay = ({ dayScheduleId, title }) => publish('RENAME', { dayScheduleId, title });
  const moveDayRealtime = ({ dayScheduleId, dayOrder, modifiedDayOrder }) =>
    publish('MOVE', { dayScheduleId, dayOrder, modifiedDayOrder });
  const updateSchedule = ({ dayScheduleId, dayOrder, modifiedDayOrder }) =>
    publish('UPDATE_SCHEDULE', { dayScheduleId, dayOrder, modifiedDayOrder });
  const deleteDay = ({ dayScheduleId }) => publish('DELETE', { dayScheduleId });

  return {
    connected,
    sendMessage,
    createDay,
    renameDay,
    moveDayRealtime,
    updateSchedule,
    deleteDay,
  };
};
