import apiClient from "./apiClient";

/**
 * @param {string} oauthToken Google OAuth access_token
 * @returns 사용자 정보 및 JWT 등 백엔드 응답 데이터
 */
export const loginWithGoogle = async (oauthToken) => {
  try {
    console.log("전송할 OAuth 토큰:", oauthToken);
    
    const response = await apiClient.post("user/login", {
      oauthToken,
    });
    
    console.log("서버 응답:", response.data);
    return response.data; 
  } catch (error) {
    console.error("구글 로그인 API 실패:", error);
    console.error("에러 상세 정보:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
};


