// src/hooks/useCursor.js
import * as React from "react";

/**
 * onPoint => [x, y] or { x, y, t }
 * 옵션: bufferMs=60(권장 40~80), maxQueue=8
 */
export function useCursor(cb, opts = {}) {
  const { bufferMs = 60, maxQueue = 8 } = opts;

  const queueRef = React.useRef([]);      // {x,y,t}
  const rafRef   = React.useRef(0);
  const aliveRef = React.useRef(false);

  // 수신: 포인트 적재 (타임스탬프 없으면 now로 보정)
  const onPointChange = React.useCallback((p) => {
    const now = performance.now();
    const x = Array.isArray(p) ? p[0] : p?.x;
    const y = Array.isArray(p) ? p[1] : p?.y;
    const t = (Array.isArray(p) && p.length > 2 && typeof p[2] === "number")
      ? p[2] : (typeof p?.t === "number" ? p.t : now);

    const q = queueRef.current;
    q.push({ x, y, t });
    if (q.length > maxQueue) q.splice(0, q.length - maxQueue);
  }, [maxQueue]);

  // 재생: 약간 과거 시점(now - bufferMs)을 따라가며 보간
  React.useLayoutEffect(() => {
    aliveRef.current = true;

    const tick = () => {
      if (!aliveRef.current) return;
      const targetTime = performance.now() - bufferMs;
      const q = queueRef.current;

      // targetTime 기준으로 좌우 샘플 찾기
      while (q.length >= 2 && q[1].t <= targetTime) q.shift();

      let outX, outY;
      if (q.length === 0) {
        // 아무것도 없으면 패스
      } else if (q.length === 1) {
        outX = q[0].x; outY = q[0].y;
      } else {
        const a = q[0], b = q[1];
        const span = Math.max(1, b.t - a.t);
        const u = Math.min(1, Math.max(0, (targetTime - a.t) / span));
        outX = a.x + (b.x - a.x) * u;
        outY = a.y + (b.y - a.y) * u;
      }

      if (outX != null && outY != null) cb([outX, outY]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      aliveRef.current = false;
      cancelAnimationFrame(rafRef.current);
      queueRef.current.length = 0;
    };
  }, [cb, bufferMs]);

  return onPointChange;
}
