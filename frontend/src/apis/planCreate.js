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

  // 1. 텍스트 데이터는 DTO 객체로 준비
  const createPlanRequestDTO = {
    name: planData.name,
    description: planData.description,
    startDate: planData.startDate,
    endDate: planData.endDate,
    hashTag: planData.hashTag,
    creatorId: planData.creatorId // 생성자 ID 추가
  };
  
  // 2. DTO 객체를 Blob으로 변환하여 FormData에 추가
  const planBlob = new Blob([JSON.stringify(createPlanRequestDTO)], {
    type: "application/json",
  });
  formData.append('createPlanRequestDTO', planBlob);

  // 3. 이미지 파일이 있으면 'image'라는 key로 추가
  if (planData.image && planData.image instanceof File) {
    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (planData.image.size > maxSize) {
      throw new Error(`이미지 파일이 너무 큽니다. 최대 ${maxSize / (1024 * 1024)}MB까지 업로드 가능합니다.`);
    }
    
    formData.append('image', planData.image);
    console.log('이미지 파일 추가됨:', planData.image.name, planData.image.size);
  } else {
    console.log('이미지 파일이 없거나 유효하지 않음:', planData.image);
  }

  // FormData 내용 디버깅
  console.log('=== FormData 내용 ===');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`${key}:`, value.name, value.size, value.type);
    } else {
      console.log(`${key}:`, value);
    }
  }

  try {
    // 3. fetch 대신 apiClient.post 사용
    //    - baseURL이 적용되므로 엔드포인트만 적습니다.
    //    - 인증 토큰은 인터셉터가 자동으로 추가해줍니다.
    //    - 에러 처리는 axios가 자동으로 처리해줍니다. (2xx 외 상태 코드에서 에러 throw)
    const response = await apiClient.post('/plan/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // 4. 성공 시 데이터 반환
    return response.data;
    
  } catch (error) {
    // 5. 에러 로깅 및 전파
    console.error('여행 계획 생성 실패:', error);
    throw error;
  }
};