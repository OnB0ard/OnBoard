import apiClient from './apiClient';

/**
 * 여행 계획을 삭제하는 API
 * @param {number | string} planId - 삭제할 계획의 ID
 * @returns {Promise<void>} 성공 시 아무것도 반환하지 않음
 */
export const deletePlan = async (planId) => {
  try {
    // DELETE 요청으로 '/plan/{planId}' 엔드포인트를 호출합니다.
    const response = await apiClient.delete(`plan/${planId}`);
    
    console.log(`성공적으로 Plan(ID: ${planId})을 삭제했습니다.`);
    return response.data;

  } catch (error) {
    // 에러 발생 시 콘솔에 로그를 남기고, 에러를 다시 throw하여
    // 이 함수를 호출한 곳에서 처리할 수 있도록 합니다.
    console.error(`여행 계획(ID: ${planId}) 삭제 실패:`, error.response?.data || error.message);
    throw error;
  }
};
