import apiClient from './apiClient'; // 중앙 apiClient 임포트

/**
 * 여행 계획 생성 API 호출
 * @param {Object} planData - 계획 데이터
 * @param {string} planData.name - 계획 이름
 * @param {string} planData.description - 계획 요약
 * @param {string} planData.startDate - 시작일 (YYYY-MM-DD)
 * @param {string} planData.endDate - 종료일 (YYYY-MM-DD)
 * @param {string} planData.hashTag - 해시태그
 * @param {File|null} planData.image - 이미지 파일
 * @returns {Promise<Object>} API 응답 데이터
 */
export const createPlan = async (planData) => {
  const formData = new FormData();

  // 1. 텍스트 데이터는 JSON 객체로 준비
  const planJson = {
    name: planData.name,
    description: planData.description,
    startDate: planData.startDate,
    endDate: planData.endDate,
    hashTag: planData.hashTag,
  };

  // 2. 'plan' key에는 JSON 문자열을 바로 추가 (Blob 사용 X)
  formData.append('plan', JSON.stringify(planJson));

  // 3. 'image' key에는 이미지 파일이 있으면 추가
  if (planData.image) {
    formData.append('image', planData.image);
  }

  try {
    const response = await apiClient.post('/plan/create', formData);
    return response.data;

  } catch (error) {
    // 에러 로깅은 상세하게 유지하여 디버깅에 용이하도록 함
    console.error('여행 계획 생성 실패:', error);
    console.error('Error details:');
    console.error('- Status:', error.response?.status);
    console.error('- Response Data:', error.response?.data);
    throw error;
  }
};