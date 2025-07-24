import apiClient from './apiClient';

/**
 * 여행 계획 목록 조회 API
 * @param {Object} params - 조회 파라미터
 * @param {string} params.status - 계획 상태 ('ING' | 'DONE')
 * @param {string} params.sort - 정렬 기준 ('CREATED_AT' | 'START_DATE')
 * @param {number} params.page - 페이지 번호 (기본값: 0)
 * @param {number} params.size - 페이지 크기 (기본값: 10)
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getPlanList = async (params = {}) => {
  try {
    const response = await apiClient.get('/plan/list', {
      params: {
        status: params.status || 'ING',
        sort: params.sort || 'CREATED_AT',
        page: params.page || 0,
        size: params.size || 10
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('여행 계획 목록 조회 실패:', error);
    throw error;
  }
}; 