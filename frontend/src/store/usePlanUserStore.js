import { create } from 'zustand';
import {
  fetchParticipants,
  requestToJoinPlan,
  leavePlan,
  approveJoinRequest,
  denyJoinRequest,
  delegatePermissions,
  getMyRole,
} from '@/apis/planUser'; // API 모듈에서 모든 함수를 가져옵니다.

/**
 * 여행 계획의 참여자 및 권한 관련 모든 상태와 액션을 관리하는 Zustand 스토어
 */
export const useParticipantStore = create((set, get) => ({
  // =============================================
  // 1. 상태 (State)
  // =============================================
  creator: null,      // 여행 계획 생성자 정보
  participants: [],   // 참여자 목록 (승인/대기 포함)
  myRole: null,       // 현재 사용자의 역할 (e.g., 'CREATOR', 'PARTICIPANT', 'AWAITING')
  isLoading: true,    // 초기 로딩 및 refetch 로딩 상태
  error: null,        // API 호출 에러 정보

  // =============================================
  // 2. 액션 (Actions)
  // =============================================

  /**
   * (조회) 특정 여행의 참여자 목록을 서버로부터 불러옵니다.
   * @param {number|string} planId - 조회할 여행 계획 ID
   */
  fetchParticipants: async (planId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchParticipants(planId);
      console.log('🔍 fetchParticipants API 응답:', data); // 디버깅용 로그
      const creator = data?.creator || null;
      const userList = Array.isArray(data?.userlist) ? data.userlist : [];
      console.log('📋 처리된 참여자 목록:', { creator, participants: userList }); // 디버깅용 로그
      set({ creator, participants: userList, isLoading: false });
    } catch (error) {
      console.error('참여자 목록 조회 실패:', error);
      set({ participants: [], creator: null, error, isLoading: false });
      throw error;
    }
  },

  /**
   * (요청) 현재 사용자가 여행 계획에 참여를 요청합니다.
   * @param {number|string} planId - 참여를 요청할 여행 계획 ID
   */
  joinPlan: async (planId) => {
    console.log('🏪 joinPlan 스토어 액션 시작:', planId);
    try {
      console.log('📡 requestToJoinPlan API 호출 중...');
      const joinResult = await requestToJoinPlan(planId);
      console.log('✅ requestToJoinPlan API 성공:', joinResult);
      
      // 참여 요청이 성공했으므로 fetchParticipants 실패해도 무시
      console.log('🔄 fetchParticipants 호출하여 최신 참여자 목록 가져오는 중...');
      try {
        await get().fetchParticipants(planId);
        console.log('✅ fetchParticipants 성공!');
      } catch (fetchError) {
        console.warn('⚠️ fetchParticipants 실패하지만 참여 요청은 성공했으므로 무시:', fetchError.response?.status);
        // fetchParticipants 실패는 무시하고 계속 진행
      }
      console.log('✅ joinPlan 전체 과정 완료!');
    } catch (error) {
      // requestToJoinPlan 자체가 실패한 경우만 에러 처리
      console.error("❌ joinPlan 스토어 액션 실패:", error);
      console.error("❌ 에러 상세:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      set({ error });
      throw error; // 에러를 다시 던져서 PlanPage에서 catch할 수 있도록 함
    }
  },

  /**
   * (요청) 현재 사용자가 여행 계획에서 나갑니다.
   * @param {number|string} planId - 나갈 여행 계획 ID
   */
  leaveCurrentPlan: async (planId) => {
    try {
      await leavePlan(planId);
      // 성공 시, 스토어의 상태를 깨끗하게 초기화합니다.
      set({ creator: null, participants: [], myRole: null, isLoading: false, error: null });
    } catch (error) {
      console.error("계획 나가기 실패:", error);
      set({ error });
      throw error;
    }
  },

  /**
   * (조회) 현재 사용자의 역할을 조회합니다.
   * @param {number|string} planId - 조회할 여행 계획 ID
   */
  fetchMyRole: async (planId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMyRole(planId, userId);
      const myRole = response || null;
      console.log('👤 내 역할 조회 성공:', myRole);
      set({ myRole, isLoading: false });
      return myRole;
    } catch (error) {
      console.error('내 역할 조회 실패:', error);
      set({ myRole: null, error, isLoading: false });
      throw error;
    }
  },

  /**
   * (관리) 생성자가 참여 요청을 수락합니다.
   * @param {number|string} planId - 현재 여행 계획 ID
   * @param {number} targetUserId - 승인할 사용자의 ID
   */
  approveRequest: async (planId, targetUserId) => {
    try {
      // API를 먼저 호출합니다.
      await approveJoinRequest(planId, targetUserId);
      // 성공하면 서버에서 최신 데이터를 다시 가져와서 정확한 상태로 업데이트합니다.
      await get().fetchParticipants(planId);
    } catch (error) {
      console.error("참여 요청 수락 실패:", error);
      set({ error });
    }
  },
  
  /**
   * (관리) 생성자가 참여 요청을 거절합니다.
   * @param {number|string} planId - 현재 여행 계획 ID
   * @param {number} targetUserId - 거절할 사용자의 ID
   */
  denyRequest: async (planId, targetUserId) => {
    try {
      await denyJoinRequest(planId, targetUserId);
      // 성공하면 서버에서 최신 데이터를 다시 가져와서 정확한 상태로 업데이트합니다.
      await get().fetchParticipants(planId);
    } catch (error) {
      console.error("참여 요청 거절 실패:", error);
      set({ error });
    }
  },

  /**
   * (관리) 생성자가 다른 참여자에게 권한을 위임합니다.
   * @param {number|string} planId - 현재 여행 계획 ID
   * @param {number} targetUserId - 권한을 위임할 사용자의 ID
   */
  delegateCreatorRole: async (planId, targetUserId) => {
    try {
      await delegatePermissions(planId, targetUserId);
      // 권한 위임은 중요한 변경이므로, 서버로부터 최신 데이터를 다시 불러와
      // 상태를 정확하게 동기화합니다.
      await get().fetchParticipants(planId);
    } catch (error) {
      console.error("권한 위임 실패:", error);
      set({ error });
    }
  },

  /**
   * 스토어의 모든 참여자 관련 상태를 초기화합니다.
   * (컴포넌트 unmount 시 또는 다른 계획 페이지로 이동 시 사용)
   */
  clearParticipants: () => {
    set({ creator: null, participants: [], myRole: null, isLoading: true, error: null });
  },
}));
