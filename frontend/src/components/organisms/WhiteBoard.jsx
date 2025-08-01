// WhiteBoard.jsx
import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Line, Arrow, Circle, Rect, Text, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';
import { useBoardStore } from '../../store/useBoardStore';
import EditToolBar from './EditToolBar'; 

const simplifyPoints = (points, tolerance = 3) => {
  if (points.length <= 4) return points;
  const simplified = [points[0], points[1]];
  for (let i = 2; i < points.length - 1; i += 2) {
    const prevX = simplified[simplified.length - 2];
    const prevY = simplified[simplified.length - 1];
    const currX = points[i];
    const currY = points[i + 1];
    const dx = currX - prevX;
    const dy = currY - prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > tolerance) simplified.push(currX, currY);
  }
  return simplified;
};

const WhiteBoard = () => {
  const stageRef = useRef();
  const trRef = useRef();
  const startPosRef = useRef(null);
  const isDrawing = useRef(false);

  const {
    shapes,
    lines,
    selectedId,
    isEditingTextId,
    shapeType,
    color,
    addShape,
    updateShapeTransform,
    updateText,
    printText,
    setShapeType,
    setColor,
    setSelectedId,
    setIsEditingTextId,
    addLine,
    updateLastLinePoints
  } = useBoardStore();

  // cursor <-> select 변환 처리
  const internalShapeType = shapeType === 'cursor' ? 'select' : shapeType;

  useEffect(() => {
    if (internalShapeType !== 'select') {
      trRef.current?.nodes([]);
      return;
    }
    const shapeNode = stageRef.current.findOne(`#${selectedId}`);
    if (trRef.current && shapeNode) {
      trRef.current.nodes([shapeNode]);
      trRef.current.getLayer().batchDraw();
    } else {
      trRef.current.nodes([]);
    }
  }, [selectedId, isEditingTextId, internalShapeType]);

  const handleMouseDown = (e) => {
    const pos = stageRef.current.getPointerPosition();
    if (internalShapeType === 'pen') {
      isDrawing.current = true;
      const newLine = {
        id: `line-${Date.now()}`,
        type: 'pen',
        points: [pos.x, pos.y],
        stroke: color,
        strokeWidth: 3,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      };
      addLine(newLine);
      return;
    }

    if (e.target === stageRef.current) {
      setSelectedId(null);
    }
    startPosRef.current = pos;
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || internalShapeType !== 'pen') return;
    const point = stageRef.current.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    if (!lastLine) return;
    const updatedPoints = [...lastLine.points, point.x, point.y];
    updateLastLinePoints(updatedPoints);
  };

  const handleMouseUp = () => {
    if (internalShapeType === 'pen') {
      isDrawing.current = false;
      const lastLine = lines[lines.length - 1];
      if (!lastLine) return;
      const simplified = simplifyPoints(lastLine.points);
      updateLastLinePoints(simplified);
      console.log('🖍️ Final Pen JSON:', JSON.stringify({ ...lastLine, points: simplified }, null, 2));
      return;
    }

    const end = stageRef.current.getPointerPosition();
    const start = startPosRef.current;
    if (!start || !end || internalShapeType === 'select') return;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const id = `${Date.now()}`;
    const newShape =
      internalShapeType === 'arrow'
        ? {
            id,
            type: 'arrow',
            x: start.x,
            y: start.y,
            points: [0, 0, dx, dy],
            stroke: color,
            fill: color,
            strokeWidth: 2,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          }
        : internalShapeType === 'circle'
        ? {
            id,
            type: 'circle',
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            radius: Math.sqrt(dx ** 2 + dy ** 2) / 2,
            stroke: color,
            fill: 'transparent',
            strokeWidth: 2,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          }
        : internalShapeType === 'rect'
        ? {
            id,
            type: 'rect',
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(dx),
            height: Math.abs(dy),
            stroke: color,
            fill: 'transparent',
            strokeWidth: 2,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          }
        : {
            id,
            type: 'text',
            x: start.x,
            y: start.y,
            text: 'Double click to edit',
            fill: color,
            fontSize: 20,
            fontFamily: 'Arial',
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          };

    addShape(newShape);
    console.log('📐 New Shape JSON:', JSON.stringify(newShape, null, 2));
    startPosRef.current = null;
  };

  return (
    <>
      <EditToolBar
        shapeType={shapeType}
        setShapeType={setShapeType}
        color={color}
        setColor={setColor}
      />

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
        style={{
          position: 'absolute',
          zIndex:0}}
      >
        <Layer>
          {lines.map((line) => (
            <Line key={line.id} {...line} />
          ))}

          {shapes.map((shape) => {
            const { id, type, ...rest } = shape;
            const isSelectable = internalShapeType === 'select';
            const commonProps = {
              id,
              draggable: isSelectable,
              onClick: () => setSelectedId(id),
              onTransformEnd: (e) => {
                const node = e.target;
                const updated = {
                  x: node.x(),
                  y: node.y(),
                  scaleX: node.scaleX(),
                  scaleY: node.scaleY(),
                  rotation: node.rotation()
                };
                updateShapeTransform(id, updated);
                console.log('🔁 Transformed Shape JSON:', JSON.stringify({ ...shape, ...updated }, null, 2));
              },
              onDragEnd: (e) => {
                const updated = {
                  x: e.target.x(),
                  y: e.target.y()
                };
                updateShapeTransform(id, updated);
                console.log('↔️ Dragged Shape JSON:', JSON.stringify({ ...shape, ...updated }, null, 2));
              }
            };

            switch (type) {
              case 'arrow':
                return <Arrow key={id} {...commonProps} {...rest} />;
              case 'circle':
                return <Circle key={id} {...commonProps} {...rest} />;
              case 'rect':
                return <Rect key={id} {...commonProps} {...rest} />;
              case 'text':
                return (
                  <React.Fragment key={id}>
                    <Text
                      {...commonProps}
                      {...rest}
                      onDblClick={() => setIsEditingTextId(id)}
                      visible={isEditingTextId !== id}
                    />
                    {isEditingTextId === id && (
                      <Html>
                        <textarea
                          defaultValue={shape.text}
                          style={{ position: 'absolute', top: shape.y, left: shape.x }}
                          onBlur={(e) => {
                            setIsEditingTextId(null);
                            printText(id);
                          }}
                          onChange={(e) => updateText(id, e.target.value)}
                          onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey){
                              e.preventDefault();
                              setIsEditingTextId(null);
                              printText(id);
                            }
                          }}
                        />
                      </Html>
                    )}
                  </React.Fragment>
                );
              default:
                return null;
            }
          })}

          <Transformer ref={trRef} />
        </Layer>
      </Stage>
    </>
  );
};

export default WhiteBoard;
