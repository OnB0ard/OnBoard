// 이 파일은 백엔드 측에서 참여자 목록 데이터 받아와서 적용시킬 수 있는 파일

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import { Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { useParticipantStore } from "../../store/usePlanUserStore"; // Zustand 스토어 import
import { useAuthStore } from "../../store/useAuthStore";
import Icon from "../atoms/Icon";
import "./ViewParticipantModal.css";

// planId: 계획 ID
// myName: 현재 로그인한 사용자 이름
// hostName: 방장 닉네임(카드 기준)
// onRequestConfirm: 상위에서 확인 모달을 띄우기 위한 콜백
const ViewParticipantModal = ({ planId, isOpen, onClose, onRequestConfirm }) => {
  const modalRef = useRef(null);
  const {
    creator,
    participants,
    isLoading,
    error,
    approveRequest,
    denyRequest,
    clearParticipants,
    delegateCreatorRole,
    kickUser
  } = useParticipantStore();

  const { userId: currentUserId } = useAuthStore();
  const isCreator = creator?.userId === currentUserId;

  // 모달이 닫힐 때 스토어 상태를 정리합니다.
  useEffect(() => {
    return () => {
      if (!isOpen) {
        clearParticipants();
      }
    };
  }, [isOpen, clearParticipants]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const openConfirm = (title, message, onConfirm, confirmText = "확인", variant, iconType) => {
    // 먼저 참여자 목록 모달을 닫고, 상위에 확인 모달 요청
    onClose?.();
    onRequestConfirm?.({ title, message, onConfirm, confirmText, variant, iconType });
  };

  const handleApprove = (targetUserId, name) => {
    openConfirm(
      "참여 수락",
      `${name}님의 참여를 수락하시겠습니까?`,
      () => approveRequest(planId, targetUserId),
      "수락",
      undefined,
      'people-plus'
    );
  };

  const handleDeny = (targetUserId, name) => {
    openConfirm(
      "참여 거절",
      `${name}님의 참여 요청을 거절하시겠습니까?`,
      () => denyRequest(planId, targetUserId),
      "거절",
      'danger',
      'people-minus'
    );
  };

  const handlePromote = (targetUserId, name) => {
    console.log('Promoting:', { planId, targetUserId }); // 디버깅용 로그
    openConfirm(
      "방장 위임",
      `${name}님을 방장으로 위임하시겠습니까?`,
      () => delegateCreatorRole(planId, targetUserId),
      "위임",
      undefined,
      'change'
    );
  };
  
  const handleKick = (targetUserId, name) => {
    console.log('Kicking:', { planId, targetUserId }); // 디버깅용 로그
    openConfirm(
      "강퇴",
      `${name}님을 강퇴하시겠습니까?`,
      () => kickUser(planId, targetUserId),
      "강퇴",
      'danger',
      'people-minus'
    );
  };


  const combinedParticipants = [
    ...(creator ? [{ ...creator, status: 'CREATOR' }] : []),
    ...participants,
  ];

  if (!isOpen) return null

  return (
    <div ref={modalRef} className="w-72 max-h-80 bg-white rounded-xl shadow-lg p-4 flex flex-col border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="font-bold text-lg">참여자 목록</h3>
          <span className="ml-2 text-sm text-gray-500">
            {isLoading ? "로딩 중..." : `${combinedParticipants.length}명`}
          </span>
        </div>
        <Button 
          onClick={onClose} 
          className="text-lg leading-none bg-gray-100 hover:bg-gray-200 text-gray-600 w-6 h-6 p-0 flex items-center justify-center rounded-full text-sm"
        >
          ×
        </Button>
      </div>
      <ul className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-48">
        {isLoading && <li className="text-center text-gray-500">로딩 중...</li>}
        {error && <li className="text-center text-red-500">에러: {error.message}</li>}
        {!isLoading && combinedParticipants.map((p) => (
          <li key={p.userId} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition group">
            <Avatar className="w-8 h-8">
              <AvatarImage src={p.profileImage} />
              <AvatarFallback className="text-xs">{p.userName?.[0]}</AvatarFallback>
            </Avatar>
            <span className={`font-medium text-gray-800 text-sm flex-1 ${p.status === 'CREATOR' ? "text-blue-600" : ""}`}>
              {p.userName}
              {p.status === 'CREATOR' && <span className="ml-1 text-xs text-blue-400 font-bold">(방장)</span>}
              {/* 참여자 상태 구분 */}
              {/* {participants && p.status !== 'CREATOR' && <span className="ml-1 text-xs text-blue-400 font-bold">(참여자)</span>} */}
              {p.userStatus === 'PENDING' && <span className="ml-1 text-xs text-yellow-500 font-bold">(대기중)</span>}
            </span>
            {isCreator && p.userStatus === 'PENDING' && (
              <>
                <button
                  className="ml-1 p-1 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition"
                  title="참여 수락"
                  onClick={() => handleApprove(p.userId, p.userName)}
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  className="ml-1 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition"
                  title="참여 거절"
                  onClick={() => handleDeny(p.userId, p.userName)}
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )} 
            {isCreator && p.status !== 'CREATOR' && p.userStatus === 'APPROVED' && (
              <>
              <button
                className="ml-1 p-1 rounded-full hover:bg-red-200 text-red-500 transition"
                title="강퇴"
                onClick={() => handleKick(p.userId, p.userName)}
              >

                <Icon type="minus" />
              </button>
              <button
              className="p-1 rounded-full hover:bg-green-100 text-green-500 transition"
              title="방장위임"
              onClick={() => handlePromote(p.userId, p.userName)}
              >
                👑
              </button>
            </>
            )}
          </li>
        ))}
      </ul>

      {/* 확인 모달은 상위 컴포넌트(페이지)에서 포털로 렌더링됩니다. */}
    </div>
  )
}

export default ViewParticipantModal