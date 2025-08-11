import apiClient from './apiClient';

/**
 * 여행 계획 북마크 추가 API 호출
 * @param {number} planId - 북마크할 여행 계획 ID
 * @param {Object} placeData - 장소 데이터
 * @returns {Promise<Object>} API 응답 데이터
 */
// export const addPlanBookmark = async (planId, placeData) => {
//   try {
//     console.log('[API][bookmark][CREATE] POST', `/plan/${planId}/bookmark`, 'payload:', placeData);
//     const response = await apiClient.post(`/plan/${planId}/bookmark`, {
//       action : "CREATE",

//       googlePlaceId : placeData.googlePlaceId,
//       placeName : placeData.placeName,
//       latitude : placeData.latitude,
//       longitude : placeData.longitude,
//       phoneNumber : placeData.phoneNumber,
//       address : placeData.address,
//       rating : placeData.rating,
//       ratingCount : placeData.ratingCount,
//       placeUrl : placeData.placeUrl,
//       imageUrl : placeData.imageUrl,
//       siteUrl : placeData.siteUrl,
//       category : placeData.category
//     });
//     console.log('[API][bookmark][CREATE] response:', response?.status, response?.data);
//     return response.data;
//   } catch (error) {
//     console.error(`여행 계획(ID: ${planId}) 북마크 추가 실패:`, error);
//     throw error;
//   }
// };

/**
 * 여행 계획 북마크 조회 API 호출
 * @param {number} planId - 북마크를 조회할 여행 계획 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getPlanBookmark = async (planId) => {
  try {
    const response = await apiClient.get(`/plan/${planId}/bookmark`);
    const data = response?.data;
    // 백엔드가 { code, body: { bookmarkList: [...] } } 형태를 반환함
    const body = data?.body ?? data;
    const list = Array.isArray(body)
      ? body
      : (Array.isArray(body?.bookmarkList) ? body.bookmarkList : []);
    console.log('[bookmark][fetch] planId:', planId, 'count:', list.length);
    return list;
  } catch (error) {
    console.error(`여행 계획(ID: ${planId}) 북마크 조회 실패:`, error);
    throw error;
  }
};

// /**
//  * 여행 계획 북마크 삭제 API 호출
//  * @param {number} planId - 북마크를 삭제할 여행 계획 ID
//  * @returns {Promise<Object>} API 응답 데이터
//  */
// export const removePlanBookmark = async (planId, bookmarkId) => {
//   try {
//     const config = { action : "DELETE", bookmarkId : bookmarkId };
//     console.log('[API][bookmark][DELETE] DELETE', `/plan/${planId}/bookmark/${bookmarkId}`, 'config:', config);
//     const response = await apiClient.delete(`/plan/${planId}/bookmark/${bookmarkId}`, config);
//     console.log('[API][bookmark][DELETE] response:', response?.status, response?.data);
//     return response.data;
//   } catch (error) {
//     console.error(`여행 계획(ID: ${planId}) 북마크 삭제 실패:`, error);
//     throw error;
//   }
// };
