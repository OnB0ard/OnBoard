import apiClient from './apiClient';

/**
 * 일정 저장 API
 * @param {string | number} planId - 계획 ID
 * @param {Array} dailyPlans - 일차별 일정 데이터
 * @returns {Promise<Object>} API 응답 데이터
 */
export const savePlanSchedule = async (planId, dailyPlans) => {
  try {
    console.log('📅 일정 저장 API 호출:', { planId, dailyPlans });
    
    // 백엔드 요구사항에 맞게 데이터 변환
    const scheduleData = {
      schedules: dailyPlans.map((day, dayIndex) => ({
        day: dayIndex + 1,
        title: day.title,
        places: day.places.map((place, placeIndex) => ({
          order: placeIndex + 1,
          googlePlaceId: place.googlePlaceId || place.originalData?.googlePlaceId || place.id,
          placeName: place.name,
          latitude: place.latitude || place.lat,
          longitude: place.longitude || place.lng,
          address: place.address,
          rating: place.rating,
          ratingCount: place.ratingCount,
          imageUrl: place.imageUrl,
          phoneNumber: place.phoneNumber,
          placeUrl: place.placeUrl,
          siteUrl: place.siteUrl,
          category: place.primaryCategory || place.category,
          memo: place.memo || ''
        }))
      }))
    };
    
    const response = await apiClient.post(`/plan/${planId}/schedule`, scheduleData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = response?.data?.body ?? response?.data;
    console.log(`✅ 성공적으로 Plan(ID: ${planId})의 일정을 저장했습니다.`);
    return data;
    
  } catch (error) {
    console.error(`❌ 일정 저장(Plan ID: ${planId}) 실패:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * 일정 조회 API
 * @param {string | number} planId - 계획 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getPlanSchedule = async (planId) => {
  try {
    console.log('📅 일정 조회 API 호출:', { planId });
    
    const response = await apiClient.get(`/plan/${planId}/schedule`);
    const data = response?.data?.body ?? response?.data;
    console.log(`✅ 성공적으로 Plan(ID: ${planId})의 일정을 조회했습니다.`);
    return data;
    
  } catch (error) {
    console.error(`❌ 일정 조회(Plan ID: ${planId}) 실패:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * 일정 삭제 API
 * @param {string | number} planId - 계획 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const deletePlanSchedule = async (planId) => {
  try {
    console.log('📅 일정 삭제 API 호출:', { planId });
    
    const response = await apiClient.delete(`/plan/${planId}/schedule`);
    
    console.log(`✅ 성공적으로 Plan(ID: ${planId})의 일정을 삭제했습니다.`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ 일정 삭제(Plan ID: ${planId}) 실패:`, error.response?.data || error.message);
    throw error;
  }
};
