import apiClient from './apiClient';

/**
 * 장소 순서 업데이트 API
 * @param {string | number} planId - 계획 ID
 * @param {Object} orderData - 순서 업데이트 데이터
 * @param {Array} orderData.nthPlaceList - 일차별 장소 순서 리스트
 * @returns {Promise<Object>} API 응답 데이터
 */
export const updatePlaceOrder = async (planId, orderData) => {
  try {
    console.log('🔄 장소 순서 업데이트 API 호출:', { planId, orderData });
    
    const response = await apiClient.put(`/plan/${planId}/place-order`, orderData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ 성공적으로 Plan(ID: ${planId})의 장소 순서를 업데이트했습니다.`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ 장소 순서 업데이트(Plan ID: ${planId}) 실패:`, error.response?.data || error.message);
    throw error;
  }
};
