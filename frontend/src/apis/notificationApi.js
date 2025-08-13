// src/apis/notificationApi.js
import apiClient from "@/apis/apiClient";

/** CommonResponse 안전 언래핑 */
const unwrap = (res) => res?.data?.body ?? res?.data?.data ?? res?.data;

/**
 * GET /api/v1/notification
 * Navbar 최초 마운트/Popover 열릴 때 호출
 * @returns {Promise<Array<{notificationId:number,message:string,userImgUrl:string,isRead:boolean}>>}
 */
export async function fetchNotifications() {
  const res = await apiClient.get("notification");
  return unwrap(res); // [NotificationResponseDTO...]
}

/**
 * PATCH /api/v1/notification/{notificationId}
 * 알림 항목 클릭 시 읽음 처리
 * @param {number} notificationId
 * @returns {Promise<*>} (서버 SuccessResponseDTO or CommonResponse)
 */
export async function patchNotificationRead(notificationId) {
  const res = await apiClient.patch(`notification/${notificationId}`);
  return unwrap(res);
}
