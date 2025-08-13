import apiClient from "@/apis/apiClient";

/**
 * 회원 탈퇴 API
 * @param {number} userId - 탈퇴할 사용자의 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const deleteUserAccount = async () => {
  try {
    console.log("🔍 [deleteUserAccount]");
    
    const response = await apiClient.delete(`user/`);
    
    console.log("✅ 회원 탈퇴 성공:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 회원 탈퇴 실패:", error.response?.data || error.message);
    throw error;
  }
};

