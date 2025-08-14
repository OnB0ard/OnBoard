import { create } from 'zustand';
import { getPlanBookmark } from '@/apis/planBookmark';
import useDailyPlanStore from '@/store/useDailyPlanStore';

/**
 * Bookmark Store
 * Manages bookmarked places
 */
const useBookmarkStore = create(
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
          const container = (res && (res.body || res.data || res)) ?? [];
          // 다양한 컨테이너 형태 지원: [] | {items: []} | {bookmarkList: []}
          const normalized = Array.isArray(container)
            ? container
            : (Array.isArray(container.items)
                ? container.items
                : (Array.isArray(container.bookmarkList)
                    ? container.bookmarkList
                    : []));
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

      removeBookmark: async (identifier, planId) => {
        const effectivePlanId = get()._resolvePlanId(planId);
        console.debug('[bookmark] removeBookmark effectivePlanId:', effectivePlanId, 'identifier:', identifier);
        if (!identifier || !effectivePlanId) return;
        try {
          const { bookmarkedPlaces } = get();
          // identifier가 숫자이면 bookmarkId로 간주, 문자열이면 googlePlaceId로 간주
          const isIdNumber = typeof identifier === 'number';
          let target, bookmarkId;
          if (isIdNumber) {
            target = bookmarkedPlaces.find(p => (p.bookmarkId || p.id || p.placeId) === identifier);
            bookmarkId = identifier;
          } else {
            target = bookmarkedPlaces.find(p => (p.googlePlaceId || p.place_id) === identifier);
            bookmarkId = target?.bookmarkId || target?.id || target?.placeId; // 서버 필드 호환
          }

          const { _wsSenders } = get();
          if (_wsSenders.sendDelete && bookmarkId) {
            // WS 전송 + 낙관적 제거
            console.log('[bookmark] removeBookmark via WS. bookmarkId:', bookmarkId);
            set({
              bookmarkedPlaces: bookmarkedPlaces.filter(p =>
                isIdNumber ? ((p.bookmarkId || p.id || p.placeId) !== bookmarkId) : ((p.googlePlaceId || p.place_id) !== identifier)
              ),
            });
            _wsSenders.sendDelete(bookmarkId);
          } else if (bookmarkId) {
            console.warn('[bookmark] removeBookmark skipped: WS sender unavailable');
          } else {
            // 식별자 없으면 로컬 제거만 수행
            console.log('[bookmark] removeBookmark local-only. no bookmarkId found');
            set({
              bookmarkedPlaces: bookmarkedPlaces.filter(p =>
                isIdNumber ? ((p.bookmarkId || p.id || p.placeId) !== identifier) : ((p.googlePlaceId || p.place_id) !== identifier)
              ),
            });
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

        // googlePlaceId가 없더라도 bookmarkId만 있으면 삭제(토글 해제) 동작 가능
        if (!normalized || (!normalized.googlePlaceId && !normalized.bookmarkId)) {
          console.error('Invalid place object for bookmark: missing googlePlaceId and bookmarkId', place);
          return;
        }
        const { isBookmarked, addBookmark, removeBookmark } = get();
        // REST로 받은 항목의 경우 bookmarkId만 있고 googlePlaceId가 없을 수 있어 객체 자체로 판정
        const bookmarked = isBookmarked(normalized);
        console.log('[bookmark] toggle -> currently', bookmarked ? 'bookmarked' : 'not bookmarked');
        if (bookmarked) {
          // bookmarkId가 있으면 그것으로 삭제, 없으면 googlePlaceId로 삭제
          const identifier = normalized.bookmarkId ?? normalized.googlePlaceId;
          await removeBookmark(identifier, effectivePlanId);
          console.log(`🔖 북마크 제거: ${normalized.placeName || normalized.name}`);
        } else {
          await addBookmark(normalized, effectivePlanId);
          console.log(`🔖 북마크 추가: ${normalized.placeName || normalized.name}`);
        }
      },
      
      isBookmarked: (candidate) => {
        const { bookmarkedPlaces } = get();
        if (!candidate) return false;

        // candidate가 객체이면 다양한 키로 비교, 아니면 식별자(googlePlaceId)로 간주
        let candBookmarkId = null;
        let candGoogleId = null;
        let candName = '';
        let candAddr = '';
        let candLat = null;
        let candLng = null;

        if (typeof candidate === 'object') {
          candBookmarkId = candidate.bookmarkId ?? candidate.id ?? candidate.placeId ?? null;
          candGoogleId = candidate.googlePlaceId ?? candidate.place_id ?? null;
          candName = (candidate.placeName || candidate.name || '').trim().toLowerCase();
          candAddr = (candidate.address || candidate.formatted_address || '').trim().toLowerCase();
          // 좌표 추출: 다양한 소스 대응
          try {
            if (typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number') {
              candLat = candidate.latitude; candLng = candidate.longitude;
            } else if (candidate.location && typeof candidate.location.lat === 'number' && typeof candidate.location.lng === 'number') {
              candLat = candidate.location.lat; candLng = candidate.location.lng;
            } else if (candidate.geometry?.location) {
              const gl = candidate.geometry.location;
              // Google Maps 객체일 수 있음: 함수 호출 형태 지원
              const latVal = typeof gl.lat === 'function' ? gl.lat() : gl.lat;
              const lngVal = typeof gl.lng === 'function' ? gl.lng() : gl.lng;
              if (typeof latVal === 'number' && typeof lngVal === 'number') { candLat = latVal; candLng = lngVal; }
            }
          } catch (e) {
            // 좌표 파싱 실패는 무시
          }
        } else {
          candGoogleId = candidate;
        }

        // 좌표 근접성 비교 함수 (약 ~11m 이내)
        const near = (a, b) => {
          if (!a || !b) return false;
          const { lat: latA, lng: lngA } = a;
          const { lat: latB, lng: lngB } = b;
          if (typeof latA !== 'number' || typeof lngA !== 'number' || typeof latB !== 'number' || typeof lngB !== 'number') return false;
          const eps = 1e-4; // ~0.0001 deg
          return Math.abs(latA - latB) < eps && Math.abs(lngA - lngB) < eps;
        };

        return bookmarkedPlaces.some((p) => {
          const pBookmarkId = p.bookmarkId ?? p.id ?? p.placeId ?? null;
          if (candBookmarkId && pBookmarkId && pBookmarkId === candBookmarkId) return true;

          const pGoogleId = p.googlePlaceId ?? p.place_id ?? null;
          if (candGoogleId && pGoogleId && pGoogleId === candGoogleId) return true;

          // 좌표가 양쪽에 존재하면 근접성으로 판정 (googlePlaceId가 없을 때 보조 지표)
          try {
            const pLat = typeof p.latitude === 'number' ? p.latitude : null;
            const pLng = typeof p.longitude === 'number' ? p.longitude : null;
            if (candLat != null && candLng != null && pLat != null && pLng != null) {
              if (near({ lat: candLat, lng: candLng }, { lat: pLat, lng: pLng })) return true;
            }
          } catch (e) {
            // 좌표 근접 비교 중 예외는 무시하되, 디버깅을 위해 로깅
            console.debug('[bookmark] proximity compare failed:', e);
          }

          // googlePlaceId가 없을 때 이름/주소로 비교 (대소문자/공백 차이 무시)
          if (!candGoogleId) {
            const pName = (p.placeName || p.name || '').trim().toLowerCase();
            const pAddr = (p.address || p.formatted_address || '').trim().toLowerCase();
            if (candName && pName && candName === pName) {
              // 이름이 같으면 주소 일치 여부와 관계없이 북마크로 간주
              // (백엔드 응답에 googlePlaceId가 없어도 모달 반영을 보장)
              return true;
            }
          }
          return false;
        });
      },
      
      getBookmarkedPlaces: () => {
        return get().bookmarkedPlaces;
      },
      
      clearAllBookmarks: () => {
        set({ bookmarkedPlaces: [] });
      }
    })
);

export default useBookmarkStore;
