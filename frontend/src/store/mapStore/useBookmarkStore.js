import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Bookmark Store
 * Manages bookmarked places
 */
const useBookmarkStore = create(
  persist(
    (set, get) => ({
      // --- Bookmark State (per-plan) ---
      activePlanId: null,
      bookmarkedByPlan: {}, // { [planId]: Place[] }
      // 편의상 현재 플랜의 배열을 그대로 노출 (기존 코드 호환)
      bookmarkedPlaces: [],

      // --- Helpers ---
      _getListForPlan: (planId) => {
        const state = get();
        const key = planId || state.activePlanId || 'global';
        return state.bookmarkedByPlan[key] || [];
      },

      _setListForPlan: (planId, list) => {
        const state = get();
        const key = planId || state.activePlanId || 'global';
        const updated = { ...state.bookmarkedByPlan, [key]: list };
        set({
          bookmarkedByPlan: updated,
          // active plan이면 미러링된 배열도 갱신
          bookmarkedPlaces: key === (state.activePlanId || 'global') ? list : state.bookmarkedPlaces,
        });
      },

      // --- Bookmark Actions ---
      setActivePlanId: (planId) => {
        const list = get()._getListForPlan(planId);
        set({ activePlanId: planId, bookmarkedPlaces: list });
      },

      toggleBookmark: (place, planId = null) => {
        const normalizedId = place?.googlePlaceId || place?.place_id;
        if (!place || !normalizedId) {
          console.error('Invalid place object for bookmark:', place);
          return;
        }

        const list = get()._getListForPlan(planId);
        const isCurrentlyBookmarked = list.some(
          (p) => (p.googlePlaceId || p.place_id) === normalizedId
        );

        if (isCurrentlyBookmarked) {
          const newList = list.filter((p) => (p.googlePlaceId || p.place_id) !== normalizedId);
          get()._setListForPlan(planId, newList);
          console.log(`🔖 북마크 제거: ${place.name || place.placeName || place.displayName || normalizedId}`);
        } else {
          // 이미지 URL 정규화
          let normalizedImageUrl = place.imageUrl;
          
          // 1. googleImg 배열 확인
          if (!normalizedImageUrl && place.googleImg && Array.isArray(place.googleImg) && place.googleImg[0]) {
            normalizedImageUrl = place.googleImg[0];
          }
          
          // 2. photos 배열 확인
          if (!normalizedImageUrl && place.photos && Array.isArray(place.photos) && place.photos[0]) {
            const photo = place.photos[0];
            if (typeof photo.getUrl === 'function') {
              try {
                normalizedImageUrl = photo.getUrl({ maxWidth: 100, maxHeight: 100 });
              } catch (error) {
                console.warn('Photo getUrl 오류:', error);
              }
            } else if (typeof photo.getURI === 'function') {
              try {
                normalizedImageUrl = photo.getURI();
              } catch (error) {
                console.warn('Photo getURI 오류:', error);
              }
            } else if (typeof photo === 'string') {
              normalizedImageUrl = photo;
            } else if (photo && (photo.url || photo.src || photo.imageUrl)) {
              normalizedImageUrl = photo.url || photo.src || photo.imageUrl;
            }
          }

          const newBookmark = {
            ...place,
            googlePlaceId: normalizedId,
            imageUrl: normalizedImageUrl, // 정규화된 이미지 URL 저장
            bookmarkedAt: new Date().toISOString(),
          };
          get()._setListForPlan(planId, [...list, newBookmark]);
          console.log(`🔖 북마크 추가: ${place.name || place.placeName || place.displayName || normalizedId}`, {
            imageUrl: normalizedImageUrl
          });
        }
      },

      isBookmarked: (id, planId = null) => {
        if (!id) return false;
        const list = get()._getListForPlan(planId);
        return list.some((p) => (p.googlePlaceId || p.place_id) === id);
      },

      getBookmarkedPlaces: (planId = null) => get()._getListForPlan(planId),

      clearAllBookmarks: (planId = null) => {
        get()._setListForPlan(planId, []);
      },
    }),
    {
      name: 'map-bookmarks',
      partialize: (state) => ({
        activePlanId: state.activePlanId,
        bookmarkedByPlan: state.bookmarkedByPlan,
        bookmarkedPlaces: state.bookmarkedPlaces,
      }),
    }
  )
);

export default useBookmarkStore;
