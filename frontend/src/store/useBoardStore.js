// useBoardStore.js
import { create } from 'zustand';

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

  // undo: () => {
  //   const { historyStep, shapesHistory, linesHistory } = get();
  //   if (historyStep > 0) {
  //     const prevShapes = shapesHistory[historyStep - 1];
  //     const prevLines = linesHistory[historyStep - 1];
  //     const currShapes = shapesHistory[historyStep];
  //     const currLines = linesHistory[historyStep];

  //     const diffShapes = currShapes.filter(cs => !prevShapes.some(ps => ps.id === cs.id && JSON.stringify(ps) === JSON.stringify(cs)));
  //     const diffLines = currLines.filter(cl => !prevLines.some(pl => pl.id === cl.id && JSON.stringify(pl) === JSON.stringify(cl)));

  //     if (diffShapes.length > 0) console.log('↩ Undo Changed Shapes:', JSON.stringify(diffShapes, null, 2));
  //     if (diffLines.length > 0) console.log('↩ Undo Changed Lines:', JSON.stringify(diffLines, null, 2));

  //     set({
  //       shapes: prevShapes,
  //       lines: prevLines,
  //       historyStep: historyStep - 1
  //     });
  //   }
  // },

  // redo: () => {
  //   const { historyStep, shapesHistory, linesHistory } = get();
  //   if (historyStep < shapesHistory.length - 1) {
  //     const nextShapes = shapesHistory[historyStep + 1];
  //     const nextLines = linesHistory[historyStep + 1];
  //     const currShapes = shapesHistory[historyStep];
  //     const currLines = linesHistory[historyStep];

  //     const diffShapes = nextShapes.filter(ns => !currShapes.some(cs => cs.id === ns.id && JSON.stringify(cs) === JSON.stringify(ns)));
  //     const diffLines = nextLines.filter(nl => !currLines.some(cl => cl.id === nl.id && JSON.stringify(cl) === JSON.stringify(nl)));

  //     if (diffShapes.length > 0) console.log('↪ Redo Changed Shapes:', JSON.stringify(diffShapes, null, 2));
  //     if (diffLines.length > 0) console.log('↪ Redo Changed Lines:', JSON.stringify(diffLines, null, 2));

  //     set({
  //       shapes: nextShapes,
  //       lines: nextLines,
  //       historyStep: historyStep + 1
  //     });
  //   }
  // },


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

  // 위치 및 transform 속성 업데이트
  updateShapeTransform: (id, attrs) => {
    const updated = get().shapes.map((s) =>
      s.id === id ? { ...s, ...attrs } : s
    );
    get().saveHistory(updated, get().lines);
  },

  // Pen 라인 추가
  addLine: (line) => {
    const updated = [...get().lines, line];
    get().saveHistory(get().shapes, updated);
  },

  updateLastLinePoints: (points) => {
    const lines = [...get().lines];
    const last = { ...lines.pop(), points };
    lines.push(last);
    get().saveHistory(get().shapes, lines);
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

  setShapeType: (type) => set(() => {
    console.log('Tool Selected:', type);
    return { shapeType: type };
  }),
  setColor: (color) => set(() => ({ color })),
  setSelectedId: (id) => set(() => ({ selectedId: id })),
  setIsEditingTextId: (id) => set(() => ({ isEditingTextId: id }))
}));
