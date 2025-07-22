import React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import PlanImage from "../atoms/PlanImage"
import CardDropdown from "../ui/CardDropDown"
import { Button } from "../ui/button"

const Card1 = ({
  imageUrl,
  onShare,
  onViewParticipant,
  onView,
}) => {
  return ( //카드에 마우스 대면 호버효과 + 커서 포인터 + 클릭시 계획페이지로 이동
    <div 
      className="
        bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 w-full max-w-[280px]
        w-[280px] h-[390px]
        transition-all duration-200
        cursor-pointer
        hover:shadow-lg hover:-translate-y-1 hover:border hover:border-gray-200
      "
      onClick={onView}
    >
      {/* 카드 상단 - 아바타 + 드롭다운 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" />
            <AvatarFallback>경</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <div className="font-bold text-sm">김경진</div>
            <div className="text-xs text-gray-500 mt-0.5">#친구들 #일본</div>
          </div>
        </div>
        <CardDropdown />
      </div>

      {/* 이미지 */}
      <PlanImage src={imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3XSTeOWGITHWBsn8mK9hDHBfBgSFDllNaPw&s"} />

      {/* 본문 */}
      <div className="px-1">
        <div className="font-semibold text-sm mb-0.5">일본 - 도쿄</div>
        <div className="text-gray-400 text-sm mb-1.5">2025.07.21 - 2025.07.25</div>
        <div className="text-gray-600 mt-1 line-clamp-3 text-xs">일본여행이에염 아렁마ㅣ너랴ㅐㄷㅈ벅래ㅑㅓ라;ㄴ엄리ㅏ운리ㅏㅇ 누ㅑㄷ괘ㅑ두루리팦ㅇㅍㅇㄴㅍ</div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-2 pt-2 mt-auto">
        <Button variant="solid" onClick={onViewParticipant}>참여자 보기</Button>
        <Button variant="outline" onClick={onShare}>공유하기</Button>
      </div>
    </div>
  )
}

export default Card1
