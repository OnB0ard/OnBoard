import { create } from "zustand";

export const useAuthStore = create((set) => ({
  userId: null,
  userName: "",
  googleEmail: "",
  profileImage: "",
  accessToken: "",
  refreshToken: "",
  setAuth: (authData) =>
    set({
      userId: authData.userId,
      userName: authData.userName,
      googleEmail: authData.googleEmail,
      profileImage: authData.profileImage,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    }),
  clearAuth: () =>
    set({
      userId: null,
      userName: "",
      googleEmail: "",
      profileImage: "",
      accessToken: "",
      refreshToken: "",
    }),
}));
