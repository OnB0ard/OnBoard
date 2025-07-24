import React, { useState, useRef, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import PlanImage from "../atoms/PlanImage"
import CardDropdown from "../ui/CardDropDown"
import { Button } from "../ui/button"
import ShareModal from "./ShareModal"
import ViewParticipantModal from "./ViewParticipantModal"
import PlanPostModal from "./PlanPostModal"
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
  onEdit, // 수정 버튼 눌렀을때 호출
  onDelete, // 삭제 버튼 눌렀을때 호출
}) => {
  const [participantOpen, setParticipantOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const cardRef = useRef(null)

  // 팝오버가 열려있을 때 호버 효과 비활성화
  const isPopoverOpen = participantOpen || shareOpen

  // 팝오버가 열릴 때 호버 상태 즉시 제거
  useEffect(() => {
    if (isPopoverOpen) {
      setIsHovered(false)
    }
  }, [isPopoverOpen])

  // 수정 모달 열기
  const handleEdit = (cardData) => {
    console.log('수정 버튼 클릭됨!', cardData)
    setEditModalOpen(true)
    if (onEdit) {
      onEdit(cardData)
    }
  }

  // 수정 모달 닫기
  const handleEditModalClose = () => {
    console.log('수정 모달 닫기')
    setEditModalOpen(false)
  }

  // 수정 제출 처리
  const handleEditSubmit = (formData) => {
    // 여기서 수정 API 호출
    console.log('수정된 데이터:', formData)
    setEditModalOpen(false)
  }

  const handleCardClick = () => {
    if (onView && !isPopoverOpen) {
      onView();
    }
  }

  return (
    <>
      <div className="relative">
        {/* 드롭다운을 별도 컨테이너로 분리 */}
        <div className="absolute top-4 right-5 z-20">
          <CardDropdown 
            cardData={{
              nickname,
              name,
              description,
              startDate,
              endDate,
              hashTag,
              imageUrl,
              avatarUrl,
              participants
            }}
            onEdit={handleEdit}
            onDelete={onDelete}
          />
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
          {/* 카드 상단 - 아바타 + 닉네임 */}
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
            {/* 드롭다운 자리 (투명한 공간) */}
            <div className="w-8 h-8"></div>
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
                  participants={participants}
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

      {/* 수정 모달 */}
      {editModalOpen && (
        <PlanPostModal
          mode="edit"
          initialData={{
            name,
            hashTag,
            description,
            startDate,
            endDate,
            imageUrl
          }}
          onClose={handleEditModalClose}
          onSubmit={handleEditSubmit}
        />
      )}
    </>
  )
}

export default Card
