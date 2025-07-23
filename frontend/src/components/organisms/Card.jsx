import React, { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import PlanImage from "../atoms/PlanImage"
import CardDropdown from "../ui/CardDropDown"
import { Button } from "../ui/button"
import ShareModal from "./ShareModal"
import ViewParticipantModal from "./ViewParticipantModal"
import * as Popover from "@radix-ui/react-popover"

const Card = ({
  nickname, // 사용자 닉네임
  name, // 여행 제목(카드 제목)
  description, // 계획 요약
  startDate, // 시작일
  endDate, // 종료일
  hashTag, // 해시태그
  imageUrl, // 여행 계획 첨부 이미지
  avatarUrl, // 사용자 프로필
  participants = [], // 참여자 정보 배열
  onView, // 카드 눌렀을때 계획 페이지로 이동
}) => {
  const [participantOpen, setParticipantOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

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
      {/* 카드 상단 - 아바타 + 닉네임 + 드롭다운 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={nickname} />
            <AvatarFallback>{nickname?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <div className="font-bold text-sm">{nickname}</div>
            <div className="text-xs text-gray-500 mt-0.5">#{hashTag}</div>
          </div>
        </div>
        <CardDropdown />
      </div>

      {/* 이미지 */}
      <PlanImage src={imageUrl} alt={`${name} 대표 이미지`} />

      {/* 본문 */}
      <div className="px-1">
        <div className="font-semibold text-sm mb-0.5">{name}</div>
        <div className="text-gray-400 text-sm mb-1.5">{startDate} - {endDate}</div>
        <div className="text-gray-600 mt-1 line-clamp-2 text-xs">{description}</div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-2 pt-2 mt-auto ">
        {/* 참여자 보기 팝오버 */}
        <Popover.Root open={participantOpen} onOpenChange={setParticipantOpen}>
          <Popover.Trigger asChild>
            <Button
              className="cursor-pointer"
              variant="solid"
              onClick={e => e.stopPropagation()}
            >
              참여자 보기
            </Button>
          </Popover.Trigger>
          <Popover.Content
            side="top"
            align="center"
            sideOffset={8}
            className="z-50"
          >
            <ViewParticipantModal participants={participants} />
          </Popover.Content>
        </Popover.Root>
        {/* 공유하기 팝오버 */}
        <ShareModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          trigger={
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={e => e.stopPropagation()}
            >
              공유하기
            </Button>
          }
        />
      </div>
    </div>
  )
}

export default Card
