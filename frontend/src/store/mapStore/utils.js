/**
 * Map store utilities
 */

// Google Maps API의 types를 사용자 친화적인 카테고리로 분류하는 함수
export const categorizePlaceTypes = (types) => {
  if (!types || types.length === 0) {
    return { primaryCategory: '기타', categories: ['기타'] };
  }

  const categories = new Set();
  let primaryCategory = '기타';

  // Google Places API type을 한글 카테고리로 매핑
  const typeMap = {
    // 숙소 (Accommodation)
    lodging: '숙소', hotel: '숙소', motel: '숙소', resort: '숙소', hostel: '숙소',
    // 식당 (Restaurant)
    restaurant: '식당', food: '식당', meal_takeaway: '식당', meal_delivery: '식당', bar: '식당',
    // 카페 (Cafe)
    cafe: '카페', coffee_shop: '카페',
    // 상점 (Store)
    store: '상점', shopping_mall: '상점', book_store: '상점', clothing_store: '상점',
    department_store: '상점', electronics_store: '상점', furniture_store: '상점',
    hardware_store: '상점', home_goods_store: '상점', jewelry_store: '상점',
    pet_store: '상점', shoe_store: '상점', supermarket: '상점', convenience_store: '상점',
    pharmacy: '상점', liquor_store: '상점', florist: '상점',
    // 명소 (Attraction)
    point_of_interest: '명소', tourist_attraction: '명소', amusement_park: '명소',
    aquarium: '명소', art_gallery: '명소', museum: '명소', park: '명소', zoo: '명소',
    stadium: '명소', landmark: '명소', place_of_worship: '명소',
    hindu_temple: '명소', church: '명소', mosque: '명소', synagogue: '명소',
    // 기타/다중 분류 (Other/Multi-category)
    bakery: '기타/상점/카페/식당', // 베이커리는 문맥에 따라 다르게 분류될 수 있음
    // 'establishment'는 너무 광범위하므로 다른 유형이 없을 때만 고려
    establishment: '기타',
  };

  // primaryCategory 결정을 위한 카테고리 우선순위 (높은 순서)
  const categoryOrder = ['카페', '식당', '숙소', '상점', '명소', '기타'];

  for (const type of types) {
    const mappedCategory = typeMap[type];
    if (mappedCategory) {
      // 다중 카테고리 (예: '기타/상점/카페/식당') 처리
      if (mappedCategory.includes('/')) {
        mappedCategory.split('/').forEach(cat => categories.add(cat));
      } else {
        categories.add(mappedCategory);
      }
    } else {
      categories.add('기타'); // 매핑되지 않은 타입은 '기타'로 분류
    }
  }

  // primaryCategory 결정 로직
  for (const orderCat of categoryOrder) {
    if (categories.has(orderCat)) {
      primaryCategory = orderCat;
      break; // 우선순위가 높은 카테고리를 찾으면 중단
    }
  }

  // 특정 타입에 대한 primaryCategory 예외 처리 (e.g., bakery)
  // 다른 더 명확한 카테고리가 없으면 '상점'으로 우선 지정
  if (types.includes('bakery')) {
    if (!categories.has('카페') && !categories.has('식당')) {
      primaryCategory = '상점';
    }
  }

  return {
    primaryCategory,
    categories: Array.from(categories),
  };
};
