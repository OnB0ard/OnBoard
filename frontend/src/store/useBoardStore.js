import { create } from 'zustand';

// lint-safe hasOwnProperty
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

//  null이 아닌 키만 머지
const mergeNonNull = (target, patch) =>
  Object.fromEntries(
    Object.entries({ ...target, ...patch }).map(([k, v]) => [
      k,
      (has(patch, k) && patch[k] === null) ? target[k] : v
    ])
  );

export const useBoardStore = create((set, get) => ({
  shapes: [],
  lines: [],
  selectedId: null,
  isEditingTextId: null,
  shapeType: 'pen',
  color: '#000000',

  historyStep: 0,
  shapesHistory: [[]],
  linesHistory: [[]],

  saveHistory: (newShapes, newLines) => {
    const { historyStep, shapesHistory, linesHistory } = get();
    const trimmedShapesHistory = shapesHistory.slice(0, historyStep + 1);
    const trimmedLinesHistory = linesHistory.slice(0, historyStep + 1);
    const nextShapes = [...trimmedShapesHistory, newShapes];
    const nextLines = [...trimmedLinesHistory, newLines];
    set({
      shapes: newShapes,
      lines: newLines,
      shapesHistory: nextShapes,
      linesHistory: nextLines,
      historyStep: nextShapes.length - 1
    });
  },

    // 서버에서 처음 불러온 상태로 보드를 초기화(히스토리도 리셋)
  replaceAllFromServer: (newShapes, newLines) => {
    set({
      shapes: newShapes,
      lines: newLines,
      shapesHistory: [newShapes],
      linesHistory: [newLines],
      historyStep: 0,
    });
  },

  updateShapesAndSave: (newShapes) => {
    const lines = get().lines;
    get().saveHistory(newShapes, lines);
  },

  updateLinesAndSave: (newLines) => {
    const shapes = get().shapes;
    get().saveHistory(shapes, newLines);
  },

  // 텍스트 변경 (줄바꿈 제거)
  updateText: (id, text) => {
    const cleaned = text.replace(/\n$/, '').trimEnd();
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, text: cleaned } : s)),
    }));
  },

  // 텍스트 수정 완료 시 저장
  printText: (id) => {
    const shape = get().shapes.find((s) => s.id === id);
    if (shape) {
      const updatedShapes = get().shapes.map((s) =>
        s.id === id ? { ...s, text: shape.text } : s
      );
      get().saveHistory(updatedShapes, get().lines);
      console.log('Final Text JSON:', JSON.stringify(shape, null, 2));
    }
  },

  // undo 후 현재 상태에서 diff 출력
  undo: () => {
    const { historyStep, shapesHistory, linesHistory } = get();
    if (historyStep > 0) {
      const prevShapes = shapesHistory[historyStep - 1];
      const prevLines = linesHistory[historyStep - 1];

      set({
        shapes: prevShapes,
        lines: prevLines,
        historyStep: historyStep - 1
      });

      const newShapes = get().shapes;
      const newLines = get().lines;

      const diffShapes = newShapes.filter(ns => !shapesHistory[historyStep].some(cs => cs.id === ns.id && JSON.stringify(cs) === JSON.stringify(ns)));
      const diffLines = newLines.filter(nl => !linesHistory[historyStep].some(cl => cl.id === nl.id && JSON.stringify(cl) === JSON.stringify(nl)));

      if (diffShapes.length > 0) console.log('↩ Undo Changed Shapes:', JSON.stringify(diffShapes, null, 2));
      if (diffLines.length > 0) console.log('↩ Undo Changed Lines:', JSON.stringify(diffLines, null, 2));
    }
  },

  // redo 후 현재 상태에서 diff 출력
  redo: () => {
    const { historyStep, shapesHistory, linesHistory } = get();
    if (historyStep < shapesHistory.length - 1) {
      const nextShapes = shapesHistory[historyStep + 1];
      const nextLines = linesHistory[historyStep + 1];

      set({
        shapes: nextShapes,
        lines: nextLines,
        historyStep: historyStep + 1
      });

      const newShapes = get().shapes;
      const newLines = get().lines;

      const diffShapes = newShapes.filter(ns => !shapesHistory[historyStep].some(cs => cs.id === ns.id && JSON.stringify(cs) === JSON.stringify(ns)));
      const diffLines = newLines.filter(nl => !linesHistory[historyStep].some(cl => cl.id === nl.id && JSON.stringify(cl) === JSON.stringify(nl)));

      if (diffShapes.length > 0) console.log('↪ Redo Changed Shapes:', JSON.stringify(diffShapes, null, 2));
      if (diffLines.length > 0) console.log('↪ Redo Changed Lines:', JSON.stringify(diffLines, null, 2));
    }
  },


  // shape 추가
  addShape: (shape) => {
    const updated = [...get().shapes, shape];
    get().saveHistory(updated, get().lines);
  },

  // Pen 라인 추가
  addLine: (line) => {
    const updated = [...get().lines, line];
    // get().saveHistory(get().shapes, updated);
    set({lines: updated});
  },

  // MouseUp하면 해당 마지막 points를 반영하고 saveHistory
  updateLastLinePoints: (points) => {
    const lines = [...get().lines];
    const last = { ...lines.pop(), points };
    lines.push(last);
    get().saveHistory(get().shapes, lines);
    // set({lines});
  },
  
  // MouseMove하는 동안의 매 x,y points 반영
  updateLastLinePointsTemp: (points) => {
    const lines = [...get().lines];
    const last = { ...lines.pop(), points };
    lines.push(last);
    // get().saveHistory(get().shapes, lines);
    set({lines});
  },

  removeShapeById: (id) => {
    const shape = get().shapes.find((s) => s.id === id);
    if (shape) {
      const updatedShapes = get().shapes.filter((s) => s.id !== id);
      get().saveHistory(updatedShapes, get().lines);
      return;
    }

    const line = get().lines.find((l) => l.id === id);
    if (line) {
      const updatedLines = get().lines.filter((l) => l.id !== id);
      get().saveHistory(get().shapes, updatedLines);
    }
  },

  addShapeFromSocket: (shape) => {
  const updated = [...get().shapes, shape];
  set({ shapes: updated }); // 서버에서 받은 건 히스토리 저장 X
  },

  // 드래그 중 임시 위치 반영 (히스토리 저장 X)
  updateShapePositionTemp: (id, x, y) => {
    const updated = get().shapes.map((s) =>
      s.id === id ? { ...s, x, y } : s
    );
    set({ shapes: updated }); // 히스토리 저장 없음
  },

  // 위치/트랜스폼 최종 저장 (히스토리 저장 O)
  updateShapeTransform: (id, attrs) => {
    const updated = get().shapes.map((s) =>
      s.id === id ? { ...s, ...attrs } : s
    );
    get().saveHistory(updated, get().lines);
  },

  // 부분 업데이트 임시반영: 히스토리 저장 X (실시간 미리보기용)
  updateShapeFieldsTemp: (id, fields) => {
    const updated = get().shapes.map(s => {
      if (s.id !== id) return s;
      const next = { ...s };
      const keys = ['type','x','y','points','scaleX','scaleY','rotation','text','stroke','width','height','radius','fill'];
      for (const key of keys) {
        if (has(fields, key) && fields[key] !== null) next[key] = fields[key];
      }
      return next;
    });
    set({ shapes: updated }); // 히스토리 저장 안 함
  },

  // 부분 업데이트 커밋: 히스토리 저장 O
  updateShapeFieldsCommit: (id, fields) => {
    const updated = get().shapes.map(s => {
      if (s.id !== id) return s;
      const merged = {};
      const keys = ['type','x','y','points','scaleX','scaleY','rotation','text','stroke','width','height','radius','fill'];
      for (const key of keys) {
        if (has(fields, key)) merged[key] = (fields[key] === null) ? s[key] : fields[key];
      }
      return { ...s, ...merged };
    });
    get().saveHistory(updated, get().lines);
  },

  // 소켓 수신 커밋(히스토리 저장 O)
  updateShapeFromSocketCommit: (id, fields) => {
    const updated = get().shapes.map(s => (s.id === id ? mergeNonNull(s, fields) : s));
    get().saveHistory(updated, get().lines);
  },

  setShapeType: (type) => set(() => {
    console.log('Tool Selected:', type);
    return { shapeType: type };
  }),
  setColor: (color) => set(() => ({ color })),
  setSelectedId: (id) => set(() => ({ selectedId: id })),
  setIsEditingTextId: (id) => set(() => ({ isEditingTextId: id }))
}));

