import apiClient from "./apiClient";

/**
 * @param {string} oauthToken Google OAuth access_token
 * @returns 사용자 정보 및 JWT 등 백엔드 응답 데이터
 */
export const loginWithGoogle = async (oauthToken) => {
  try {
    const response = await apiClient.post("user/login", {
      oauthToken,
    });
    console.log(response.data)
    return response.data; 
  } catch (error) {
    console.error("구글 로그인 API 실패:", error);
    throw error;
  }
};
