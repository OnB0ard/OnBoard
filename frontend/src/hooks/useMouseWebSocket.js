// src/hooks/useMouseWebSocket.js
import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "@/store/useAuthStore";

const throttle = (fn, wait = 60) => {
  let last = 0, t = null, lastArgs = null;
  return (...args) => {
    const now = Date.now();
    const remain = wait - (now - last);
    lastArgs = args;
    if (remain <= 0) {
      last = now;
      fn(...args);
    } else if (!t) {
      t = setTimeout(() => {
        last = Date.now();
        t = null;
        fn(...lastArgs);
      }, remain);
    }
  };
};

/**
 * STOMP + SockJS 기반 마우스 커서 공유 훅
 *
 * 서버가 세션에서 userId/userName을 넣어 브로드캐스트하므로
 * 클라는 publish 시 x,y 만 보냅니다.
 */
export function useMouseStomp({
  planId,
  wsUrl,
  token,
  throttleMs = 60,
  idleMs = 8000,
}) {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState({});
  const [userOrder, setUserOrder] = useState([]);
  const [lastDto, setLastDto] = useState(null);
  const [pubCount, setPubCount] = useState(0);
  const [subCount, setSubCount] = useState(0);

  const SUB_TOPIC = `/topic/mouse/${planId}`;
  const PUB_DEST  = `/app/mouse/move/${planId}`;

  const stompRef = useRef(null);
  const subRef   = useRef(null);

  const client = useMemo(() => {
    const c = new Client({
      webSocketFactory: () => new SockJS(wsUrl || `${location.protocol}//${location.host}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 5000,
      heartbeatOutgoing: 5000,
      // debug: (msg) => console.log("[STOMP DEBUG]", msg),
      onConnect: () => {
        setConnected(true);

        // 구독
        subRef.current = c.subscribe(SUB_TOPIC, (message) => {
          try {
            const raw = typeof message.body === 'string'
              ? message.body.replace('\u0000+$', '')
              : message.body;
            const dto = JSON.parse(raw); // { userId, userName, x, y }
            setSubCount((n) => n + 1);
            setLastDto(dto);

            if (dto?.userId != null) {
              const uid = String(dto.userId);
              const now = Date.now();
              setUsers((prev) => ({
                ...prev,
                [uid]: {
                  state: { x: dto.x, y: dto.y },
                  displayName: dto.userName ?? '',
                  lastSeen: now,
                  active: true,
                },
              }));
              setUserOrder((order) => (order.includes(uid) ? order : [...order, uid]));
            }
          } catch (e) {
            console.error("[STOMP] Invalid payload:", e, message.body);
          }
        });

        // 초기 presence 알림 (필요시): 좌표 0,0 전송
        c.publish({
          destination: PUB_DEST,
          body: JSON.stringify({ x: 0, y: 0 }),
        });
        setPubCount((n) => n + 1);
      },
      onDisconnect: () => setConnected(false),
      onWebSocketError: (e) => console.error("[WS error]", e),
      onWebSocketClose: (e) => {
        setConnected(false);
        console.warn('[WS closed]', e?.code, e?.reason);
      },
      onStompError: (frame) =>
        console.error("[STOMP error]", frame.headers["message"], frame.body),
    });

    return c;
  }, [wsUrl, SUB_TOPIC, PUB_DEST, token]);

  // 활성/비활성 판정 타이머
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setUsers((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          const u = next[k];
          if (!u?.lastSeen) continue;
          next[k] = { ...u, active: (now - u.lastSeen) <= idleMs };
        }
        return next;
      });
    }, Math.max(1000, Math.min(Math.floor(idleMs / 2), 3000)));
    return () => clearInterval(t);
  }, [idleMs]);

  //  프로필 변경 시(이름 변경 등) 소켓 재연결
  useEffect(() => {
    const onProfileUpdated = () => {
      const c = stompRef.current;
      try { c?.deactivate(); } catch {}
      // 살짝 텀 두고 재연결
      setTimeout(() => { try { c?.activate(); } catch {} }, 150);
    };
    window.addEventListener('profile-updated', onProfileUpdated);
    return () => window.removeEventListener('profile-updated', onProfileUpdated);
  }, [planId]);

  // 클라이언트 수명주기
  useEffect(() => {
    stompRef.current = client;
    client.activate();
    return () => {
      try { subRef.current?.unsubscribe(); } catch {}
      client.deactivate();
      setConnected(false);
    };
  }, [client]);

  // 마우스 이동 이벤트 -> throttle 전송 (x,y 만)
  useEffect(() => {
    const publishMove = throttle((x, y) => {
      const c = stompRef.current;
      if (!c?.connected) return;
      c.publish({
        destination: PUB_DEST,
        body: JSON.stringify({ x, y }),
      });
      setPubCount((n) => n + 1);
    }, throttleMs);

    const onMove = (e) => publishMove(e.clientX, e.clientY);

    // visible 시 재연결 시도
    const handleVisibility = () => {
      const c = stompRef.current;
      if (!c) return;
      if (document.visibilityState === 'visible' && !c.connected) {
        try { c.activate(); } catch (e) { console.debug('[WS visibility] activate error', e); }
      }
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [PUB_DEST, throttleMs]);

  // 외부에서 임의 전송하고 싶을 때 사용
  const sendMouse = (x, y) => {
    const c = stompRef.current;
    if (!c?.connected) return false;
    c.publish({ destination: PUB_DEST, body: JSON.stringify({ x, y }) });
    setPubCount((n) => n + 1);
    return true;
  };

  // 활성 사용자만 반환
  const liveUsers = useMemo(() => {
    const out = {};
    Object.entries(users).forEach(([k, v]) => { if (v?.active) out[k] = v; });
    return out;
  }, [users]);

  return {
    connected,
    users: liveUsers,   // { [userId:string]: {state, displayName, ...} }
    userOrder,          // userId 문자열 배열
    lastDto,
    pubCount,
    subCount,
    sendMouse,
  };
}

export default useMouseStomp;
