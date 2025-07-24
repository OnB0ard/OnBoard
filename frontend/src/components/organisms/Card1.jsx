// 카드 내용들 임의로 넣은 파일(추후에 삭제)

import React, { useState, useRef, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import PlanImage from "../atoms/PlanImage"
import CardDropdown from "../ui/CardDropDown"
import { Button } from "../ui/button"
import ShareModal from "./ShareModal"
import ViewParticipantModal from "./ViewParticipantModal"
import * as Popover from "@radix-ui/react-popover"

const Card1 = (props) => {
  const { imageUrl, onView, onEdit, onDelete } = props;
  const [participantOpen, setParticipantOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)

  // 팝오버가 열려있을 때 호버 효과 비활성화
  const isPopoverOpen = participantOpen || shareOpen

  // 팝오버가 열릴 때 호버 상태 즉시 제거
  useEffect(() => {
    if (isPopoverOpen) {
      setIsHovered(false)
    }
  }, [isPopoverOpen])

  const handleCardClick = () => {
    if (onView && !isPopoverOpen) {
      onView();
    }
  }

  return (
    <div className="relative">
      {/* 드롭다운을 별도 컨테이너로 분리 */}
      <div className="absolute top-4 right-5 z-20">
        <CardDropdown cardData={props} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* 카드 본체 */}
      <div 
        ref={cardRef}
        className={`
          bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 w-full max-w-[280px]
          h-[390px]
          cursor-pointer
          relative
          ${isPopoverOpen 
            ? 'pointer-events-none' 
            : 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border hover:border-gray-200'
          }
        `}
        onClick={handleCardClick}
        onMouseEnter={() => !isPopoverOpen && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 카드 상단 - 아바타 */}
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
          {/* 드롭다운 자리 (투명한 공간) */}
          <div className="w-8 h-8"></div>
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
        <div className={`flex justify-end gap-2 pt-2 mt-auto ${isPopoverOpen ? 'pointer-events-auto' : ''}`}>
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
              avoidCollisions={true}
              collisionBoundary={cardRef.current}
              collisionPadding={8}
              className="z-50"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <ViewParticipantModal 
                isOpen={true}
                myName="김경진" 
                hostName="김경진" 
              />
            </Popover.Content>
          </Popover.Root>
          
          {/* 공유하기 팝오버 */}
          <Popover.Root open={shareOpen} onOpenChange={setShareOpen}>
            <Popover.Trigger asChild>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={e => e.stopPropagation()}
              >
                공유하기
              </Button>
            </Popover.Trigger>
            <Popover.Content
              side="top"
              align="center"
              sideOffset={8}
              avoidCollisions={true}
              collisionBoundary={cardRef.current}
              collisionPadding={8}
              className="z-50"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <ShareModal
                open={true}
                onOpenChange={setShareOpen}
              />
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>
    </div>
  )
}

export default Card1
