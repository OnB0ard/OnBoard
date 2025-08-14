import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      userId: null,
      userName: "",
      googleEmail: "",
      profileImage: "",
      accessToken: "",
      hydrated: false,
      setAuth: (authData) =>
        set((state) => ({
          ...state,
          ...authData,
        })),
      
      updateProfile: (userName, profileImage) =>
        set(() => ({ userName, profileImage })),
      
      clearAuth: () =>
        set({
          userId: null,
          userName: "",
          googleEmail: "",
          profileImage: "",
          accessToken: "",
        }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage), 
      // "auth-storage"(localStorage)에 JSON 형식으로 userid 등 저장
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        googleEmail: state.googleEmail,
        profileImage: state.profileImage,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.();
      },
    }
  )
);
