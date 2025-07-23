import axios from "axios";

/**
 * 사용자 프로필을 이미지와 함께 서버에 저장
 * @param {Object} params
 * @param {string} params.nickname
 * @param {File|null} params.imageFile
 */
export const updateUserProfile = async ({ nickname, imageFile }) => {
  try {
    const formData = new FormData();

    // 파일이 선택된 경우에만 첨부
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const profileData = {
      name: nickname,
      imageModified: !!imageFile,
    };

    formData.append("profile", JSON.stringify(profileData));

    const response = await axios.post("/api/user/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("프로필 저장 실패:", error);
    throw error;
  }
};
