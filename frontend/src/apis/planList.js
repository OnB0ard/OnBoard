import apiClient from './apiClient';

/**
 * 여행 계획 목록을 조회하는 API
 * @returns {Promise<Array>} 여행 계획 목록 배열
 */
export const getPlanList = async () => {  
  try {
    // GET 요청으로 '/plan/list' 엔드포인트를 호출합니다.
    const response = await apiClient.get('plan/list');

    // 서버 응답의 body에 실제 데이터가 담겨 있으므로 response.data.body를 반환합니다.
    return response.data.body;
  } catch (error) {
    // 에러 발생 시 콘솔에 로그를 남기고, 에러를 다시 throw하여
    // 이 함수를 호출한 곳에서 처리할 수 있도록 합니다.
    console.error("여행 목록 조회 실패:", error.response?.data || error.message);
    throw error;
  }
};