// EditToolBar.jsx
import React from 'react';
import Icon from '../atoms/Icon';

// 매핑 테이블: iconType (UI용) <-> shapeValue (내부 로직용)
const tools = [
  { iconType: 'cursor', shapeValue: 'select' },
  { iconType: 'arrow', shapeValue: 'arrow' },
  { iconType: 'circle', shapeValue: 'circle' },
  { iconType: 'rectangle', shapeValue: 'rect' },
  { iconType: 'text', shapeValue: 'text' },
  { iconType: 'line', shapeValue: 'pen' },
  { iconType: 'eraser', shapeValue: 'eraser'},
  // { iconType: 'undo', shapeValue: 'undo'},
  // { iconType: 'redo', shapeValue: 'redo'},
];

const EditToolBar = ({ shapeType, setShapeType, color, setColor }) => {
  return (
    <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 z-50 flex items-center bg-white shadow-md rounded-full px-4 py-2 space-x-2 border">
      {tools.map((tool) => (
        <button
          key={tool.iconType}
          onClick={() => setShapeType(tool.shapeValue)}
          className={`p-2 rounded-full transition ${
            shapeType === tool.shapeValue ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
        >
          <Icon type={tool.iconType} />
        </button>
      ))}

      {/* 색상 선택 */}
      <div className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-100">
        <Icon type="color" />
        {/* 미리보기 원 + color input 겹치기 */}
        <div className="relative w-4 h-4">
          <span
            className="absolute inset-0 rounded-full border cursor-pointer"
            style={{ backgroundColor: color }}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            title="Choose color"
          />
        </div>
      </div>
    </div>
  );
};

export default EditToolBar;
