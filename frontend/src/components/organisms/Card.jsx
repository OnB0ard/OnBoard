import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import PlanImage from "../atoms/PlanImage";
import CardDropDown from "../atoms/CardDropDown";
import { Button } from "../ui/button";
import ShareModal from "./ShareModal";
import ViewParticipantModal from "./ViewParticipantModal";
import * as Popover from "@radix-ui/react-popover";
import { useCardStore } from "../../store/useCardStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useParticipantStore } from "../../store/usePlanUserStore"; // 추가: useParticipantStore import
import { getMyRole, leavePlan } from "../../apis/planUser";
import Icon from "../atoms/Icon";
import "./Card.css";

const Card = ({
  planData,
  onView,
  onEdit,
  onDelete,
  onLeave,
  onShowLeaveModal,
  hideDropdown = false,
}) => {
  const {
    participantOpenId,
    shareOpenId,
    toggleParticipantPopover,
    toggleSharePopover,
    closeAllPopovers,
  } = useCardStore();
  const { fetchParticipants, leaveCurrentPlan } = useParticipantStore(); // 추가: fetchParticipants, leaveCurrentPlan 액션 import

  const { userId: currentUserId } = useAuthStore();
  const [userType, setUserType] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

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
    hostImageUrl, // API에서 받은 호스트 프로필 이미지 URL
    hostName,     // API에서 받은 호스트 이름
    creatorId,    // 방장 ID (직접 필드)
    creator,      // 방장 객체 (creator.userId로 접근)
  } = planData || {};

  const id = planId;
  const isParticipantOpen = participantOpenId === id;
  const isShareOpen = shareOpenId === id;
  const isPopoverOpen = isParticipantOpen || isShareOpen;
  // 호스트의 프로필 이미지와 이름 사용 (없을 경우 기본값 설정)
  const displayProfileImage = hostImageUrl || "/default-profile.png";
  const displayUserName = hostName || "사용자";
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (planId && currentUserId) {
        setIsLoadingRole(true);
        try {
          const response = await getMyRole(planId, currentUserId);
          // API 응답 구조에 따라 userType 사용
          setUserType(response.body.userType);
          setUserStatus(response.body.userStatus);
        } catch (error) {
          console.error(`[Card ${planId}] Failed to fetch user role:`, error);
          setUserType(null); // 에러 발생 시 기본값 설정
          setUserStatus(null);
        } finally {
          setIsLoadingRole(false);
        }
      }
    };

    fetchUserRole();
  }, [planId, currentUserId]);

  const handleCardClick = () => {
    if (onView && !isPopoverOpen) {
      onView(planData);
    }
  };

  const handleLeavePlan = () => {
    if (onShowLeaveModal) {
      onShowLeaveModal(planData);
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
    <div
      ref={cardRef}
      className={`bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 w-full max-w-[280px] h-[390px] cursor-pointer relative transition-all duration-200 font-['Poppins'] ${
        !isAnyPopoverOpen ? 'hover:shadow-lg hover:-translate-y-1' : ''
      }`}
      style={{ overflow: 'visible' }}
      onClick={handleCardClick}
    >
      {/* 카드 우상단 드롭다운 - 레이아웃 영향 없음 */}
      {!hideDropdown && (
        <div className="absolute top-4 right-5 z-20">
          <CardDropDown
            items={
              isLoadingRole
                ? []
                : userType === 'CREATOR'
                ? [
                    { label: '수정', onClick: () => onEdit && onEdit(planData), className: 'edit-item' },
                    { label: '삭제', onClick: () => onDelete && onDelete(planData), className: 'delete' },
                  ]
                : userType === 'USER'
                ? [{ label: '나가기', onClick: handleLeavePlan, className: 'leave' }]
                : []
            }
          >
            <div className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
            </div>
          </CardDropDown>
        </div>
      )}

      {/* 카드 컨텐츠 */}
      <div className="flex items-center gap-2">
        <Avatar className="overflow-hidden rounded-full">
          <AvatarImage 
            src={displayProfileImage} 
            alt={displayUserName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          <AvatarFallback>{displayUserName?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-center">
          <div className="font-semibold text-xs text-gray-700">{displayUserName}</div>
          <div className="text-[11px] text-gray-500">{hashTag}</div>
        </div>
      </div>

      <PlanImage src={imageUrl} alt={`${name} 대표 이미지`} />

      <div className="px-1">
        <div className="font-semibold text-sm mb-0.5">{name}</div>
        <div className="text-gray-400 text-sm mb-1.5">{startDate} ~ {endDate}</div>
        <div className="text-gray-600 mt-1 line-clamp-2 text-xs">{description}</div>
      </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-2 mt-auto">
          {userStatus !== 'APPROVED' ? (
            <div className="text-gray-500 font-semibold py-2 px-4">
              승인 대기 중
            </div>
          ) : (
            <>
              {/* 참여자 보기 팝오버 */}
              <Popover.Root 
                open={isParticipantOpen} 
                onOpenChange={(open) => {
                  if (open) {
                    fetchParticipants(id); // 서버에서 최신 참여자 정보 가져오기
                  }
                  toggleParticipantPopover(id);
                }}
              >
                                 <Popover.Trigger asChild>
                   <button 
                     className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 font-['Poppins'] border border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-100/60"
                     onClick={(e) => e.stopPropagation()}
                   >
                     참여자 보기
                   </button>
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
                    <ViewParticipantModal 
                      planId={id}
                      isOpen={isParticipantOpen}
                      onClose={() => toggleParticipantPopover(id)}
                    />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              {/* 공유하기 팝오버 */}
              <Popover.Root open={isShareOpen} onOpenChange={() => toggleSharePopover(id)}>
                                 <Popover.Trigger asChild>
                   <button 
                     className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 font-['Poppins'] bg-slate-700 text-white shadow-sm hover:bg-slate-600"
                     onClick={(e) => e.stopPropagation()}
                   >
                     공유하기
                   </button>
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
            </>
          )}
        </div>
      
      
             </div>
   );
 };

export default Card;