import { create } from 'zustand';

const useLoginModalStore = create((set) => ({
  isOpen: false,
  
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));

export default useLoginModalStore; 