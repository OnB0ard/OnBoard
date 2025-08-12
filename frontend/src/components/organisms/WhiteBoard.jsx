// src/components/whiteboard/WhiteBoard.jsx
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Line, Arrow, Circle, Rect, Text, Transformer } from 'react-konva';
import { useBoardStore } from '../../store/useBoardStore';
import EditToolBar from './EditToolBar';
import { Cursor } from "../atoms/Cursor";
import { useAuthStore } from "@/store/useAuthStore";
import { useStompWebSocket } from "@/hooks/useStompWebSocket";
import { getWhiteBoardObjects } from '../../apis/whiteBoardApi';
import { useParams } from "react-router-dom";
import { useMouseStomp } from "@/hooks/useMouseWebSocket";

//커서 색상(순서)
const COLORS = ["blue", "purple","yellow", "green","red", "orange" ];

// 렌더링 기본값(화면 표시용; 서버 DTO 기본값과는 분리)
const RENDER_DEFAULTS = {
  stroke: '#222',
  strokeWidth: 2,
  fill: null,
  textColor: '#222',
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

// 커서 렌더 (내 커서는 숨김, 입장 순서대로 색상 부여)
const renderCursors = (users, myUserName, userOrder) =>
  Object.entries(users).map(([userId, user]) => {
    // const userName = useAuthStore((s) => s.userName);

    if (userId === myUserName) return null;
    const { x, y } = user?.state || {};
    if (x == null || y == null) return null;

    const colorIndex = userOrder.indexOf(userId);
    const color = COLORS[colorIndex % COLORS.length] || "gray";

    return (
      <Cursor
        key={userId}
        userId={userId}
        point={[x, y]}
        color={color}
        label={userId} // 이름표로 표시
      />
    );
  });

//객체에서 null 또는 undefined 값을 가진 속성을 제거
const omitNil = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));

// 서버 다이어그램 -> 로컬 store 형태로 정규화
const normalizeDiagrams = (list = []) => {
  const shapes = [];
  const lines = [];
  for (const d of list) {
    const id = String(d.whiteBoardObjectId ?? d.id ?? Date.now());
    const type = (d.type || '').toLowerCase(); // "CIRCLE" -> "circle"

    if (type === 'pen' || type === 'line') {
      // 선은 lines로
      lines.push({
        id: `line-${id}`,
        type: 'pen',
        points: Array.isArray(d.points) ? d.points : [],
        stroke: d.stroke ?? '#000000',
        strokeWidth: 3,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      });
      continue;
    }

    // 공통 도형 속성
    const base = {
      id,
      type,           // 'circle' | 'rect' | 'arrow' | 'text' ...
      x: d.x ?? 0,
      y: d.y ?? 0,
      scaleX: d.scaleX ?? 1,
      scaleY: d.scaleY ?? 1,
      rotation: d.rotation ?? 0,
      stroke: d.stroke ?? undefined,
      fill: d.fill ?? undefined,
    };

    // 타입별 보강
    if (type === 'text') base.text = d.text ?? '';
    if (type === 'circle') base.radius = d.radius ?? 0;
    if (type === 'rect') {
      base.width = d.width ?? 0;
      base.height = d.height ?? 0;
    }
    if (type === 'arrow') {
      if (Array.isArray(d.points)) base.points = d.points;
      else base.points = [0, 0, (d.width ?? 0), (d.height ?? 0)];
    }

    shapes.push(base);
  }
  return { shapes, lines };
};

const WhiteBoard = ({ planId: planIdProp }) => {
  const params = useParams();
  const planId = planIdProp ?? params.planId;

  const stageRef = useRef();
  const layerRef = useRef(null);
  const trRef = useRef();
  const startPosRef = useRef(null);
  const isDrawing = useRef(false);

  // eraser
  const isErasing = useRef(false);
  const erasedIdsRef = useRef(new Set());

  // temp patches (MOVE 미리보기)
  const tempShapePatchesRef = useRef({});
  const rafRef = useRef(null);

  // 현재 그리고 있는 임시 라인 id
  const tempLineIdRef = useRef(null);

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
    setColor,
    removeShapeById,
    replaceAllFromServer,
  } = useBoardStore();

  //커서
  const userName = useAuthStore((s) => s.userName);
  const accessToken = useAuthStore((s) => s.accessToken);
  // const myEmail = useMemo(() => email || getOrCreateClientId(), [email]);
  const myUserName = useMemo(() => userName , [userName]);

  // const WS_URL = "http://70.12.247.36:8080/ws";
  const WS_URL = "https://i13a504.p.ssafy.io/ws";

  const { connected, users, userOrder, lastDto, pubCount, subCount } = useMouseStomp({
    userName: myUserName,
    token: accessToken,
    planId,
    wsUrl: WS_URL,
    throttleMs: 24,
  });

  // 초기 로드: planId로 서버 데이터 가져와 store에 초기화
  useEffect(() => {
    if (!planId) return;
    (async () => {
      try {
        const { whiteBoardDiagrams } = await getWhiteBoardObjects(planId);
        const { shapes: initShapes, lines: initLines } = normalizeDiagrams(whiteBoardDiagrams);
        replaceAllFromServer(initShapes, initLines);
      } catch (err) {
        console.error("화이트보드 초기 로드 실패:", err);
      }
    })();
  }, [planId, replaceAllFromServer]);

  const internalShapeType = shapeType === 'cursor' ? 'select' : shapeType;
  // const accessToken = useAuthStore(s => s.accessToken);

  // 서버로 보낼 CREATE payload
  const buildCreatePayload = (type, props = {}) => ({
    type,
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
    planId,
    wsUrl: 'https://i13a504.p.ssafy.io/ws',
    accessToken,

    onMessage: (msg) => {
      const { action, points } = msg || {};
      // 라인 확정: (A) action 없음 + points 있음  OR  (B) action === 'MODIFY_LINE'
      const isLineCommit =
        (!action && Array.isArray(points)) ||
        (action === 'MODIFY_LINE' && Array.isArray(points));

      if (isLineCommit) {
        // 1) 내가 그리고 있던 temp 라인 제거
        if (tempLineIdRef.current) {
          removeShapeById(tempLineIdRef.current);
          tempLineIdRef.current = null;
        }
        // 2) 서버 id로 확정 라인 추가
        const lineId = msg.whiteBoardObjectId ?? Date.now();
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
        case 'DELETE': {
          const rid = String(msg.whiteBoardObjectId);
          removeShapeById(rid);
          removeShapeById(`line-${rid}`);
          return;
        }
        case 'MOVE': {
          if (msg.type === 'PEN' && Array.isArray(msg.points)) {
            // 현재 정책: 그리는 동안은 로컬 전용이므로 무시
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
          const id = String(msg.whiteBoardObjectId);
          const type = (msg.type || '').toLowerCase();

          // 타입별 안전 정리
          const base = {
            id,
            type,
            x: msg.x, y: msg.y,
            scaleX: msg.scaleX ?? 1,
            scaleY: msg.scaleY ?? 1,
            rotation: msg.rotation ?? 0,
            stroke: msg.stroke ?? undefined,
            fill: msg.fill ?? undefined,
            text: type === 'text' ? (msg.text ?? '') : undefined,
          };
          if (type === 'circle') {
            base.radius = msg.radius;
          } else if (type === 'rect' || type === 'arrow') {
            base.width = msg.width ?? undefined;
            base.height = msg.height ?? undefined;
            base.points = Array.isArray(msg.points) ? msg.points : undefined;
          }

          addShapeFromSocket(omitNil(base));
          return;
        }
        default:
          return;
      }
    },
  });

  // 송신 스로틀 (MOVE 프레임 전송용) — 펜에선 사용 안 함
  const throttled = useRef({
    moveShape: null,
    updateShape: null,
  });

  useEffect(() => {
    throttled.current.moveShape   = throttle((payload) => sendMessage('MOVE', payload), 60);
    throttled.current.updateShape = throttle((payload) => sendMessage('MOVE', payload), 60);
    return () => {
      throttled.current.moveShape?.cancel?.();
      throttled.current.updateShape?.cancel?.();
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

          const lerp = (cur, target, a = 0.2) => cur + (target - cur) * a;
          const attrs = {};
          if (patch.x != null)        attrs.x        = lerp(node.x(),        patch.x);
          if (patch.y != null)        attrs.y        = lerp(node.y(),        patch.y);
          if (patch.scaleX != null)   attrs.scaleX   = lerp(node.scaleX(),   patch.scaleX);
          if (patch.scaleY != null)   attrs.scaleY   = lerp(node.scaleY(),   patch.scaleY);
          if (patch.rotation != null) attrs.rotation = lerp(node.rotation(), patch.rotation);
          if (patch.text != null)     attrs.text     = patch.text;

          node.setAttrs(attrs);
        });

        layer.batchDraw();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // 포인터 위치에서 닿은 노드를 찾아 서버 DELETE + 로컬 제거
  const eraseAtPointer = (pointer) => {
    const stage = stageRef.current;
    if (!stage) return;

    const allIds = [
      ...shapes.map(s => s.id),
      ...lines.map(l => l.id),
    ];

    for (const id of allIds) {
      if (erasedIdsRef.current.has(id)) continue;
      const node = stage.findOne(`#${id}`);
      if (!node) continue;
      const hit = node.intersects(pointer);
      if (!hit) continue;

      if (typeof id === 'string' && id.startsWith('pen-')) {
        erasedIdsRef.current.add(id);
        removeShapeById(id);
        continue;
      }

      let serverId = id;
      if (typeof id === 'string' && id.startsWith('line-')) {
        const n = id.slice(5);
        if (/^\d+$/.test(n)) serverId = n;
        else {
          erasedIdsRef.current.add(id);
          removeShapeById(id);
          continue;
        }
      }

      erasedIdsRef.current.add(id);
      removeShapeById(id);
      sendMessage('DELETE', { whiteBoardObjectId: serverId });
    }
  };

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

    // ERASER 시작
    if (internalShapeType === 'eraser') {
      isErasing.current = true;
      erasedIdsRef.current.clear();
      eraseAtPointer(pos);
      return;
    }

    // PEN: 로컬 임시 시작(서버 전송 X)
    if (internalShapeType === 'pen') {
      isDrawing.current = true;
      const tempId = `line-tmp-${Date.now()}`;
      tempLineIdRef.current = tempId;

      const newLine = {
        id: tempId,
        type: 'pen',
        points: [pos.x, pos.y],
        stroke: color,
        strokeWidth: 3,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      };
      addLine(newLine);
    }
  };

  const handleMouseMove = () => {
    // ERASER: 이동 중 지속 삭제
    if (internalShapeType === 'eraser' && isErasing.current) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) eraseAtPointer(pos);
      return;
    }

    // PEN: 로컬 임시 라인 업데이트 (서버 전송 없음)
    if (!isDrawing.current || internalShapeType !== 'pen') return;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    const currentLines = [...lines];
    const lastLine = currentLines[currentLines.length - 1];
    if (!lastLine) return;

    const newPoints = [...lastLine.points, pos.x, pos.y];
    updateLastLinePointsTemp(newPoints);
  };

  const handleMouseUp = () => {
    // ERASER 종료
    if (internalShapeType === 'eraser') {
      isErasing.current = false;
      erasedIdsRef.current.clear();
      return;
    }

    // PEN 종료: 서버에만 최종 저장 요청 보내고, 서버 응답 오면 temp 교체
    if (internalShapeType === 'pen') {
      isDrawing.current = false;
      const currentLines = [...lines];
      const lastLine = currentLines[currentLines.length - 1];
      if (lastLine) {
        updateLastLinePoints(lastLine.points);
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
        setShapeType('select'); //text를 하나 생성하면 select로 자동 변경
        break;
      default:
        break;
    }

    const dto = buildCreatePayload(internalShapeType.toUpperCase(), shapeProps);
    sendMessage('CREATE', dto);

    startPosRef.current = null;
  };

  // 텍스트 편집 오버레이
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

            const vStroke      = shape.stroke ?? RENDER_DEFAULTS.stroke;
            const vStrokeWidth = shape.strokeWidth ?? RENDER_DEFAULTS.strokeWidth;
            const vFill = type === 'text'
              ? (shape.fill ?? color ?? RENDER_DEFAULTS.textColor)
              : (shape.fill ?? RENDER_DEFAULTS.fill);

            const commonProps = {
              id,
              draggable: isSelectable,
              onClick: () => setSelectedId(id),
              stroke: vStroke,
              strokeWidth: vStrokeWidth,
              fill: vFill,
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
                  fontFamily="poppins"
                  {...commonProps}
                  {...rest}
                  strokeWidth={0.1}
                  fill = {commonProps.stroke}
                  onDblClick={() => beginEditText(shape)}
                />
              );
            }

            switch (type) {
              case 'arrow': return <Arrow key={id} {...commonProps} {...rest} />;
              case 'circle': {
                const clean = omitNil(rest);
                delete clean.width;
                delete clean.height;
                return <Circle key={id} {...clean} {...commonProps} />;
              }
              case 'rect':   return <Rect key={id} {...commonProps} {...rest} />;
              default:       return null;
            }
          })}

          {/* 라인: 히트 감도 개선 */}
          {lines.map(line => <Line key={line.id} {...line} hitStrokeWidth={16} />)}
          <Transformer ref={trRef} />
        </Layer>
      </Stage>

      {renderCursors(users, myUserName, userOrder)}
    </>
  );
};

export default WhiteBoard;
