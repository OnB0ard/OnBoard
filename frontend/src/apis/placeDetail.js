import apiClient from './apiClient';

export const getPlaceDetail = async (placeId) => {
  try {
    console.log('[API][placeDetail][GET] GET', `/place/${placeId}`);
    const response = await apiClient.get(`/place/${placeId}`);
    return response.data;
  } catch (error) {
    console.error('[API][placeDetail][GET] Error:', error);
    throw error;
  }
};
