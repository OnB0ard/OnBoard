import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { useMapCoreStore } from '../../store/mapStore';
import 'react-resizable/css/styles.css';

export default function Map({
  children,
  // corner: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | null
  corner = 'top-right',
  // 여백(px) 조정 옵션
  offset = { x: 16, y: 16 },
  // 기본 사이즈 조정 옵션
  defaultSize = { width: 400, height: 400 },
  // 우측 정렬 기준일 때 지도 너비의 절반만큼 왼쪽으로 이동
  shiftLeftByHalfWidth = true,
  // 추가로 왼쪽으로 당길 픽셀 (우측 코너일 때만 적용)
  extraShiftLeft = 0,
}) {
  const setIsMapVisible = useMapCoreStore((state) => state.setIsMapVisible);

  const [size, setSize] = useState(defaultSize);
  // PlaceBlock 레이어(1500) 대비 지도 z-index 토글 상태
  const [isOnTop, setIsOnTop] = useState(false);

  const getCornerPosition = (sz, cnr, ofs, halfShift, extraShift) => {
    if (typeof window === 'undefined' || !cnr) return { x: 900, y: 40 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = sz?.width ?? 400;
    const h = sz?.height ?? 400;
    const ox = ofs?.x ?? 16;
    const oy = ofs?.y ?? 16;
    const shiftX = (halfShift ? w / 2 : 0) + (extraShift || 0);

    switch (cnr) {
      case 'top-left':
        return { x: ox, y: oy };
      case 'top-right':
        return { x: Math.max(ox, vw - w - ox - shiftX), y: oy };
      case 'bottom-left':
        return { x: ox, y: Math.max(oy, vh - h - oy) };
      case 'bottom-right':
        return { x: Math.max(ox, vw - w - ox - shiftX), y: Math.max(oy, vh - h - oy) };
      default:
        return { x: 900, y: 40 };
    }
  };

  // 초기 위치를 corner 기준으로 설정 (사용자가 이후 드래그로 조정 가능)
  const [position, setPosition] = useState(() => getCornerPosition(defaultSize, corner, offset, shiftLeftByHalfWidth, extraShiftLeft));

  const currentZIndex = isOnTop ? 2200 : 1400; // 위로 토글 시 PlaceBlock(1500)보다 높게

  return (
    <>
      <Rnd
        size={size}
        position={position}
        onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, pos) => {
          setSize({ width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10) });
          setPosition(pos);
        }}
        minWidth={300}
        minHeight={200}
        dragHandleClassName="map-drag-handle"
        bounds="window"
        style={{ zIndex: currentZIndex }} // 토글 가능한 z-index
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #ccc',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            const btns = e.currentTarget.querySelectorAll('.map-header-btn');
            btns.forEach((b) => (b.style.opacity = '1'));
          }}
          onMouseLeave={(e) => {
            const btns = e.currentTarget.querySelectorAll('.map-header-btn');
            btns.forEach((b) => (b.style.opacity = '0'));
          }}
        >
          <div
            className="map-drag-handle"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background: 'transparent',
              padding: '10px',
              cursor: 'move',
              gap: '8px',
            }}
          >
            <button
              className="map-header-btn map-z-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsOnTop((v) => !v);
              }}
              title={isOnTop ? '지도를 장소블록 아래로 보내기' : '장소블록 위로 올리기'}
              style={{
                border: 'none',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: '1',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                color: '#374151',
                userSelect: 'none',
              }}
            >
              {isOnTop ? '▼' : '▲'}
            </button>
            <button
              className="map-header-btn map-close-btn"
              onClick={() => setIsMapVisible(false)}
              style={{
                border: 'none',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: '1',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                color: '#374151',
                userSelect: 'none',
              }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </Rnd>
    </>
  );
}
