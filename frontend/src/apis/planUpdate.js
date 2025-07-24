import apiClient from './apiClient';

/**
 * 여행 계획 수정 API
 * @param {string} planId - 계획 ID
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

    // 1. 텍스트 데이터는 JSON Blob으로 변환하여 추가
    const planJson = {
      name: planData.name,
      description: planData.description,
      startDate: planData.startDate,
      endDate: planData.endDate,
      hashTag: planData.hashTag,
      imageModified: planData.imageModified || false
    };
    
    // 백엔드 요구사항에 맞게 'updatePlanRequestDTO'로 변경
    formData.append('updatePlanRequestDTO', new Blob([JSON.stringify(planJson)], { type: "application/json" }));

    // 2. 이미지 파일이 있으면 'image'라는 key로 추가
    if (planData.image) {
      formData.append('image', planData.image);
    }

    const response = await apiClient.put(`/plan/${planId}`, formData);
    return response.data;
    
  } catch (error) {
    console.error('여행 계획 수정 실패:', error);
    throw error;
  }
}; 