import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import PlanImage from "../atoms/PlanImage";
import CardDropdown from "../ui/CardDropDown";
import { Button } from "../ui/button";
import ShareModal from "./ShareModal";
import ViewParticipantModal from "./ViewParticipantModal";
import * as Popover from "@radix-ui/react-popover";

const Card = ({
  planData,
  onView,
  onEdit,
  onDelete,
}) => {
  const [participantOpen, setParticipantOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const cardRef = useRef(null);

  const {
    name = "제목 없음",
    description = "설명이 없습니다.",
    startDate = "미정",
    endDate = "",
    hashTag = "",
    imageUrl,
    participants = [],
  } = planData || {};

  const isPopoverOpen = participantOpen || shareOpen;

  const handleCardClick = () => {
    if (onView && !isPopoverOpen) {
      onView(planData);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-5 z-20">
        <CardDropdown
          onEdit={() => onEdit(planData)}
          onDelete={() => onDelete(planData)}
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
          <Popover.Root open={participantOpen} onOpenChange={setParticipantOpen}>
            <Popover.Trigger asChild>
              <Button variant="solid" onClick={e => e.stopPropagation()}>
                참여자 보기
              </Button>
            </Popover.Trigger>
            <Popover.Content
              side="top"
              align="center"
              sideOffset={8}
              className="z-50"
              /* 아래 충돌 감지 관련 props들을 제거하여 위치를 고정합니다. */
              // avoidCollisions={true}
              // collisionBoundary={cardRef.current}
              // collisionPadding={8}
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
              <Button variant="outline" onClick={e => e.stopPropagation()}>
                공유하기
              </Button>
            </Popover.Trigger>
            <Popover.Content
              side="top"
              align="center"
              sideOffset={8}
              className="z-50"
              /* 아래 충돌 감지 관련 props들을 제거하여 위치를 고정합니다. */
              // avoidCollisions={true}
              // collisionBoundary={cardRef.current}
              // collisionPadding={8}
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
  );
};

export default Card;
