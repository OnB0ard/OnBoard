import apiClient from "./apiClient";

export const getScheduleList = async (planId) => {
  try {
    if (planId == null) throw new Error('planId is required');
    const response = await apiClient.get(`/plan/${planId}/schedule`);
    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('[API][scheduleList][GET] Error:', error);
    throw error;
  }
};
