import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { useMapCoreStore } from '../../store/mapStore';
import 'react-resizable/css/styles.css';

export default function Map({ children }) {
  const setIsMapVisible = useMapCoreStore((state) => state.setIsMapVisible);

  const [size, setSize] = useState({ width: 400, height: 400 });
  const [position, setPosition] = useState({ x: 900, y: 40 });

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
        style={{ zIndex: 1500 }} // 다른 요소들 위에 오도록 z-index 설정
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
            const btn = e.currentTarget.querySelector('.map-close-btn');
            if (btn) btn.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget.querySelector('.map-close-btn');
            if (btn) btn.style.opacity = '0';
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
            }}
          >
            <button
              className="map-close-btn"
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
