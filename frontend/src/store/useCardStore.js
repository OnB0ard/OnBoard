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
}));