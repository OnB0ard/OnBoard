


// import React, { useRef, useEffect, useState } from 'react';
// import { Stage, Layer, Line, Arrow, Circle, Rect, Text, Transformer } from 'react-konva';
// import { useBoardStore } from '../../store/useBoardStore';
// import EditToolBar from './EditToolBar';
// import { Cursor } from "../atoms/Cursor";
// import { useAuthStore } from "@/store/useAuthStore";
// import { useStompWebSocket } from "@/hooks/useStompWebSocket";

// // 렌더링 기본값(화면 표시용; 서버 DTO 기본값과는 분리)
// const RENDER_DEFAULTS = {
//   stroke: '#222',
//   strokeWidth: 2,
//   fill: null,        // 도형 내부 채움 기본: 투명
//   textColor: '#222', // 텍스트는 fill이 글자색이므로 별도 기본값
// };

// // leading + trailing, 마지막 호출 보장. cancel 지원
// const throttle = (fn, wait = 60) => {
//   let t = null, last = 0, lastArgs = null;
//   const throttled = (...args) => {
//     const now = Date.now();
//     const remain = wait - (now - last);
//     lastArgs = args;
//     if (remain <= 0) {
//       last = now;
//       fn(...args);
//     } else if (!t) {
//       t = setTimeout(() => {
//         last = Date.now();
//         t = null;
//         fn(...lastArgs);
//       }, remain);
//     }
//   };
//   throttled.cancel = () => { if (t) { clearTimeout(t); t = null; } };
//   return throttled;
// };

// const renderCursors = (users, myUuid) => {
//   return Object.entries(users).map(([uuid, user]) => {
//     if (uuid === myUuid) return null;
//     const state = user.state;
//     if (!state || state.x == null || state.y == null) return null;
//     return <Cursor key={uuid} userId={uuid} point={[state.x, state.y]} />;
//   });
// };

// const WhiteBoard = ({ planId }) => {
//   const stageRef = useRef();
//   const layerRef = useRef(null);
//   const trRef = useRef();
//   const startPosRef = useRef(null);
//   const isDrawing = useRef(false);

//   // UPDATE/MOVE 임시 패치를 모아 두는 ref (store 미사용)
//   const tempShapePatchesRef = useRef({}); // id -> partial attrs
//   const rafRef = useRef(null);

//   const [myUuid, setMyUuid] = useState(null);
//   const [usersMap, setUsersMap] = useState({});

//   const {
//     shapes,
//     lines,
//     selectedId,
//     isEditingTextId,
//     shapeType,
//     color,
//     addShapeFromSocket,
//     updateLastLinePoints,
//     updateLastLinePointsTemp,
//     addLine,
//     updateShapeFieldsCommit,
//     setSelectedId,
//     setShapeType,
//     setColor
//   } = useBoardStore();

//   const internalShapeType = shapeType === 'cursor' ? 'select' : shapeType;
//   const userName = useAuthStore((s) => s.userName);

//   // 서버 DTO 규격으로 생성 payload 구성(없는 필드는 null/기본값)
//   const buildShapePayload = (id, type, props = {}) => {
//     return {
//       id,
//       type,
//       x: props.x ?? 0,
//       y: props.y ?? 0,
//       scaleX: props.scaleX ?? 1,
//       scaleY: props.scaleY ?? 1,
//       rotation: props.rotation ?? 0,
//       stroke: props.stroke ?? color ?? null,
//       fill: props.fill ?? null,
//       radius: props.radius ?? null,
//       width: props.width ?? null,
//       height: props.height ?? null,
//       points: props.points ?? null,
//       text: type === 'text' ? (props.text ?? 'Double click to edit') : null
//     };
//   };

//   const accessToken = useAuthStore(s => s.accessToken);



//   const { sendMessage } = useStompWebSocket({
//     planId : 1,
//     wsUrl: 'http://70.12.247.36:8080/ws',
//     onMessage: (msg) => {
//       const { type, payload, uuid } = msg;

//       if (type === 'WELCOME') {
//         setMyUuid(uuid);
//         return;
//       }

//       if (type === 'CURSOR') {
//         setUsersMap(prev => ({ ...prev, [uuid]: msg }));
//         return;
//       }

//       if (type === 'CREATE_SHAPE') {
//         // 서버가 DTO 채워서 브로드캐스트 → store에만 추가(히스토리 X)
//         addShapeFromSocket(payload);
//         return;
//       }

//       // 내가 보낸 건 로컬에서 이미 처리했으니 무시
//       if (uuid === myUuid) return;

//       // ====== 임시 반영(스토어 X, temp에만 저장) ======
//       if (type === 'MOVE_SHAPE') {
//         tempShapePatchesRef.current[payload.id] = {
//           ...(tempShapePatchesRef.current[payload.id] || {}),
//           x: payload.x,
//           y: payload.y,
//         };
//         return;
//       }

//       if (type === 'UPDATE_SHAPE') {
//         const keep = (({ x, y, scaleX, scaleY, rotation, text }) => ({ x, y, scaleX, scaleY, rotation, text }))(payload);
//         tempShapePatchesRef.current[payload.id] = {
//           ...(tempShapePatchesRef.current[payload.id] || {}),
//           ...keep,
//         };
//         return;
//       }

//       // ====== 커밋은 스토어에 저장(히스토리 O) ======
//       if (type === 'COMMIT_SHAPE') {
//         updateShapeFieldsCommit(payload.id, payload);
//         // 커밋되면 임시 패치 제거
//         delete tempShapePatchesRef.current[payload.id];
//         return;
//       }

//       if (type === 'CREATE_LINE')     addLine(payload);
//       if (type === 'UPDATE_LINE')     updateLastLinePointsTemp(payload.points);
//       if (type === 'COMMIT_LINE')     updateLastLinePoints(payload.points);
//     },
//     accessToken,
//   });

  
//   // 송신 스로틀
//   const throttled = useRef({
//     moveShape: null,
//     updateShape: null,
//     updateLine: null,
//   });

//   useEffect(() => {
//     throttled.current.moveShape   = throttle((payload) => sendMessage("MOVE_SHAPE", payload), 60);
//     throttled.current.updateShape = throttle((payload) => sendMessage("UPDATE_SHAPE", payload), 60);
//     throttled.current.updateLine  = throttle((payload) => sendMessage("UPDATE_LINE", payload), 60);

//     return () => {
//       throttled.current.moveShape?.cancel?.();
//       throttled.current.updateShape?.cancel?.();
//       throttled.current.updateLine?.cancel?.();
//     };
//   }, [sendMessage, planId]);

//   // Transformer 선택 유지
//   useEffect(() => {
//     if (internalShapeType !== 'select') {
//       trRef.current?.nodes([]);
//       return;
//     }
//     const node = stageRef.current?.findOne(`#${selectedId}`);
//     if (trRef.current && node) {
//       trRef.current.nodes([node]);
//       trRef.current.getLayer().batchDraw();
//     } else {
//       trRef.current?.nodes([]);
//     }
//   }, [selectedId, isEditingTextId, internalShapeType]);

//   // RAF 루프: tempShapePatchesRef를 실제 Konva 노드에 보간 적용
//   useEffect(() => {
//     const tick = () => {
//       const stage = stageRef.current;
//       const layer = layerRef.current;
//       if (!stage || !layer) {
//         rafRef.current = requestAnimationFrame(tick);
//         return;
//       }

//       const patches = tempShapePatchesRef.current;
//       const ids = Object.keys(patches);
//       if (ids.length) {
//         ids.forEach((id) => {
//           const patch = patches[id];
//           const node = stage.findOne(`#${id}`);
//           if (!node) return;

//           // 부드러운 LERP
//           const lerp = (cur, target, a = 0.2) => cur + (target - cur) * a;
//           const attrs = {};

//           if (patch.x != null)        attrs.x        = lerp(node.x(),        patch.x);
//           if (patch.y != null)        attrs.y        = lerp(node.y(),        patch.y);
//           if (patch.scaleX != null)   attrs.scaleX   = lerp(node.scaleX(),   patch.scaleX);
//           if (patch.scaleY != null)   attrs.scaleY   = lerp(node.scaleY(),   patch.scaleY);
//           if (patch.rotation != null) attrs.rotation = lerp(node.rotation(), patch.rotation);
//           if (patch.text != null)     attrs.text     = patch.text; // 텍스트는 즉시

//           node.setAttrs(attrs);
//         });

//         layer.batchDraw();
//       }

//       rafRef.current = requestAnimationFrame(tick);
//     };

//     rafRef.current = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(rafRef.current);
//   }, []);

//   const handleMouseDown = (e) => {
//     const pos = stageRef.current?.getPointerPosition();
//     if (!pos) return;

//     if (e.target === stageRef.current) {
//       setSelectedId(null);
//     }

//     const drawable = ['arrow', 'circle', 'rect', 'text', 'pen'];
//     if (drawable.includes(internalShapeType)) {
//       startPosRef.current = pos;
//     }

//     if (internalShapeType === 'pen') {
//       isDrawing.current = true;
//       const newLine = {
//         id: `line-${Date.now()}`,
//         type: 'pen',
//         points: [pos.x, pos.y],
//         stroke: color,
//         strokeWidth: 3,
//         tension: 0.5,
//         lineCap: 'round',
//         lineJoin: 'round'
//       };
//       addLine(newLine);
//       sendMessage("CREATE_LINE", newLine);
//     }
//   };

//   const handleMouseMove = () => {
//     if (!isDrawing.current || internalShapeType !== 'pen') return;
//     const pos = stageRef.current?.getPointerPosition();
//     if (!pos) return;

//     const currentLines = [...lines];
//     const lastLine = currentLines[currentLines.length - 1];
//     if (!lastLine) return;

//     const newPoints = [...lastLine.points, pos.x, pos.y];

//     // 로컬 임시 반영(스토어 히스토리 X)
//     updateLastLinePointsTemp(newPoints);

//     // 스로틀 전송
//     throttled.current.updateLine({ id: lastLine.id, points: newPoints });
//   };

//   const handleMouseUp = () => {
//     if (internalShapeType === 'pen') {
//       isDrawing.current = false;
//       const currentLines = [...lines];
//       const lastLine = currentLines[currentLines.length - 1];
//       if (lastLine) {
//         updateLastLinePoints(lastLine.points);
//         sendMessage("COMMIT_LINE", { id: lastLine.id, points: lastLine.points });
//       }
//       return;
//     }

//     if (!startPosRef.current || internalShapeType === 'select' || internalShapeType === 'eraser') {
//       startPosRef.current = null;
//       return;
//     }

//     const end = stageRef.current?.getPointerPosition();
//     const start = startPosRef.current;
//     if (!end || !start) {
//       startPosRef.current = null;
//       return;
//     }

//     const dx = end.x - start.x;
//     const dy = end.y - start.y;
//     const dist = Math.hypot(dx, dy);

//     if (internalShapeType !== 'text' && dist < 3) {
//       startPosRef.current = null;
//       return;
//     }

//     const id = `${Date.now()}`;
//     let shapeProps = {};

//     switch (internalShapeType) {
//       case 'arrow':
//         shapeProps = {
//           x: start.x,
//           y: start.y,
//           points: [0, 0, dx, dy]
//         };
//         break;
//       case 'circle':
//         shapeProps = {
//           x: (start.x + end.x) / 2,
//           y: (start.y + end.y) / 2,
//           radius: Math.sqrt(dx ** 2 + dy ** 2) / 2
//         };
//         break;
//       case 'rect':
//         shapeProps = {
//           x: Math.min(start.x, end.x),
//           y: Math.min(start.y, end.y),
//           width: Math.abs(dx),
//           height: Math.abs(dy)
//         };
//         break;
//       case 'text':
//         shapeProps = {
//           x: start.x,
//           y: start.y
//         };
//         break;
//       default:
//         break;
//     }

//     const payload = buildShapePayload(id, internalShapeType, shapeProps);
//     sendMessage("CREATE_SHAPE", payload);

//     startPosRef.current = null;
//   };

//   // 텍스트 편집 오버레이 생성
//   const beginEditText = (shape) => {
//     const stage = stageRef.current;
//     const layer = stage.findOne('Layer');
//     const pos = stage.container().getBoundingClientRect();

//     const ta = document.createElement('textarea');
//     ta.value = shape.text || '';
//     ta.style.position = 'absolute';
//     ta.style.top = `${pos.top + shape.y}px`;
//     ta.style.left = `${pos.left + shape.x}px`;
//     ta.style.transformOrigin = 'left top';
//     ta.style.padding = '2px 4px';
//     ta.style.border = '1px solid #ccc';
//     ta.style.outline = 'none';
//     ta.style.font = '16px sans-serif';
//     ta.style.background = 'white';
//     ta.style.zIndex = 9999;
//     ta.rows = 1;

//     const finish = (commit) => {
//       if (commit) {
//         const newText = ta.value;
//         // 커밋: 스토어 저장 + 브로드캐스트
//         updateShapeFieldsCommit(shape.id, {
//           type: shape.type,
//           x: shape.x,
//           y: shape.y,
//           points: null,
//           scaleX: shape.scaleX ?? 1,
//           scaleY: shape.scaleY ?? 1,
//           rotation: shape.rotation ?? 0,
//           text: newText
//         });
//         sendMessage('COMMIT_SHAPE', {
//           id: shape.id,
//           type: shape.type,
//           x: shape.x,
//           y: shape.y,
//           points: null,
//           scaleX: shape.scaleX ?? 1,
//           scaleY: shape.scaleY ?? 1,
//           rotation: shape.rotation ?? 0,
//           text: newText
//         });

//         // 임시 패치 제거
//         delete tempShapePatchesRef.current[shape.id];
//       }
//       document.body.removeChild(ta);
//       layer.getStage().container().focus();
//     };

//     ta.addEventListener('keydown', (e) => {
//       if (e.key === 'Enter' && !e.shiftKey) {
//         e.preventDefault();
//         finish(true);
//       } else if (e.key === 'Escape') {
//         finish(false);
//       }
//     });
//     ta.addEventListener('blur', () => finish(true));

//     document.body.appendChild(ta);
//     ta.focus();
//     ta.select();
//   };

//   return (
//     <>
//       <EditToolBar
//         shapeType={shapeType}
//         setShapeType={setShapeType}
//         color={color}
//         setColor={setColor}
//       />

//       <Stage
//         width={window.innerWidth}
//         height={window.innerHeight}
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         ref={stageRef}
//         style={{ position: 'absolute', zIndex: 0 }}
//       >
//         <Layer ref={layerRef}>
//           {shapes.map((shape) => {
//             const { id, type, ...rest } = shape;
//             const isSelectable = internalShapeType === 'select';

//             // 렌더링 기본값 주입
//             const vStroke      = shape.stroke ?? RENDER_DEFAULTS.stroke;
//             const vStrokeWidth = shape.strokeWidth ?? RENDER_DEFAULTS.strokeWidth;
//             const vFill = type === 'text'
//               ? (shape.fill ?? color ?? RENDER_DEFAULTS.textColor)
//               : (shape.fill ?? RENDER_DEFAULTS.fill);

//             const commonProps = {
//               id,
//               draggable: isSelectable,
//               onClick: () => setSelectedId(id),

//               // 시각 관련 기본값
//               stroke: vStroke,
//               strokeWidth: vStrokeWidth,
//               fill: vFill,

//               onDragMove: (e) => {
//                 if (!isSelectable) return;
//                 const x = e.target.x();
//                 const y = e.target.y();

//                 // 스토어 대신 temp(RAF)로만 반영
//                 tempShapePatchesRef.current[id] = {
//                   ...(tempShapePatchesRef.current[id] || {}),
//                   x, y,
//                 };

//                 // 네트워크 전송(스로틀)
//                 throttled.current.moveShape({ id, x, y });
//               },

//               onDragEnd: (e) => {
//                 if (!isSelectable) return;
//                 const x = e.target.x();
//                 const y = e.target.y();

//                 // 커밋(스토어 저장 + 방송)
//                 updateShapeFieldsCommit(id, {
//                   type,
//                   x, y,
//                   points: null,
//                   text: type === 'text' ? shape.text ?? '' : null
//                 });
//                 sendMessage("COMMIT_SHAPE", {
//                   id, type, x, y,
//                   points: null,
//                   text: type === 'text' ? shape.text ?? '' : null
//                 });

//                 // 임시 패치 제거
//                 delete tempShapePatchesRef.current[id];
//               },

//               onTransform: (e) => {
//                 if (!isSelectable) return;
//                 const node = e.target;
//                 const patch = {
//                   x: node.x(),
//                   y: node.y(),
//                   scaleX: node.scaleX(),
//                   scaleY: node.scaleY(),
//                   rotation: node.rotation(),
//                 };

//                 // 스토어 대신 temp(RAF)로만 반영
//                 tempShapePatchesRef.current[id] = {
//                   ...(tempShapePatchesRef.current[id] || {}),
//                   ...patch,
//                 };

//                 // 네트워크 전송(스로틀)
//                 throttled.current.updateShape({ id, type, ...patch });
//               },

//               onTransformEnd: (e) => {
//                 if (!isSelectable) return;
//                 const node = e.target;
//                 const patch = {
//                   x: node.x(),
//                   y: node.y(),
//                   scaleX: node.scaleX(),
//                   scaleY: node.scaleY(),
//                   rotation: node.rotation(),
//                   points: null,
//                   text: type === 'text' ? shape.text ?? '' : null
//                 };

//                 // 커밋(스토어 저장 + 방송)
//                 updateShapeFieldsCommit(id, { id, type, ...patch });
//                 sendMessage("COMMIT_SHAPE", { id, type, ...patch });

//                 // 임시 패치 제거
//                 delete tempShapePatchesRef.current[id];
//               }
//             };

//             if (type === 'text') {
//               return (
//                 <Text
//                   key={id}
//                   {...commonProps}
//                   {...rest}
//                   onDblClick={() => beginEditText(shape)}
//                 />
//               );
//             }

//             switch (type) {
//               case 'arrow': return <Arrow key={id} {...commonProps} {...rest} />;
//               case 'circle': return <Circle key={id} {...commonProps} {...rest} />;
//               case 'rect':   return <Rect   key={id} {...commonProps} {...rest} />;
//               default:       return null;
//             }
//           })}

//           {lines.map(line => <Line key={line.id} {...line} />)}
//           <Transformer ref={trRef} />
//         </Layer>
//       </Stage>

//       {renderCursors(usersMap, myUuid)}
//     </>
//   );
// };

// export default WhiteBoard;

// src/components/whiteboard/WhiteBoard.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Arrow, Circle, Rect, Text, Transformer } from 'react-konva';
import { useBoardStore } from '../../store/useBoardStore';
import EditToolBar from './EditToolBar';
import { Cursor } from "../atoms/Cursor";
import { useAuthStore } from "@/store/useAuthStore";
import { useStompWebSocket } from "@/hooks/useStompWebSocket";

// 렌더링 기본값(화면 표시용; 서버 DTO 기본값과는 분리)
const RENDER_DEFAULTS = {
  stroke: '#222',
  strokeWidth: 2,
  fill: null,        // 도형 내부 채움 기본: 투명
  textColor: '#222', // 텍스트는 fill이 글자색이므로 별도 기본값
};

// leading + trailing, 마지막 호출 보장. cancel 지원
const throttle = (fn, wait = 60) => {
  let t = null, last = 0, lastArgs = null;
  const throttled = (...args) => {
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
  throttled.cancel = () => { if (t) { clearTimeout(t); t = null; } };
  return throttled;
};

const renderCursors = (users, myUuid) => {
  return Object.entries(users).map(([uuid, user]) => {
    if (uuid === myUuid) return null;
    const state = user.state;
    if (!state || state.x == null || state.y == null) return null;
    return <Cursor key={uuid} userId={uuid} point={[state.x, state.y]} />;
  });
};

const WhiteBoard = ({ planId }) => {
  const stageRef = useRef();
  const layerRef = useRef(null);
  const trRef = useRef();
  const startPosRef = useRef(null);
  const isDrawing = useRef(false);

  // UPDATE/MOVE 임시 패치를 모아 두는 ref (store 미사용)
  const tempShapePatchesRef = useRef({}); // id -> partial attrs
  const rafRef = useRef(null);

  const [myUuid, setMyUuid] = useState(null);
  const [usersMap, setUsersMap] = useState({});

  const {
    shapes,
    lines,
    selectedId,
    isEditingTextId,
    shapeType,
    color,
    addShapeFromSocket,
    updateLastLinePoints,
    updateLastLinePointsTemp,
    addLine,
    updateShapeFieldsCommit,
    setSelectedId,
    setShapeType,
    setColor
  } = useBoardStore();

  const internalShapeType = shapeType === 'cursor' ? 'select' : shapeType;
  const accessToken = useAuthStore(s => s.accessToken);

  // 서버로 보낼 CREATE payload (action은 sendMessage에서 넣음)
  const buildCreatePayload = (type, props = {}) => ({
    // WhiteBoardSocketDTO: action, whiteBoardObjectId(생략), type, x,y,scale*,rotation,stroke,fill,radius,width,height,points,text
    type, // 반드시 UPPERCASE로 전달
    x: props.x ?? 0,
    y: props.y ?? 0,
    scaleX: props.scaleX ?? 1,
    scaleY: props.scaleY ?? 1,
    rotation: props.rotation ?? 0,
    stroke: props.stroke ?? color ?? null,
    fill: props.fill ?? null,
    radius: props.radius ?? null,
    width: props.width ?? null,
    height: props.height ?? null,
    points: props.points ?? null,
    text: type === 'TEXT' ? (props.text ?? 'Double click to edit') : null
  });

  const { sendMessage } = useStompWebSocket({
    planId : 71,
    // wsUrl: 'http://70.12.247.36:8080/ws',
    wsUrl: 'https://i13a504.p.ssafy.io/ws',
    accessToken,
    onMessage: (msg) => {
      // 서버 브로드캐스트는 { action, whiteBoardObjectId, type, x,y,... } 형태
      const { action } = msg || {};

      // (예외) MODIFY_LINE 응답은 CreateLineRequestDTO 그대로라 action이 없을 수 있음
      // points가 있고 type이 PEN이거나 points만 있으면 라인 커밋으로 간주
      if (!action && Array.isArray(msg?.points)) {
        const lineId = msg.whiteBoardObjectId ?? `line-${Date.now()}`;
        addLine({
          id: `line-${lineId}`,
          type: 'pen',
          points: msg.points || [],
          stroke: msg.stroke || color,
          strokeWidth: 3,
          tension: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
        });
        return;
      }

      switch (action) {
        case 'MOVE': {
          // 도형 이동/변형 미리보기 or 펜 포인트 미리보기
          if (Array.isArray(msg.points)) {
            // 라인 미리보기
            updateLastLinePointsTemp(msg.points);
            return;
          }
          const id = String(msg.whiteBoardObjectId || '');
          if (!id) return;
          tempShapePatchesRef.current[id] = {
            ...(tempShapePatchesRef.current[id] || {}),
            x: msg.x,
            y: msg.y,
            scaleX: msg.scaleX,
            scaleY: msg.scaleY,
            rotation: msg.rotation,
            text: msg.text,
          };
          return;
        }

        case 'MODIFY': {
          // 도형 최종 커밋
          const id = String(msg.whiteBoardObjectId);
          const type = (msg.type || '').toLowerCase();
          updateShapeFieldsCommit(id, {
            type,
            x: msg.x, y: msg.y,
            scaleX: msg.scaleX, scaleY: msg.scaleY, rotation: msg.rotation,
            text: msg.text ?? null,
            points: msg.points ?? null,
            stroke: msg.stroke ?? null,
            fill: msg.fill ?? null,
            radius: msg.radius ?? null,
            width: msg.width ?? null,
            height: msg.height ?? null,
          });
          delete tempShapePatchesRef.current[id];
          return;
        }

        case 'CREATE': {
          // 서버가 생성 완료 후 내려준 도형을 store에 추가
          const id = String(msg.whiteBoardObjectId);
          const type = (msg.type || '').toLowerCase();
          addShapeFromSocket({
            id,
            type,
            x: msg.x, y: msg.y,
            scaleX: msg.scaleX ?? 1, scaleY: msg.scaleY ?? 1, rotation: msg.rotation ?? 0,
            stroke: msg.stroke ?? null,
            fill: msg.fill ?? null,
            radius: msg.radius ?? null,
            width: msg.width ?? null,
            height: msg.height ?? null,
            points: msg.points ?? null,
            text: type === 'text' ? (msg.text ?? '') : null,
          });
          return;
        }

        // CREATE_PLACE / DELETE 미구현: 무시
        default:
          return;
      }
    },
  });

  // 송신 스로틀 (MOVE 프레임 전송용)
  const throttled = useRef({
    moveShape: null,
    updateShape: null,
    updateLine: null,
  });

  useEffect(() => {
    throttled.current.moveShape   = throttle((payload) => sendMessage('MOVE', payload), 60);
    throttled.current.updateShape = throttle((payload) => sendMessage('MOVE', payload), 60);
    throttled.current.updateLine  = throttle((payload) => sendMessage('MOVE', payload), 60);

    return () => {
      throttled.current.moveShape?.cancel?.();
      throttled.current.updateShape?.cancel?.();
      throttled.current.updateLine?.cancel?.();
    };
  }, [sendMessage, planId]);

  // Transformer 선택 유지
  useEffect(() => {
    if (internalShapeType !== 'select') {
      trRef.current?.nodes([]);
      return;
    }
    const node = stageRef.current?.findOne(`#${selectedId}`);
    if (trRef.current && node) {
      trRef.current.nodes([node]);
      trRef.current.getLayer().batchDraw();
    } else {
      trRef.current?.nodes([]);
    }
  }, [selectedId, isEditingTextId, internalShapeType]);

  // RAF 루프: tempShapePatchesRef를 실제 Konva 노드에 보간 적용
  useEffect(() => {
    const tick = () => {
      const stage = stageRef.current;
      const layer = layerRef.current;
      if (!stage || !layer) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const patches = tempShapePatchesRef.current;
      const ids = Object.keys(patches);
      if (ids.length) {
        ids.forEach((id) => {
          const patch = patches[id];
          const node = stage.findOne(`#${id}`);
          if (!node) return;

          // 부드러운 LERP
          const lerp = (cur, target, a = 0.2) => cur + (target - cur) * a;
          const attrs = {};

          if (patch.x != null)        attrs.x        = lerp(node.x(),        patch.x);
          if (patch.y != null)        attrs.y        = lerp(node.y(),        patch.y);
          if (patch.scaleX != null)   attrs.scaleX   = lerp(node.scaleX(),   patch.scaleX);
          if (patch.scaleY != null)   attrs.scaleY   = lerp(node.scaleY(),   patch.scaleY);
          if (patch.rotation != null) attrs.rotation = lerp(node.rotation(), patch.rotation);
          if (patch.text != null)     attrs.text     = patch.text; // 텍스트는 즉시

          node.setAttrs(attrs);
        });

        layer.batchDraw();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseDown = (e) => {
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    if (e.target === stageRef.current) {
      setSelectedId(null);
    }

    const drawable = ['arrow', 'circle', 'rect', 'text', 'pen'];
    if (drawable.includes(internalShapeType)) {
      startPosRef.current = pos;
    }

    // PEN: 로컬 임시 시작. 서버에는 CREATE 보내지 않음(중복 저장 방지)
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
      // 미리보기는 MOVE로만 보낼 수 있음 (선택)
      throttled.current.updateLine({
        type: 'PEN',
        points: newLine.points,
        stroke: color,
      });
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing.current || internalShapeType !== 'pen') return;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    const currentLines = [...lines];
    const lastLine = currentLines[currentLines.length - 1];
    if (!lastLine) return;

    const newPoints = [...lastLine.points, pos.x, pos.y];

    // 로컬 임시 반영(스토어 히스토리 X)
    updateLastLinePointsTemp(newPoints);

    // 스로틀 전송 (MOVE 미리보기)
    throttled.current.updateLine({
      type: 'PEN',
      points: newPoints,
      stroke: lastLine.stroke,
    });
  };

  const handleMouseUp = () => {
    if (internalShapeType === 'pen') {
      isDrawing.current = false;
      const currentLines = [...lines];
      const lastLine = currentLines[currentLines.length - 1];
      if (lastLine) {
        // 최종 저장 요청 (서버에서 저장 후 브로드캐스트 → onMessage에서 addLine 처리)
        sendMessage('MODIFY_LINE', {
          x: lastLine.points[0],
          y: lastLine.points[1],
          points: lastLine.points,
          stroke: lastLine.stroke
        });
      }
      return;
    }

    if (!startPosRef.current || internalShapeType === 'select' || internalShapeType === 'eraser') {
      startPosRef.current = null;
      return;
    }

    const end = stageRef.current?.getPointerPosition();
    const start = startPosRef.current;
    if (!end || !start) {
      startPosRef.current = null;
      return;
    }

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);

    if (internalShapeType !== 'text' && dist < 3) {
      startPosRef.current = null;
      return;
    }

    let shapeProps = {};
    switch (internalShapeType) {
      case 'arrow':
        shapeProps = { x: start.x, y: start.y, points: [0, 0, dx, dy] };
        break;
      case 'circle':
        shapeProps = {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          radius: Math.sqrt(dx ** 2 + dy ** 2) / 2
        };
        break;
      case 'rect':
        shapeProps = {
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(dx),
          height: Math.abs(dy)
        };
        break;
      case 'text':
        shapeProps = { x: start.x, y: start.y };
        break;
      default:
        break;
    }

    // CREATE 요청 (id/whiteBoardObjectId 없이 보냄 → 서버가 저장/ID 배정 후 브로드캐스트)
    const dto = buildCreatePayload(internalShapeType.toUpperCase(), shapeProps);
    sendMessage('CREATE', dto);

    startPosRef.current = null;
  };

  // 텍스트 편집 오버레이 생성
  const beginEditText = (shape) => {
    const stage = stageRef.current;
    const layer = stage.findOne('Layer');
    const pos = stage.container().getBoundingClientRect();

    const ta = document.createElement('textarea');
    ta.value = shape.text || '';
    ta.style.position = 'absolute';
    ta.style.top = `${pos.top + shape.y}px`;
    ta.style.left = `${pos.left + shape.x}px`;
    ta.style.transformOrigin = 'left top';
    ta.style.padding = '2px 4px';
    ta.style.border = '1px solid #ccc';
    ta.style.outline = 'none';
    ta.style.font = '16px sans-serif';
    ta.style.background = 'white';
    ta.style.zIndex = 9999;
    ta.rows = 1;

    const finish = (commit) => {
      if (commit) {
        const newText = ta.value;
        // 로컬 커밋
        updateShapeFieldsCommit(shape.id, {
          type: shape.type,
          x: shape.x,
          y: shape.y,
          points: null,
          scaleX: shape.scaleX ?? 1,
          scaleY: shape.scaleY ?? 1,
          rotation: shape.rotation ?? 0,
          text: newText
        });
        // 서버 커밋
        sendMessage('MODIFY', {
          whiteBoardObjectId: shape.id,
          type: (shape.type || '').toUpperCase(),
          x: shape.x,
          y: shape.y,
          points: null,
          scaleX: shape.scaleX ?? 1,
          scaleY: shape.scaleY ?? 1,
          rotation: shape.rotation ?? 0,
          text: newText
        });

        delete tempShapePatchesRef.current[shape.id];
      }
      document.body.removeChild(ta);
      layer.getStage().container().focus();
    };

    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finish(true);
      } else if (e.key === 'Escape') {
        finish(false);
      }
    });
    ta.addEventListener('blur', () => finish(true));

    document.body.appendChild(ta);
    ta.focus();
    ta.select();
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
        style={{ position: 'absolute', zIndex: 0 }}
      >
        <Layer ref={layerRef}>
          {shapes.map((shape) => {
            const { id, type, ...rest } = shape;
            const isSelectable = internalShapeType === 'select';

            // 렌더링 기본값 주입(시각 일관성)
            const vStroke      = shape.stroke ?? RENDER_DEFAULTS.stroke;
            const vStrokeWidth = shape.strokeWidth ?? RENDER_DEFAULTS.strokeWidth;
            const vFill = type === 'text'
              ? (shape.fill ?? color ?? RENDER_DEFAULTS.textColor)
              : (shape.fill ?? RENDER_DEFAULTS.fill);

            const commonProps = {
              id,
              draggable: isSelectable,
              onClick: () => setSelectedId(id),

              // 시각 관련 기본값
              stroke: vStroke,
              strokeWidth: vStrokeWidth,
              fill: vFill,

              // MOVE 미리보기 전송
              onDragMove: (e) => {
                if (!isSelectable) return;
                const x = e.target.x();
                const y = e.target.y();

                tempShapePatchesRef.current[id] = {
                  ...(tempShapePatchesRef.current[id] || {}),
                  x, y,
                };

                throttled.current.moveShape({
                  whiteBoardObjectId: id,
                  x, y
                });
              },

              // MODIFY 커밋 전송
              onDragEnd: (e) => {
                if (!isSelectable) return;
                const x = e.target.x();
                const y = e.target.y();

                updateShapeFieldsCommit(id, {
                  type,
                  x, y,
                  points: null,
                  text: type === 'text' ? shape.text ?? '' : null
                });
                sendMessage('MODIFY', {
                  whiteBoardObjectId: id,
                  type: (type || '').toUpperCase(),
                  x, y,
                  points: null,
                  text: type === 'text' ? shape.text ?? '' : null
                });

                delete tempShapePatchesRef.current[id];
              },

              // MOVE(변형) 미리보기
              onTransform: (e) => {
                if (!isSelectable) return;
                const node = e.target;
                const patch = {
                  x: node.x(),
                  y: node.y(),
                  scaleX: node.scaleX(),
                  scaleY: node.scaleY(),
                  rotation: node.rotation(),
                };

                tempShapePatchesRef.current[id] = {
                  ...(tempShapePatchesRef.current[id] || {}),
                  ...patch,
                };

                throttled.current.updateShape({
                  whiteBoardObjectId: id,
                  type: (type || '').toUpperCase(),
                  ...patch
                });
              },

              // MODIFY 커밋
              onTransformEnd: (e) => {
                if (!isSelectable) return;
                const node = e.target;
                const patch = {
                  x: node.x(),
                  y: node.y(),
                  scaleX: node.scaleX(),
                  scaleY: node.scaleY(),
                  rotation: node.rotation(),
                  points: null,
                  text: type === 'text' ? shape.text ?? '' : null
                };

                updateShapeFieldsCommit(id, { id, type, ...patch });
                sendMessage('MODIFY', {
                  whiteBoardObjectId: id,
                  type: (type || '').toUpperCase(),
                  ...patch
                });

                delete tempShapePatchesRef.current[id];
              }
            };

            if (type === 'text') {
              return (
                <Text
                  key={id}
                  {...commonProps}
                  {...rest}
                  onDblClick={() => beginEditText(shape)}
                />
              );
            }

            switch (type) {
              case 'arrow': return <Arrow key={id} {...commonProps} {...rest} />;
              case 'circle': return <Circle key={id} {...commonProps} {...rest} />;
              case 'rect':   return <Rect   key={id} {...commonProps} {...rest} />;
              default:       return null;
            }
          })}

          {lines.map(line => <Line key={line.id} {...line} />)}
          <Transformer ref={trRef} />
        </Layer>
      </Stage>

      {renderCursors(usersMap, myUuid)}
    </>
  );
};

export default WhiteBoard;
