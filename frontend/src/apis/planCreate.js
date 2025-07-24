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

  // 1. 텍스트 데이터는 DTO 객체로 준비
  const createPlanRequestDTO = {
    name: planData.name,
    description: planData.description,
    startDate: planData.startDate,
    endDate: planData.endDate,
    hashTag: planData.hashTag,
  };

  // 2. DTO 객체를 Blob으로 변환하여 FormData에 추가
  const planBlob = new Blob([JSON.stringify(createPlanRequestDTO)], {
    type: "application/json",
  });
  formData.append('createPlanRequestDTO', planBlob); // 서버에서 받는 key 이름이 'plan'이므로 유지

  // 3. 'image' key에는 이미지 파일이 있으면 추가
  if (planData.image) {
    formData.append('image', planData.image);
  }

  try {
    // 4. API 호출 시 Content-Type 헤더를 명시적으로 지정
    const response = await apiClient.post('plan/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log("✅ 여행 계획 생성 성공:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ 여행 계획 생성 실패:", error.response?.data || error.message);
    throw error;
  }
};
