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
  // FormData 생성 로직은 동일
  const formData = new FormData();

  // 1. 텍스트 데이터는 JSON Blob으로 변환하여 추가
  const planJson = {
    name: planData.name,
    description: planData.description,
    startDate: planData.startDate,
    endDate: planData.endDate,
    hashTag: planData.hashTag
  };
  // 백엔드 요구사항에 맞게 'createPlanRequestDTO'로 변경
  formData.append('createPlanRequestDTO', new Blob([JSON.stringify(planJson)], { type: "application/json" }));

  // 2. 이미지 파일이 있으면 'image'라는 key로 추가
  if (planData.image) {
    formData.append('image', planData.image);
  }

  try {
    // 3. fetch 대신 apiClient.post 사용
    //    - baseURL이 적용되므로 엔드포인트만 적습니다.
    //    - 인증 토큰은 인터셉터가 자동으로 추가해줍니다.
    //    - 에러 처리는 axios가 자동으로 처리해줍니다. (2xx 외 상태 코드에서 에러 throw)
    const response = await apiClient.post('/plan/create', formData);
    
    // 4. 성공 시 데이터 반환
    return response.data;
    
  } catch (error) {
    // 5. 에러 로깅 및 전파
    console.error('여행 계획 생성 실패:', error);
    throw error;
  }
};