// src/store/useNotificationStore.js
import { create } from "zustand";
import { fetchNotifications, patchNotificationRead } from "@/apis/notificationApi";

export const useNotificationStore = create((set, get) => ({
  items: [],            // [{ notificationId, message, userImgUrl, isRead }]
  loading: false,
  error: null,
  lastFetchedAt: 0,        // 마지막 로드 시간
  staleTimeMs: 15000,      // 15초 이내면 재요청 스킵 (원하면 조절)

  // 유저가 Popover 열 때마다 혹은 앱 최초 진입, 라우트 바뀔 때마다 호출
  load: async (force = false) => {

    const { lastFetchedAt, staleTimeMs, loading } = get();
    const now = Date.now();

    // 이미 로딩 중이거나, 신선하면 스킵
    if (!force && !loading && now - lastFetchedAt < staleTimeMs) return;
    try {
      set({ loading: true, error: null });
      const list = await fetchNotifications();
      set({ items: list, loading: false });
    } catch (e) {
      console.error("알림 로드 실패:", e);
      set({ loading: false, error: e?.message || "알 수 없는 오류" });
    }
  },

  // Optimistic update로 UX 부드럽게
  markAsRead: async (notificationId) => {
    const prev = get().items;
    const next = prev.map((n) =>
      n.notificationId === notificationId ? { ...n, isRead: true } : n
    );
    set({ items: next });

    try {
      await patchNotificationRead(notificationId);
    } catch (e) {
      console.error("읽음 처리 실패, 롤백:", e);
      set({ items: prev }); // 실패 시 롤백
    }
  },

  // 파생 값: 안 읽은 개수
  unreadCount: () => get().items.filter((n) => !n.isRead).length,
}));
