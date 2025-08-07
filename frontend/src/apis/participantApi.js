import apiClient from './apiClient';

/**
 * 참여자 목록 조회 API
 * @param {number} planId - 계획 ID
 * @returns {Promise<Object>} 참여자 목록 데이터
 */
export const getParticipants = async (planId) => {
  try {
    const response = await apiClient.get(`/plan/${planId}/participants`);
    return response.data;
  } catch (error) {
    console.error('참여자 목록 조회 실패:', error);
    // 임시로 더미 데이터 반환 (API 준비 전까지)
    return {
      body: [
        {
          userId: 1,
          userName: "테스트 사용자",
          googleEmail: "test@example.com",
          profileImage: "",
          status: "accepted"
        }
      ]
    };
  }
};

/**
 * 초대 요청 수락 API
 * @param {number} planId - 계획 ID
 * @param {number} participantId - 참여자 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const acceptInvitation = async (planId, participantId) => {
  try {
    const response = await apiClient.post(`/plan/${planId}/participants/${participantId}/accept`);
    return response.data;
  } catch (error) {
    console.error('초대 수락 실패:', error);
    throw error;
  }
};

/**
 * 초대 요청 거절 API
 * @param {number} planId - 계획 ID
 * @param {number} participantId - 참여자 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const rejectInvitation = async (planId, participantId) => {
  try {
    const response = await apiClient.post(`/plan/${planId}/participants/${participantId}/reject`);
    return response.data;
  } catch (error) {
    console.error('초대 거절 실패:', error);
    throw error;
  }
};

/**
 * 참여자 내보내기 API
 * @param {number} planId - 계획 ID
 * @param {number} participantId - 참여자 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const removeParticipant = async (planId, participantId) => {
  try {
    const response = await apiClient.delete(`/plan/${planId}/participants/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('참여자 내보내기 실패:', error);
    throw error;
  }
};

/**
 * 계획 초대하기 API (초대 링크 생성)
 * @param {number} planId - 계획 ID
 * @returns {Promise<Object>} 초대 링크 데이터
 */
export const createInvitationLink = async (planId) => {
  try {
    const response = await apiClient.post(`/plan/${planId}/invitation`);
    return response.data;
  } catch (error) {
    console.error('초대 링크 생성 실패:', error);
    // 임시로 더미 데이터 반환 (API 준비 전까지)
    return {
      invitationCode: `invite_${planId}_${Date.now()}`,
      planId: planId
    };
  }
};

/**
 * 초대 링크로 참여하기 API
 * @param {string} invitationCode - 초대 코드
 * @returns {Promise<Object>} API 응답 데이터
 */
export const joinByInvitation = async (invitationCode) => {
  try {
    const response = await apiClient.post(`/plan/join/${invitationCode}`);
    return response.data;
  } catch (error) {
    console.error('초대 링크로 참여 실패:', error);
    throw error;
  }
};

/**
 * 계획 나가기 API
 * @param {number} planId - 계획 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const leavePlan = async (planId) => {
  try {
    const response = await apiClient.post(`/plan/${planId}/leave`);
    return response.data;
  } catch (error) {
    console.error('계획 나가기 실패:', error);
    throw error;
  }
}; 

/**
 * 내 권한 조회하기
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getMyRole = async (planId) => {
  try {
    const response = await apiClient.get(`/plan/${planId}/userStatus`);
    return response.data;
  } catch (error) {
    console.error('내 권한 조회 실패:', error);
    throw error;
  }
}; 
