import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const throttle = (fn, wait = 60) => {
  let last = 0, t = null;
  return (...args) => {
    const now = Date.now(), remain = wait - (now - last);
    if (remain <= 0) {
      last = now;
      fn(...args);
    } else if (!t) {
      t = setTimeout(() => {
        last = Date.now();
        t = null;
        fn(...args);
      }, remain);
    }
  };
};

export function useMouseStomp({ userName, planId, wsUrl, token, throttleMs = 60 }) {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState({});
  const [userOrder, setUserOrder] = useState([]);
  const [lastDto, setLastDto] = useState(null);
  const [pubCount, setPubCount] = useState(0);
  const [subCount, setSubCount] = useState(0);

  const SUB_TOPIC = `/topic/mouse/${planId}`;
  const PUB_DEST = `/app/mouse/move/${planId}`;

  const stompRef = useRef(null);
  const subRef = useRef(null);

  const client = useMemo(() => {
    const c = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 1500,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // debug: (msg) => console.log("[STOMP DEBUG]", msg),
      onConnect: () => {
        setConnected(true);

        subRef.current = c.subscribe(SUB_TOPIC, (message) => {
          try {
            const dto = JSON.parse(message.body); // { email, x, y }
            setSubCount((n) => n + 1);
            setLastDto(dto);

            if (dto?.userName) {
              setUsers((prev) => {
                const updated = {
                  ...prev,
                  [dto.userName]: { state: { x: dto.x, y: dto.y } },
                };
                setUserOrder((order) =>
                  order.includes(dto.userName) ? order : [...order, dto.userName]
                );
                return updated;
              });
            }
          } catch (e) {
            console.error("[STOMP] Invalid payload:", e, message.body);
          }
        });

        c.publish({
          destination: PUB_DEST,
          body: JSON.stringify({ userName, x: 0, y: 0 }),
        });
        setPubCount((n) => n + 1);
      },
      onDisconnect: () => setConnected(false),
      onWebSocketError: (e) => console.error("[WS error]", e),
      onStompError: (frame) =>
        console.error("[STOMP error]", frame.headers["message"], frame.body),
    });

    return c;
  }, [wsUrl, SUB_TOPIC, PUB_DEST, userName, token]);

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

  useEffect(() => {
    const publishMove = throttle((x, y) => {
      const c = stompRef.current;
      if (!c?.connected) return;
      c.publish({ destination: PUB_DEST, body: JSON.stringify({ userName, x, y }) });
      setPubCount((n) => n + 1);
    }, throttleMs);

    const onMove = (e) => publishMove(e.clientX, e.clientY);
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [PUB_DEST, userName, throttleMs]);

  const sendMouse = (x, y) => {
    const c = stompRef.current;
    if (!c?.connected) return false;
    c.publish({ destination: PUB_DEST, body: JSON.stringify({ userName, x, y }) });
    setPubCount((n) => n + 1);
    return true;
  };

  return {
    connected,
    users,
    userOrder,
    lastDto,
    pubCount,
    subCount,
    sendMouse,
  };
}
