import React, { useState, useRef } from "react";
import "./SettingModal.css";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import Icon from "@/components/atoms/Icon";
import { updateUserProfile } from "../../apis/updateProfile"; 

const SettingModal = ({ isOpen, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState("/default-profile.png");
  const [imageFile, setImageFile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

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

    try {
      setLoading(true);

      await updateUserProfile({
        nickname: nickname.trim(),
        imageFile,
      });

      alert("프로필이 저장되었습니다.");
      onClose();
    } catch (error) {
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
