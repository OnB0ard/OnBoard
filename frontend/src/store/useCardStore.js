import { create } from 'zustand';

export const useCardStore = create((set) => ({
  participantOpenId: null, 
  shareOpenId: null,      

  toggleParticipantPopover: (planId) => set((state) => ({
    participantOpenId: state.participantOpenId === planId ? null : planId,
    shareOpenId: null, 
  })),

  toggleSharePopover: (planId) => set((state) => ({
    shareOpenId: state.shareOpenId === planId ? null : planId,
    participantOpenId: null, 
  })),

  closeAllPopovers: () => set({
    participantOpenId: null,
    shareOpenId: null,
  }),

  // 팝오버가 열려있는지 확인하는 getter
  isAnyPopoverOpen: (state) => state.participantOpenId !== null || state.shareOpenId !== null,
}));