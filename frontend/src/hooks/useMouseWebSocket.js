// src/hooks/useMouseWebSocket.js
import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * 간단 throttle (leading + trailing)
 */
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
 * @param {Object} options
 * @param {string} options.userName  - 현재 사용자 이름(세션 식별자)
 * @param {string|number} options.planId - 플랜/방 ID
 * @param {string} options.wsUrl     - SockJS 엔드포인트 (예: "https://.../ws")
 * @param {string} options.token     - Bearer 액세스 토큰
 * @param {number} [options.throttleMs=60] - 마우스 전송 throttle 간격(ms)
 * @param {number} [options.idleMs=8000]   - 이 시간 내 업데이트 없으면 비활성 처리(ms)
 *
 * @returns {{
 *  connected: boolean,
 *  users: Record<string, { state:{x:number,y:number}, lastSeen:number, active:boolean }>,
 *  userOrder: string[],
 *  lastDto: any,
 *  pubCount: number,
 *  subCount: number,
 *  sendMouse: (x:number,y:number)=>boolean
 * }}
 */
export function useMouseStomp({
  userName,
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

  // STOMP Client 인스턴스 생성
  const client = useMemo(() => {
    const c = new Client({
      webSocketFactory: () => new SockJS(wsUrl || `${location.protocol}//${location.host}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 5000,
      heartbeatOutgoing: 5000,
      // debug: (msg) => console.log("[STOMP DEBUG]", msg),
      onConnect: () => {
        setConnected(true);

        // 구독
        subRef.current = c.subscribe(SUB_TOPIC, (message) => {
          try {
            // 안전 파싱 (널문자 방지)
            const raw = typeof message.body === 'string' ? message.body.replace('\u0000+$', '') : message.body;
            const dto = JSON.parse(raw); // { userName, x, y, ... }
            setSubCount((n) => n + 1);
            setLastDto(dto);

            if (dto?.userName != null) {
              const now = Date.now();
              setUsers((prev) => {
                const next = { ...prev };
                next[dto.userName] = {
                  state: { x: dto.x, y: dto.y },
                  lastSeen: now,
                  active: true, //새 메시지를 받았으면 active 활성화
                };
                return next;
              });
              setUserOrder((order) =>
                order.includes(dto.userName) ? order : [...order, dto.userName]
              );
            }
          } catch (e) {
            console.error("[STOMP] Invalid payload:", e, message.body);
          }
        });

        // 초기 presence 알림 (원하면 생략 가능)
        c.publish({
          destination: PUB_DEST,
          body: JSON.stringify({ userName, x: 0, y: 0 }),
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
  }, [wsUrl, SUB_TOPIC, PUB_DEST, userName, token]);

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
          // 마지막 수신 이후 idleMs(8000ms) 초과 -> 비활성화
        }
        return next;
      });
    }, Math.max(1000, Math.min(Math.floor(idleMs / 2), 3000))); // 1~3초마다 확인
    return () => clearInterval(t);
  }, [idleMs]);

  // 클라이언트 수명주기 관리
  useEffect(() => {
    stompRef.current = client;
    client.activate();
    return () => {
      try {
        subRef.current?.unsubscribe();
      } catch {}
      client.deactivate();
      setConnected(false);
    };
  }, [client]);

  // 마우스 이동 이벤트 -> throttle 전송
  useEffect(() => {
    const publishMove = throttle((x, y) => {
      const c = stompRef.current;
      if (!c?.connected) return;
      c.publish({
        destination: PUB_DEST,
        body: JSON.stringify({ userName, x, y }),
      });
      setPubCount((n) => n + 1);
    }, throttleMs);

    const onMove = (e) => publishMove(e.clientX, e.clientY);

    // 활성 탭에서만 연결 복구: visibilitychange로 재활성화 시도
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
  }, [PUB_DEST, userName, throttleMs]);

  // 외부에서 임의 전송하고 싶을 때 사용
  const sendMouse = (x, y) => {
    const c = stompRef.current;
    if (!c?.connected) return false;
    c.publish({ destination: PUB_DEST, body: JSON.stringify({ userName, x, y }) });
    setPubCount((n) => n + 1);
    return true;
  };

  // 활성 사용자만 필터링해서 반환
  const liveUsers = useMemo(() => {
    const out = {};
    Object.entries(users).forEach(([k, v]) => {
      if (v?.active) out[k] = v; //active = true만 통과시킴
    });
    return out;
  }, [users]);

  return {
    connected,
    users: liveUsers,   // 활성 사용자만 whiteBoard로 전달
    userOrder,          // 최초 등장 순서 (전체 기준, 필요 시 필터링 가능)
    lastDto,
    pubCount,
    subCount,
    sendMouse,
  };
}

export default useMouseStomp;
