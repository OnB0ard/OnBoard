import React, { useState, useRef, useEffect } from "react";
import "./SettingModal.css";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import Icon from "@/components/atoms/Icon";
import { updateUserProfile } from "../../apis/updateProfile"; 
import { useAuthStore } from "@/store/useAuthStore"; // zustand store import

const SettingModal = ({ isOpen, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState("/default-profile.png");
  const [imageFile, setImageFile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const profileImage = useAuthStore((state) => state.profileImage);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  // 모달이 열릴 때 현재 사용자 정보로 초기화
  useEffect(() => {
    if (isOpen) {
      setNickname(userName || "");
      setPreviewUrl(profileImage || "/default-profile.png");
      setImageFile(null);
      setIsEditing(false);
    }
  }, [isOpen, userName, profileImage]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setImageFile(file);
    }
  };

const handleSave = async () => {
  if (!nickname.trim()) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  const imageModified = imageFile !== null;

  try {
    setLoading(true);

    console.log("📦 전송할 nickname:", nickname);
    console.log("📦 imageModified:", imageModified);
    console.log("📦 imageFile:", imageFile);
    console.log("📦 userId from zustand:", userId);

    const response = await updateUserProfile({
      userId,
      profileData: {
        name: nickname.trim(),
        imageModified,
      },
      imageFile,
    });

    // Zustand store 업데이트
    const newProfileImage = imageFile ? URL.createObjectURL(imageFile) : profileImage;
    updateProfile(nickname.trim(), newProfileImage);

    alert("프로필이 저장되었습니다.");
    onClose();
  } catch (error) {
    console.error("❌ 프로필 저장 실패:", error);
    alert("저장 중 오류가 발생했습니다.");
  } finally {
    setLoading(false);
  }
};




  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close" onClick={onClose}>
          <Icon type="xmark" />
        </button>

        <div className="modal-header">
          {/* <h2>프로필 설정</h2> */}
        </div>

        <div className="modal-avatar-section">
          <Avatar className="modal-avatar">
            <AvatarImage src={previewUrl} alt="Profile" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <button className="modal-photo-button" onClick={handlePhotoClick}>
            <Icon type="photo" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <div className="modal-inputs">
          <div className="input-with-icon">
            <Input
              placeholder="닉네임"
              size="full"
              className="custom-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={!isEditing}
            />
            <span className="input-icon" onClick={()=>setIsEditing(true)}>
              <Icon type="pen" />
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <Button
            className="custom-outline-button"
            textColor="black"
            size="md"
            shape="pill"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            className="custom-purple-button"
            textColor="white"
            size="md"
            shape="pill"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingModal;
