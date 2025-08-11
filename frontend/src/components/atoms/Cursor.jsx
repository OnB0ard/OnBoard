// src/components/atoms/Cursor.jsx
import * as React from "react";
import { useCursor } from "@/hooks/useCursor";

/**
 * @param {string} userId
 * @param {[number, number]} point
 * @param {string} color - CSS 색상
 * @param {string} label - 이름표 텍스트
 */
export function Cursor({ userId, point, color = "red", label }) {
  const rCursor = React.useRef(null);
  const animateCursor = React.useCallback((point) => {
    const elm = rCursor.current;
    if (!elm) return;
    elm.style.setProperty(
      "transform",
      `translate(${point[0]}px, ${point[1]}px)`
    );
  }, []);

  const onPointMove = useCursor(animateCursor);

  React.useLayoutEffect(() => {
    onPointMove(point);
  }, [onPointMove, point]);

  return (
    <div
      ref={rCursor}
      style={{
        position: "absolute",
        top: -60,
        left: -15,
        width: 50,
        height: 60,
        pointerEvents: "none", // 마우스 이벤트 방지
        zIndex: 9999,
      }}
    >
      <svg width={35} height={35} viewBox="0 0 35 35" fill="none">
        <g fill="rgba(0,0,0,.2)" transform="translate(1,1)">
          <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
          <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
        </g>
        <g fill="white">
          <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
          <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
        </g>
        <g fill={color}>
          <path d="m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z" />
          <path d="m13 10.814v11.188l2.969-2.866.428-.139h4.768z" />
        </g>
      </svg>
      <div
        style={{
          marginTop: 2,
          textAlign: "center",
          fontSize: 12,
          fontWeight: 500,
          color: "#333",
          textShadow: "0 0 2px white",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}
