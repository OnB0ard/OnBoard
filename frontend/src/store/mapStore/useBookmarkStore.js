import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Bookmark Store
 * Manages bookmarked places
 */
const useBookmarkStore = create(
  persist(
    (set, get) => ({
      // --- Bookmark State ---
      bookmarkedPlaces: [],
      
      // --- Bookmark Actions ---
      toggleBookmark: (place) => {
        if (!place || !place.googlePlaceId) {
          console.error('Invalid place object for bookmark:', place);
          return;
        }
        
        const { bookmarkedPlaces } = get();
        const isCurrentlyBookmarked = bookmarkedPlaces.some(
          p => p.googlePlaceId === place.googlePlaceId
        );
        
        if (isCurrentlyBookmarked) {
          // 북마크 제거
          set({
            bookmarkedPlaces: bookmarkedPlaces.filter(
              p => p.googlePlaceId !== place.googlePlaceId
            )
          });
          console.log(`🔖 북마크 제거: ${place.placeName}`);
        } else {
          // 북마크 추가
          const newBookmark = {
            ...place,
            bookmarkedAt: new Date().toISOString()
          };
          
          set({
            bookmarkedPlaces: [...bookmarkedPlaces, newBookmark]
          });
          console.log(`🔖 북마크 추가: ${place.placeName}`);
        }
      },
      
      isBookmarked: (googlePlaceId) => {
        const { bookmarkedPlaces } = get();
        return bookmarkedPlaces.some(p => p.googlePlaceId === googlePlaceId);
      },
      
      getBookmarkedPlaces: () => {
        return get().bookmarkedPlaces;
      },
      
      clearAllBookmarks: () => {
        set({ bookmarkedPlaces: [] });
      }
    }),
    {
      name: 'map-bookmarks', // localStorage에 저장될 키 이름
      partialize: (state) => ({ bookmarkedPlaces: state.bookmarkedPlaces }),
    }
  )
);

export default useBookmarkStore;
