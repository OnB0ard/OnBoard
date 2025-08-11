// whiteBoardApi.js
import apiClient from "./apiClient";

/**
 * 특정 planId의 화이트보드 객체 가져오기
 * @param {number|string} planId
 * @returns {Promise<{whiteBoardDiagrams: Array, whiteBoardPlaces: Array}>}
 */
export const getWhiteBoardObjects = async (planId) => {
  try {
    const response = await apiClient.get(`/plan/${planId}/whiteBoardObject`);
    const { whiteBoardDiagrams, whiteBoardPlaces } = response.data.body;
    return { whiteBoardDiagrams, whiteBoardPlaces };
  } catch (error) {
    console.error("화이트보드 데이터 가져오기 실패:", error);
    throw error;
  }
};
