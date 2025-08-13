import apiClient from "@/apis/apiClient";

export const updateUserProfile = async ({ userId, profileData, imageFile }) => {
  try {
    const formData = new FormData();

    const profileBlob = new Blob([JSON.stringify(profileData)], {
      type: "application/json",
    });
    formData.append("modifyProfileRequestDTO", profileBlob); // key 이름 맞춤

    if (imageFile) {
      formData.append("image", imageFile);
    }


    console.log("🔍 [updateUserProfile] userId:", userId);
    console.log("🔍 [updateUserProfile] profileData:", profileData);
    for (let [key, value] of formData.entries()) {
      console.log(`🧪 FormData - ${key}:`, value);
    }
    const response = await apiClient.put(`user/${userId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(" 프로필 저장 성공:", response.data);
    return response.data;
  } catch (error) {
    console.error(" 프로필 저장 실패:", error.response?.data || error.message);
    throw error;
  }
};
