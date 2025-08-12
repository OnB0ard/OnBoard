import React from "react";

export function AlarmBell({ count = 0, color}) {
  const show = count > 0;
  const label = count > 99 ? "99+" : String(count);
      
  return (
    <span className="icon-badge" aria-label={`알림 ${show ? label : "없음"}`}>
        
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width="27"
        height="27"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        >
        <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
        <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
        </svg>

      {/* 알림 개수 뱃지 */}
      {show && (
        <span className="icon-badge__dot" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
export default {AlarmBell}
