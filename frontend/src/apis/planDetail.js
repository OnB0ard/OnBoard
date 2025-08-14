import apiClient from './apiClient';

/**
 * 여행 계획 상세 조회 API
 * @param {string} planId - 계획 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getPlanDetail = async (planId) => {
  try {
    const response = await apiClient.get(`/plan/${planId}`);
    return response.data;
  } catch (error) {
    console.error('여행 계획 상세 조회 실패:', error);
    throw error;
  }
}; 