import React, { useRef } from "react";
import { Avatar, AvatarFallback } from "../ui/Avatar";
import PlanImage from "../atoms/PlanImage";
import CardDropdown from "../atoms/CardDropDown";
import { Button } from "../ui/button";
import ShareModal from "./ShareModal";
import ViewParticipantModal1 from "./ViewParticipantModal1";
import * as Popover from "@radix-ui/react-popover";
import { useCardStore } from "../../store/useCardStore";

const Card = ({
  planData,
  onView,
  onEdit,
  onDelete,
}) => {
  const {
    participantOpenId,
    shareOpenId,
    toggleParticipantPopover,
    toggleSharePopover,
  } = useCardStore();

  const cardRef = useRef(null);

  const {
    id, // 식별을 위해 planData에서 id를 가져옵니다.
    name = "제목 없음",
    description = "설명이 없습니다.",
    startDate = "미정",
    endDate = "",
    hashTag = "",
    imageUrl,
    participants = [],
  } = planData || {};

  // 현재 카드의 팝오버가 열려있는지 확인합니다.
  const isParticipantOpen = participantOpenId === id;
  const isShareOpen = shareOpenId === id;
  const isPopoverOpen = isParticipantOpen || isShareOpen;

  const handleCardClick = () => {
    if (onView && !isPopoverOpen) {
      onView(planData);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-5 z-20">
        <CardDropdown
          cardData={planData}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <div
        ref={cardRef}
        className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 w-full max-w-[280px] h-[390px] cursor-pointer relative transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>{name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center">
              <div className="text-xs text-gray-500">#{hashTag}</div>
            </div>
          </div>
          <div className="w-8 h-8"></div>
        </div>

        <PlanImage src={imageUrl} alt={`${name} 대표 이미지`} />

        <div className="px-1">
          <div className="font-semibold text-sm mb-0.5">{name}</div>
          <div className="text-gray-400 text-sm mb-1.5">{startDate} ~ {endDate}</div>
          <div className="text-gray-600 mt-1 line-clamp-2 text-xs">{description}</div>
        </div>

        <div className="flex justify-end gap-2 pt-2 mt-auto">
          {/* 참여자 보기 팝오버 */}
          <Popover.Root open={isParticipantOpen} onOpenChange={() => toggleParticipantPopover(id)}>
            <Popover.Trigger asChild>
              <Button variant="solid" onClick={e => e.stopPropagation()}>
                참여자 보기
              </Button>
            </Popover.Trigger>
            <Popover.Content side="top" align="center" sideOffset={8} className="z-50">
              <ViewParticipantModal1 isOpen={true} participants={participants} />
            </Popover.Content>
          </Popover.Root>
          
          {/* 공유하기 팝오버 */}
          <Popover.Root open={isShareOpen} onOpenChange={() => toggleSharePopover(id)}>
            <Popover.Trigger asChild>
              <Button variant="outline" onClick={e => e.stopPropagation()}>
                공유하기
              </Button>
            </Popover.Trigger>
            <Popover.Content side="top" align="center" sideOffset={8} className="z-50">
              <ShareModal open={true} onOpenChange={() => toggleSharePopover(id)} />
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>
    </div>
  );
};

export default Card;