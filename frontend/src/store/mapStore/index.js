// Map store index - exports all modular stores
import useMapCoreStore from './useMapCoreStore';
import useSearchStore from './useSearchStore';
import usePlaceDetailsStore from './usePlaceDetailsStore';
import useBookmarkStore from './useBookmarkStore';
import useDayMarkersStore from './useDayMarkersStore';
import usePlaceBlocksStore from './usePlaceBlocksStore';

// Helper utilities
import { categorizePlaceTypes } from './utils';

export {
  useMapCoreStore,
  useSearchStore,
  usePlaceDetailsStore,
  useBookmarkStore,
  useDayMarkersStore,
  usePlaceBlocksStore,
  categorizePlaceTypes
};
