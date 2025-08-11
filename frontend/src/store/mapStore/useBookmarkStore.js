import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPlanBookmark } from '@/apis/planBookmark';
import useDailyPlanStore from '@/store/useDailyPlanStore';

/**
 * Bookmark Store
 * Manages bookmarked places
 */
const useBookmarkStore = create(
  persist(
    (set, get) => ({
      // 내부 유틸: 안전한 planId 확보
      _resolvePlanId: (planId) => {
        if (planId) return planId;
        try {
          const state = useDailyPlanStore.getState?.();
          const storePlanId = state?.planId || state?.currentPlanId;
          if (storePlanId) return storePlanId;
        } catch (e) {
          console.warn('planId from store unavailable:', e);
        }
        try {
          const { pathname, search, hash } = window.location || {};
          // /plan/123 또는 /plans/123 같은 패턴 지원 (경로 어디에 있어도 숫자 캡처)
          const pathMatch = pathname && pathname.match(/\/(?:plan|plans)(?:\/detail)?\/(\d+)/);
          if (pathMatch && pathMatch[1]) return Number(pathMatch[1]);
          // 해시 라우터 지원: #/plan/123
          const hashMatch = hash && hash.match(/#\/(?:plan|plans)(?:\/detail)?\/(\d+)/);
          if (hashMatch && hashMatch[1]) return Number(hashMatch[1]);
          const q = new URLSearchParams(search);
          const qid = q.get('planId') || q.get('id') || q.get('pid');
          if (qid) return Number(qid);
        } catch (e) {
          console.warn('planId from URL unavailable:', e);
        }
        return undefined;
      },
      // --- Bookmark State ---
      bookmarkedPlaces: [],
      _wsSenders: { sendCreate: null, sendDelete: null },
      
      // --- Bookmark Actions (with API) ---
      loadBookmarks: async (planId) => {
        const effectivePlanId = get()._resolvePlanId(planId);
        console.debug('[bookmark] loadBookmarks planId:', planId, '=> effective', effectivePlanId);
        if (!effectivePlanId) return;
        try {
          const res = await getPlanBookmark(effectivePlanId);
          // 서버 응답 형태 유연 처리: body 또는 data 직접
          const list = (res && (res.body || res.data || res)) ?? [];
          // 배열만 저장
          const normalized = Array.isArray(list) ? list : (Array.isArray(list.items) ? list.items : []);
          console.log('[bookmark] loadBookmarks normalized len:', normalized.length);
          set({ bookmarkedPlaces: normalized });
        } catch (err) {
          console.error('북마크 목록 불러오기 실패:', err);
        }
      },

      // --- WebSocket wiring ---
      setBookmarkWsSenders: ({ sendCreate, sendDelete }) => {
        console.log('[bookmark] WS senders wired:', {
          hasCreate: !!sendCreate,
          hasDelete: !!sendDelete,
        });
        set({ _wsSenders: { sendCreate, sendDelete } });
      },
      clearBookmarkWsSenders: () => {
        console.log('[bookmark] WS senders cleared');
        set({ _wsSenders: { sendCreate: null, sendDelete: null } });
      },
      handleBookmarkWsMessage: (msg) => {
        console.log('[bookmark] WS message received:', msg);
        if (!msg || !msg.action) return;
        const action = msg.action;
        if (action === 'CREATE') {
          const item = { ...msg };
          // 서버 필드명 호환: bookmarkId가 없고 placeId만 온다면 bookmarkId로 매핑 시도
          if (!item.bookmarkId && item.placeId) item.bookmarkId = item.placeId;
          set((state) => {
            const existsIdx = state.bookmarkedPlaces.findIndex(
              (p) => (p.bookmarkId && item.bookmarkId && p.bookmarkId === item.bookmarkId) ||
                     (p.googlePlaceId && item.googlePlaceId && p.googlePlaceId === item.googlePlaceId)
            );
            if (existsIdx >= 0) {
              const next = [...state.bookmarkedPlaces];
              next[existsIdx] = { ...next[existsIdx], ...item, pending: false };
              console.log('[bookmark] WS CREATE -> updated existing index', existsIdx);
              return { bookmarkedPlaces: next };
            }
            console.log('[bookmark] WS CREATE -> append new');
            return { bookmarkedPlaces: [...state.bookmarkedPlaces, { ...item, pending: false }] };
          });
        } else if (action === 'DELETE') {
          const bid = msg.bookmarkId ?? msg.placeId;
          if (!bid) return;
          console.log('[bookmark] WS DELETE -> removing bookmarkId:', bid);
          set((state) => ({
            bookmarkedPlaces: state.bookmarkedPlaces.filter((p) => p.bookmarkId !== bid),
          }));
        }
      },

      addBookmark: async (place, planId) => {
        const effectivePlanId = get()._resolvePlanId(planId);
        console.debug('[bookmark] addBookmark effectivePlanId:', effectivePlanId, 'place:', place);
        if (!place || !place.googlePlaceId || !effectivePlanId) {
          console.error('유효하지 않은 북마크 추가 요청:', { place, planId: effectivePlanId });
          return;
        }
        try {
          // place 필드 매핑
          const payload = {
            googlePlaceId: place.googlePlaceId,
            placeName: place.placeName || place.name || place.displayName,
            latitude: place.latitude ?? place.lat ?? place.location?.lat ?? null,
            longitude: place.longitude ?? place.lng ?? place.location?.lng ?? null,
            phoneNumber: place.phoneNumber || place.formatted_phone_number || null,
            address: place.address || place.formatted_address || null,
            rating: place.rating || null,
            ratingCount: place.ratingCount || place.user_ratings_total || null,
            // Google 지도 URL 우선순위: 명시적 placeUrl > googleUrl > place_id 기반 URL
            placeUrl: place.placeUrl 
              || place.googleUrl 
              || (place.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${place.googlePlaceId}` : null),
            // 이미지: 제공된 imageUrl > googleImg[0] > null
            imageUrl: (place.imageUrl && typeof place.imageUrl === 'string')
              ? place.imageUrl
              : (Array.isArray(place.googleImg) && place.googleImg.length > 0 ? place.googleImg[0] : null),
            // 사이트 URL: 세부정보 website 필드 보강
            siteUrl: place.siteUrl || place.website || null,
            // 카테고리: primaryCategory > category > categories[0]
            category: place.primaryCategory || place.category || (Array.isArray(place.categories) ? place.categories[0] : null),
          };
          console.log('[bookmark] addBookmark payload:', payload);
          const { _wsSenders } = get();
          if (_wsSenders.sendCreate) {
            // WS 전송 + 낙관적 추가
            const tempItem = { ...payload, pending: true };
            console.log('[bookmark] addBookmark via WS (optimistic append)');
            set((state) => ({ bookmarkedPlaces: [...state.bookmarkedPlaces, tempItem] }));
            _wsSenders.sendCreate(payload);
          } else {
            console.warn('[bookmark] addBookmark skipped: WS sender unavailable');
          }
        } catch (err) {
          console.error('북마크 추가 실패:', err);
        }
      },

      removeBookmark: async (googlePlaceId, planId) => {
        const effectivePlanId = get()._resolvePlanId(planId);
        console.debug('[bookmark] removeBookmark effectivePlanId:', effectivePlanId, 'googlePlaceId:', googlePlaceId);
        if (!googlePlaceId || !effectivePlanId) return;
        try {
          const { bookmarkedPlaces } = get();
          const target = bookmarkedPlaces.find(p => (p.googlePlaceId || p.place_id) === googlePlaceId);
          const bookmarkId = target?.bookmarkId || target?.id || target?.placeId; // 서버 필드 호환
          const { _wsSenders } = get();
          if (_wsSenders.sendDelete && bookmarkId) {
            // WS 전송 + 낙관적 제거
            console.log('[bookmark] removeBookmark via WS. bookmarkId:', bookmarkId);
            set({ bookmarkedPlaces: bookmarkedPlaces.filter(p => (p.googlePlaceId || p.place_id) !== googlePlaceId) });
            _wsSenders.sendDelete(bookmarkId);
          } else if (bookmarkId) {
            console.warn('[bookmark] removeBookmark skipped: WS sender unavailable');
          } else {
            // 식별자 없으면 로컬 제거만 수행
            console.log('[bookmark] removeBookmark local-only. no bookmarkId found');
            set({ bookmarkedPlaces: bookmarkedPlaces.filter(p => (p.googlePlaceId || p.place_id) !== googlePlaceId) });
          }
        } catch (err) {
          console.error('북마크 삭제 실패:', err);
        }
      },

      toggleBookmark: async (place, planId) => {
        const effectivePlanId = get()._resolvePlanId(planId);
        console.debug('[bookmark] toggleBookmark effectivePlanId:', effectivePlanId, 'raw place:', place);
        // 업스트림에서 TextSearch 원본 객체가 올 수 있으므로 즉석 정규화
        let normalized = place;
        if (place && !place.googlePlaceId && place.place_id) {
          try {
            const lat = typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : place.geometry?.location?.lat;
            const lng = typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : place.geometry?.location?.lng;
            normalized = {
              googlePlaceId: place.place_id,
              placeName: place.placeName || place.name || place.displayName,
              address: place.address || place.formatted_address || null,
              latitude: lat ?? null,
              longitude: lng ?? null,
              googleImg: Array.isArray(place.photos) && place.photos.length > 0 ? [place.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 })] : [],
              rating: place.rating || null,
              ratingCount: place.user_ratings_total || null,
              siteUrl: place.website || place.websiteURI || null,
              phoneNumber: place.formatted_phone_number || null,
              primaryCategory: place.primaryCategory || null,
              categories: place.categories || place.types || [],
              googleUrl: place.googleUrl || null,
            };
          } catch (e) {
            console.warn('북마크 정규화 실패, 원본 객체 사용:', e);
            normalized = place;
          }
        }

        if (!normalized || !normalized.googlePlaceId) {
          console.error('Invalid place object for bookmark:', place);
          return;
        }
        const { isBookmarked, addBookmark, removeBookmark } = get();
        const bookmarked = isBookmarked(normalized.googlePlaceId);
        console.log('[bookmark] toggle -> currently', bookmarked ? 'bookmarked' : 'not bookmarked');
        if (bookmarked) {
          await removeBookmark(normalized.googlePlaceId, effectivePlanId);
          console.log(`🔖 북마크 제거: ${normalized.placeName || normalized.name}`);
        } else {
          await addBookmark(normalized, effectivePlanId);
          console.log(`🔖 북마크 추가: ${normalized.placeName || normalized.name}`);
        }
      },
      
      isBookmarked: (googlePlaceId) => {
        const { bookmarkedPlaces } = get();
        return bookmarkedPlaces.some(p => (p.googlePlaceId || p.place_id) === googlePlaceId);
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
