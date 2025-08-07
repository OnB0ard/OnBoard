import apiClient from './apiClient';

/**
 * 특정 여행 계획의 참여자 목록을 조회하는 API
 * (GET /api/v1/plan/{planId}/userList)
 * @param {number|string} planId - 조회할 여행 계획의 ID
 * @returns {Promise<{creator: object, userList: Array<object>}>} API 응답의 body 부분을 반환
 */
export const fetchParticipants = async (planId) => {
  if (!planId) throw new Error('조회할 여행 계획의 ID가 필요합니다.');

  try {
    const response = await apiClient.get(`/plan/${planId}/userList`);
    return response.data.body;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.warn(`[API] Plan ID ${planId}: 참여자 목록을 볼 권한이 없습니다.`);
    } else {
      console.error(`[API] Plan ID ${planId}: 참여자 목록 조회 실패`, error);
    }
    throw error;
  }
};

/**
 * 여행 계획 참여 요청 API
 * (POST /api/v1/plan/{planId}/join)
 * @param {number|string} planId - 참여를 요청할 여행 계획 ID
 * @returns {Promise<object>} API 성공 응답
 */
export const requestToJoinPlan = async (planId) => {
  if (!planId) throw new Error('참여 요청할 여행 계획의 ID가 필요합니다.');

  try {
    const response = await apiClient.post(`/plan/${planId}/join`);
    return response.data;
  } catch (error) {
    console.error(`여행 계획(ID: ${planId}) 참여 요청 실패:`, error);
    throw error;
  }
};

/**
 * 여행 계획 나가기 API
 * (POST /api/v1/plan/{planId}/leave)
 * @param {number|string} planId - 나갈 여행 계획 ID
 * @returns {Promise<object>} API 성공 응답
 */
export const leavePlan = async (planId) => {
  if (!planId) throw new Error('나갈 여행 계획의 ID가 필요합니다.');

  try {
    const response = await apiClient.post(`/plan/${planId}/leave`);
    return response.data;
  } catch (error) {
    console.error(`여행 계획(ID: ${planId}) 나가기 실패:`, error);
    throw error;
  }
};

/**
 * 참여 요청 수락 API
 * (POST /api/v1/plan/{planId}/approve)
 * @param {number|string} planId - 현재 여행 계획 ID
 * @param {number} targetUserId - 승인할 사용자의 ID
 * @returns {Promise<object>} API 성공 응답
 */
export const approveJoinRequest = async (planId, targetUserId) => {
  if (!planId || !targetUserId) throw new Error('계획 ID와 승인할 사용자 ID가 모두 필요합니다.');

  try {
    const response = await apiClient.post(`/plan/${planId}/approve`, { userId: targetUserId });
    return response.data;
  } catch (error) {
    console.error(`사용자(ID: ${targetUserId}) 참여 요청 수락 실패:`, error);
    throw error;
  }
};

/**
 * 참여 요청 거절 API
 * (POST /api/v1/plan/{planId}/deny)
 * @param {number|string} planId - 현재 여행 계획 ID
 * @param {number} targetUserId - 거절할 사용자의 ID
 * @returns {Promise<object>} API 성공 응답
 */
export const denyJoinRequest = async (planId, targetUserId) => {
  if (!planId || !targetUserId) throw new Error('계획 ID와 거절할 사용자 ID가 모두 필요합니다.');

  try {
    const response = await apiClient.post(`/plan/${planId}/deny`,  { userId:targetUserId });
    return response.data;
  } catch (error) {
    console.error(`사용자(ID: ${targetUserId}) 참여 요청 거절 실패:`, error);
    throw error;
  }
};

/**
 * 권한 위임 API (생성자 -> 다른 참여자)
 * (POST /api/v1/plan/{planId}/delegate)
 * @param {number|string} planId - 현재 여행 계획 ID
 * @param {number} targetUserId - 권한을 위임할 사용자의 ID
 * @returns {Promise<object>} API 성공 응답
 */
export const delegatePermissions = async (planId, targetUserId) => {
  if (!planId || !targetUserId) throw new Error('계획 ID와 위임할 사용자 ID가 모두 필요합니다.');

  try {
    const response = await apiClient.post(`/plan/${planId}/delegate`, { userId: targetUserId });
    return response.data;
  } catch (error) {
    console.error(`사용자(ID: ${targetUserId})에게 권한 위임 실패:`, error);
    throw error;
  }
};

/**
 * 내 권한 조회하기
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getMyRole = async (planId, userId) => {
  try {
    // GET 요청에 body를 포함시키기 위해 data 속성을 사용합니다.
    const response = await apiClient.get(`/plan/${planId}/userStatus`, { data: { userId } });
    return response.data;
  } catch (error) {
    console.error('내 권한 조회 실패:', error);
    throw error;
  }
}; 