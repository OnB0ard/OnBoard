import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import PlanImage from "../atoms/PlanImage";
import CardDropdown from "../atoms/CardDropDown";
import { Button } from "../ui/button";
import ShareModal from "./ShareModal";
import ViewParticipantModal1 from "./ViewParticipantModal1";
import * as Popover from "@radix-ui/react-popover";
import { useCardStore } from "../../store/useCardStore";
import { useAuthStore } from "../../store/useAuthStore";

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
    closeAllPopovers,
  } = useCardStore();

  const { profileImage: currentUserProfileImage, userName: currentUserName, userId: currentUserId } = useAuthStore();

  const isAnyPopoverOpen = participantOpenId !== null || shareOpenId !== null;
  
  const cardRef = useRef(null);
  const [modalPosition, setModalPosition] = useState(null);

  const {
    planId,
    name = "제목 없음",
    description = "설명이 없습니다.",
    startDate = "미정",
    endDate = "",
    hashTag = "",
    imageUrl,
    profileImage,
    userName,
    participants = [],
    creatorId, // 방장 ID
  } = planData || {};

  const id = planId;
  const isParticipantOpen = participantOpenId === id;
  const isShareOpen = shareOpenId === id;
  const isPopoverOpen = isParticipantOpen || isShareOpen;
  const displayProfileImage = currentUserProfileImage || "/default-profile.png";
  const displayUserName = currentUserName || "사용자";
  
  // 방장 여부 확인 (타입 변환하여 비교)
  // creatorId가 undefined인 경우 임시로 true로 설정 (백엔드에서 creatorId 필드가 전달되지 않는 경우)
  const isCreator = creatorId !== undefined ? String(currentUserId) === String(creatorId) : true;
  

  


  const handleCardClick = () => {
    if (onView && !isPopoverOpen) {
      onView(planData);
    }
  };

  const handleLeavePlan = () => {
    if (window.confirm('방을 나가시겠습니까?')) {
      onDelete && onDelete(planData);
    }
  };

  useEffect(() => {
    return () => {
      closeAllPopovers();
    };
  }, [closeAllPopovers]);

  // 모달 위치 계산
  useEffect(() => {
    if (isPopoverOpen && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.top - 320,
        left: rect.left + rect.width / 2 - 144,
      });
    } else if (!isPopoverOpen) {
      setModalPosition(null);
    }
  }, [isPopoverOpen]);

  // 스크롤 방지 제거 (화면 움직임 방지)
  // useEffect(() => {
  //   if (isAnyPopoverOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = 'unset';
  //   }
  //   return () => {
  //     document.body.style.overflow = 'unset';
  //   };
  // }, [isAnyPopoverOpen]);

  return (
    <div className="relative">
      {/* 카드 우상단 드롭다운 */}
      <div className="absolute top-4 right-5 z-20">
        <CardDropdown
          items={isCreator ? [
            {
              label: '수정',
              onClick: () => onEdit && onEdit(planData),
              className: 'edit-item'
            },
            {
              label: '삭제',
              onClick: () => onDelete && onDelete(planData),
              className: 'delete'
            }
          ] : [
            {
              label: '나가기',
              onClick: handleLeavePlan,
              className: 'leave'
            }
          ]}
        >
          <div className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
          </div>
        </CardDropdown>
      </div>

             {/* 카드 본체 */}
               <div
          ref={cardRef}
          className={`bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 w-full max-w-[280px] h-[390px] cursor-pointer relative transition-all duration-200 ${
            !isAnyPopoverOpen ? 'hover:shadow-lg hover:-translate-y-1' : ''
          }`}
          onClick={handleCardClick}
        >
                 <div className="flex justify-between items-start">
                       <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={displayProfileImage} alt={displayUserName} />
                <AvatarFallback>{displayUserName?.[0] || "?"}</AvatarFallback>
              </Avatar>
             <div className="flex flex-col justify-center">
               <div className="text-xs text-gray">{displayUserName}</div>
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

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-2 mt-auto">
                     {/* 참여자 보기 팝오버 */}
            <Popover.Root open={isParticipantOpen} onOpenChange={() => toggleParticipantPopover(id)}>
              <Popover.Trigger asChild>
                <Button variant="solid" onClick={(e) => e.stopPropagation()}>
                  참여자 보기
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content 
                  side="top" 
                  align="center" 
                  sideOffset={8} 
                  className="z-[9999]"
                  style={{ 
                    position: 'fixed !important',
                    transform: 'none !important',
                    transition: 'none !important',
                    top: modalPosition ? `${modalPosition.top}px !important` : '50vh',
                    left: modalPosition ? `${modalPosition.left}px !important` : '50vw',
                    width: '288px !important',
                    height: 'auto !important',
                    pointerEvents: 'auto !important',
                    inset: 'auto !important',
                    margin: '0 !important',
                    padding: '0 !important',
                    zIndex: '9999 !important'
                  }}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onEscapeKeyDown={(e) => e.preventDefault()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <ViewParticipantModal1 
                    planId={id}
                    isOpen={isParticipantOpen}
                    onClose={() => toggleParticipantPopover(id)}
                    myName={displayUserName}
                    hostName={userName}
                  />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

                     {/* 공유하기 팝오버 */}
                       <Popover.Root open={isShareOpen} onOpenChange={() => toggleSharePopover(id)}>
              <Popover.Trigger asChild>
                <Button variant="outline" onClick={(e) => e.stopPropagation()}>
                  공유하기
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content 
                  side="top" 
                  align="center" 
                  sideOffset={8} 
                  className="z-[99999]"
                  style={{ 
                    position: 'fixed !important',
                    transform: 'none !important',
                    transition: 'none !important',
                    top: modalPosition ? `${modalPosition.top}px !important` : '50vh',
                    left: modalPosition ? `${modalPosition.left}px !important` : '50vw',
                    width: '288px !important',
                    height: 'auto !important',
                    pointerEvents: 'auto !important',
                    inset: 'auto !important',
                    margin: '0 !important',
                    padding: '0 !important',
                    zIndex: '99999 !important'
                  }}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onEscapeKeyDown={(e) => e.preventDefault()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <ShareModal open={isShareOpen} onOpenChange={() => toggleSharePopover(id)} planId={id} />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
                 </div>
       </div>
       
       
     </div>
   );
 };

export default Card;
