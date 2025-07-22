import React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import PlanImage from "../atoms/PlanImage"
import CardDropdown from "../ui/CardDropDown"
import { Button } from "../ui/button"

const Card = ({
  nickname, // 사용자 닉네임
  tagline,  // 해시태그    
  avatarUrl,  // 사용자 프로필
  imageUrl,  // 여행 계획 첨부 이미지
  title,  // 여행 제목(또는 국가-지역?)  
  dateRange, // 여행 기간
  description,  // 설명
  onShare,  // 공유하기 버튼
  onViewParticipant,  // 참여자보기 버튼
  onView, // 카드 눌렀을때 계획 페이지로 이동
}) => {
  return (
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
            <AvatarImage src={avatarUrl} alt={nickname} />
            <AvatarFallback>{nickname?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <div className="font-bold text-sm">{nickname}</div>
            <div className="text-xs text-gray-500 mt-0.5">{tagline && `#${tagline}`}</div>
          </div>
        </div>
        <CardDropdown />
      </div>

      {/* 이미지 */}
      <PlanImage src={imageUrl} alt={`${title} 대표 이미지`} />

      {/* 본문 */}
      <div className="px-1">
        <div className="font-semibold text-sm mb-0.5">{title}</div>
        <div className="text-gray-400 text-sm mb-1.5">{dateRange}</div>
        <div className="text-gray-600 mt-1 line-clamp-2 text-xs">{description}</div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-2 pt-2 mt-auto">
        <Button variant="solid" onClick={e => { e.stopPropagation(); onViewParticipant && onViewParticipant(); }}>참여자 보기</Button>
        <Button variant="outline" onClick={e => { e.stopPropagation(); onShare && onShare(); }}>공유하기</Button>
      </div>
    </div>
  )
}

export default Card
