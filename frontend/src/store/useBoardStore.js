// useBoardStore.js
import { create } from 'zustand';

export const useBoardStore = create((set, get) => ({
  shapes: [],
  lines: [],
  selectedId: null,
  isEditingTextId: null,
  shapeType: 'pen',
  color: '#000000',

  // shape 추가
  addShape: (shape) =>
    set((state) => {
      const updated = [...state.shapes, shape];
      return { shapes: updated };
    }),

  // shape 위치 및 transform 속성 업데이트
  updateShapeTransform: (id, attrs) =>
    set((state) => {
      const updated = state.shapes.map((s) =>
        s.id === id ? { ...s, ...attrs } : s
      );
      return { shapes: updated };
    }),

  // 텍스트 변경
  updateText: (id, text) =>
    set((state) => {
      const updated = state.shapes.map((s) =>
        s.id === id ? { ...s, text } : s
      );
    //   console.log('✏️ updateText:', id, text);
      return { shapes: updated };
    }),

  // 텍스트 변경 완료 후 동작
  printText: (id) => {
    const shape = get().shapes.find((s) => s.id === id);
    if (shape) {
      console.log('💬 Final Text JSON:', JSON.stringify(shape, null, 2));
    }
  },
 
  // Pen 라인 추가
  addLine: (line) =>
    set((state) => {
      const updated = [...state.lines, line];
      return { lines: updated };
    }),

  // 마지막 Pen 라인 업데이트
  updateLastLinePoints: (points) =>
    set((state) => {
      const updated = [...state.lines];
      const last = { ...updated.pop(), points };
      updated.push(last);
      return { lines: updated };
    }),

  setShapeType: (type) => set(() => {
    console.log('🛠️ Tool Selected:', type);
    return { shapeType: type };
  }),

  setColor: (color) => set(() => {
    console.log('🎨 Color Selected:', color);
    return { color };
  }),

  setSelectedId: (id) => set(() => ({ selectedId: id })),
  setIsEditingTextId: (id) => set(() => ({ isEditingTextId: id }))
}));