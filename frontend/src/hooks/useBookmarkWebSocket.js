import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * useBookmarkWebSocket
 * - SUBSCRIBE: /topic/bookmark/{planId}
 * - SEND: /app/bookmark/{planId}
 * 
 * Props:
 * - planId: number | string
 * - onMessage: (msg: any) => void  // receives parsed body
 * - headers?: object               // optional extra connect headers (e.g., auth)
 */
export default function useBookmarkWebSocket({ planId, onMessage, headers = {}, wsUrl = 'https://i13a504.p.ssafy.io/ws' }) {
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const connectedRef = useRef(false);
  const outboxRef = useRef([]); // queue publishes while disconnected
  const planIdRef = useRef(planId);
  const onMessageRef = useRef(onMessage);
  // inflight tracker for correlating SEND -> RECEIVED logs
  const inflightCreateRef = useRef({}); // key: googlePlaceId, value: { t:number, payload:object }

  useEffect(() => { planIdRef.current = planId; }, [planId]);

  const trySubscribe = useCallback((pid) => {
    const client = clientRef.current;
    if (!client || !connectedRef.current) return;
    if (subscriptionRef.current) {
      try { subscriptionRef.current.unsubscribe(); } catch (e) { console.warn('[WS][bookmark] unsubscribe failed:', e); }
      subscriptionRef.current = null;
    }
    if (pid === undefined || pid === null) return;
    const destination = `/topic/bookmark/${pid}`;
    console.log('[WS][bookmark] SUBSCRIBE ->', destination);
    subscriptionRef.current = client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        console.log('[WS][bookmark] RECEIVED:', body);
        if (body && body.action === 'CREATE') {
          const key = body.googlePlaceId || body.place?.googlePlaceId;
          if (key && inflightCreateRef.current[key]) {
            const started = inflightCreateRef.current[key].t;
            const rtt = Date.now() - started;
            console.log('[WS][bookmark] CREATE response matched. googlePlaceId:', key, 'placeId:', body.placeId, 'RTT(ms):', rtt);
            delete inflightCreateRef.current[key];
          }
        }
        onMessageRef.current?.(body);
      } catch (e) {
        console.error('[WS][bookmark] JSON parse error:', e, 'raw:', message.body);
      }
    });
  }, []);

  const connect = useCallback(() => {
    if (clientRef.current) return;

    const client = new Client({
      // SockJS factory; do not set brokerURL when using SockJS
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        ...headers,
      },
      debug: (str) => {
        // Uncomment for verbose STOMP frames
        // console.debug('[WS][bookmark][debug]', str);
      },
      onConnect: (frame) => {
        connectedRef.current = true;
        console.log('[WS][bookmark] CONNECTED. headers:', frame?.headers);
        // subscribe if planId already known
        if (planIdRef.current || planIdRef.current === 0) {
          trySubscribe(planIdRef.current);
          console.log('[WS][bookmark] connected. planId:', planIdRef.current);
        }
        // flush outbox
        while (outboxRef.current.length > 0) {
          const payload = outboxRef.current.shift();
          console.log('[WS][bookmark] FLUSH queued publish:', payload);
          client.publish(payload);
        }
      },
      onStompError: (frame) => {
        console.error('[WS][bookmark] STOMP error:', frame.headers['message'], frame.body);
      },
      onWebSocketError: (ev) => {
        console.error('[WS][bookmark] socket error:', ev);
      },
      onDisconnect: () => {
        connectedRef.current = false;
        console.warn('[WS][bookmark] DISCONNECTED');
        subscriptionRef.current = null;
      },
    });

    console.log('[WS][bookmark] activating client with headers:', headers, 'wsUrl:', wsUrl);
    client.activate();
    clientRef.current = client;
  }, [headers, trySubscribe, wsUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch (e) { console.warn('[WS][bookmark] cleanup unsubscribe failed:', e); }
        subscriptionRef.current = null;
      }
      if (clientRef.current) {
        try { clientRef.current.deactivate(); } catch (e) { console.warn('[WS][bookmark] deactivate failed:', e); }
        clientRef.current = null;
      }
    };
  }, [connect]);

  useEffect(() => {
    // resubscribe when planId changes
    console.log('[WS][bookmark] planId changed ->', planId);
    trySubscribe(planId);
  }, [planId, trySubscribe]);

  // unified sender, aligned with WhiteBoard: sendMessage(action, payload)
  const sendMessage = useCallback((action, payload = {}) => {
    const client = clientRef.current;
    const pid = planIdRef.current;
    if (pid === undefined || pid === null) {
      console.warn('[WS][bookmark] send skipped: missing planId');
      return;
    }
    const destination = `/app/bookmark/${pid}`;
    const body = JSON.stringify({ action, ...payload });
    const publishPayload = { destination, body, headers: { 'content-type': 'application/json' } };
    // inflight tracking only for CREATE
    if (action === 'CREATE' && payload && payload.googlePlaceId) {
      inflightCreateRef.current[payload.googlePlaceId] = { t: Date.now(), payload: { ...payload } };
    }
    if (client && client.connected) {
      console.log('[WS][bookmark] SEND', action, '->', publishPayload);
      client.publish(publishPayload);
    } else {
      console.log('[WS][bookmark] QUEUE', action, '->', publishPayload);
      outboxRef.current.push(publishPayload);
    }
  }, []);

  const sendCreate = useCallback((payload) => {
    sendMessage('CREATE', payload);
  }, []);

  const sendDelete = useCallback((bookmarkId) => {
    sendMessage('DELETE', { bookmarkId });
  }, [sendMessage]);

  return { sendMessage, sendCreate, sendDelete };
}
