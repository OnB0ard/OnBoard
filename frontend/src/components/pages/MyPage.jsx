import React, { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import { Button } from "../atoms/Button";
import Icon from "../atoms/Icon";
import SettingModal from "../organisms/SettingModal";
import { useAuthStore } from "../../store/useAuthStore";

const MyPage = () => {
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const { userName, profileImage } = useAuthStore();

  // 프로필 이미지 URL 생성 (이미지 파일이 있는 경우)
  const displayProfileImage = profileImage || "/default-profile.png";

  const handleSettingClick = () => {
    setIsSettingModalOpen(true);
  };

  const handleCloseSettingModal = () => {
    setIsSettingModalOpen(false);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-[130px]">
        {/* 프로필 섹션 */}
        <div className="flex flex-col items-center justify-center mb-8">
          {/* 프로필 이미지 */}
          <div className="mb-4">
            <Avatar className="w-50 h-50">
              <AvatarImage 
                src={displayProfileImage}
                alt="Profile"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
          
          {/* 사용자 이름과 설정 버튼 */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">
              {userName || "사용자"} 님
            </h1>
            <button
              onClick={handleSettingClick}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Icon type="setting" />
            </button>
          </div>
        </div>

        {/* 탭 섹션 (나중에 다른 내용으로 교체 예정) */}
        <div className="flex justify-center mb-8">
          <div className="flex border-b border-gray-200">
            <button className="px-6 py-3 text-lg font-medium text-black-600 border-b-2 border-black">
              계획중인 여행
            </button>
            <button className="px-6 py-3 text-lg font-medium text-gray-500 hover:text-gray-700">
              완료된 여행
            </button>
          </div>
        </div>


      </div>

      {/* 설정 모달 */}
      <SettingModal 
        isOpen={isSettingModalOpen} 
        onClose={handleCloseSettingModal} 
      />
    </>
  );
};

export default MyPage;