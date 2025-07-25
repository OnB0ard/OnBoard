import apiClient from '../apis/apiClient';

/**
 * 여행 계획 수정 API
 * @param {string | number} planId - 계획 ID
 * @param {Object} planData - 수정할 계획 데이터
 * @param {string} planData.name - 계획 이름
 * @param {string} planData.description - 계획 요약
 * @param {string} planData.startDate - 시작일 (YYYY-MM-DD)
 * @param {string} planData.endDate - 종료일 (YYYY-MM-DD)
 * @param {string} planData.hashTag - 해시태그
 * @param {File|null} planData.image - 이미지 파일
 * @param {boolean} planData.imageModified - 이미지 수정 여부
 * @returns {Promise<Object>} API 응답 데이터
 */
export const updatePlan = async (planId, planData) => {
  try {
    const formData = new FormData();

    // 1. 텍스트 데이터는 DTO 객체로 준비
    const updatePlanRequestDTO = {
      name: planData.name,
      description: planData.description,
      startDate: planData.startDate,
      endDate: planData.endDate,
      hashTag: planData.hashTag,
      imageModified: planData.imageModified || false
    };
    
    // 2. DTO 객체를 Blob으로 변환하여 FormData에 추가 (createPlan과 동일한 패턴)
    const planBlob = new Blob([JSON.stringify(updatePlanRequestDTO)], {
      type: "application/json",
    });
    formData.append('updatePlanRequestDTO', planBlob);

    // 3. 이미지 파일이 있으면 'image'라는 key로 추가
    if (planData.image) {
      formData.append('image', planData.image);
    }

    // 4. API 호출 시 Content-Type 헤더를 명시적으로 지정 (createPlan과 동일한 패턴)
    const response = await apiClient.put(`/plan/${planId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log(`✅ 성공적으로 Plan(ID: ${planId})을 수정했습니다.`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ 여행 계획(ID: ${planId}) 수정 실패:`, error.response?.data || error.message);
    throw error;
  }
};
