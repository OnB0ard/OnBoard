// 이 파일은 백엔드 측에서 참여자 목록 데이터 받아와서 적용시킬 수 있는 파일

import { useRef, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import { Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { useParticipantStore } from "../../store/usePlanUserStore"; // Zustand 스토어 import
import { useAuthStore } from "../../store/useAuthStore";

// planId: 계획 ID
// myName: 현재 로그인한 사용자 이름
// hostName: 방장 닉네임(카드 기준)
const ViewParticipantModal = ({ planId, isOpen, onClose }) => {
  const modalRef = useRef(null);
  const {
    creator,
    participants,
    isLoading,
    error,
    approveRequest,
    denyRequest,
    clearParticipants,
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

  const handleApprove = (targetUserId, name) => {
    if (window.confirm(`${name}님의 참여를 수락하시겠습니까?`)) {
      approveRequest(planId, targetUserId);
    }
  };

  const handleDeny = (targetUserId, name) => {
    if (window.confirm(`${name}님의 참여 요청을 거절하시겠습니까?`)) {
      denyRequest(planId, targetUserId);
    }
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
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ViewParticipantModal