// 이 파일은 백엔드 측에서 참여자 목록 데이터 받아와서 적용시킬 수 있는 파일

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import { Check, X } from "lucide-react"
import { Button } from "../ui/button"
import { 
  getParticipants, 
  acceptInvitation, 
  rejectInvitation, 
  removeParticipant 
} from "../../apis/participantApi"

// planId: 계획 ID
// myName: 현재 로그인한 사용자 이름
// hostName: 방장 닉네임(카드 기준)
const ViewParticipantModal = ({ planId, myName = "", hostName = "", isOpen, onClose }) => {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(false)
  const modalRef = useRef(null)
  const isHost = myName === hostName

  // 참여자 목록 조회
  const fetchParticipants = async () => {
    if (!planId) return;
    
    try {
      setLoading(true);
      const response = await getParticipants(planId);
      
      // 백엔드 응답 구조에 맞춰 데이터 변환
      const participantsData = response.body || response;
      const transformedParticipants = participantsData.map(participant => ({
        id: participant.creator?.userId || participant.userId,
        name: participant.creator?.userName || participant.userName,
        avatar: participant.creator?.profileImage || participant.profileImage,
        status: participant.status || "accepted", // 기본값은 accepted
        isHost: participant.creator?.userId === hostName // 방장 여부 확인
      }));
      
      setParticipants(transformedParticipants);
    } catch (error) {
      console.error('참여자 목록 조회 실패:', error);
      alert('참여자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 외부 클릭 감지 및 참여자 목록 조회
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose && onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      fetchParticipants(); // 모달이 열릴 때 참여자 목록 조회
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, planId])

  // 삭제/거절
  const handleDelete = async (id, name, status) => {
    if (status === "pending") {
      if (window.confirm(`${name}님의 초대를 거절하시겠습니까?`)) {
        try {
          await rejectInvitation(planId, id);
          setParticipants(prev => prev.filter(p => p.id !== id));
          alert(`${name}님의 초대가 거절되었습니다.`);
        } catch (error) {
          alert('초대 거절에 실패했습니다.');
        }
      }
    } else {
      if (window.confirm(`${name}님을 정말로 내보내시겠습니까?`)) {
        try {
          await removeParticipant(planId, id);
          setParticipants(prev => prev.filter(p => p.id !== id));
          alert(`${name}님이 방에서 내보내졌습니다.`);
        } catch (error) {
          alert('참여자 내보내기에 실패했습니다.');
        }
      }
    }
  }
  
  // 초대 수락
  const handleAccept = async (id, name) => {
    if (window.confirm(`${name}님의 초대를 수락하시겠습니까?`)) {
      try {
        await acceptInvitation(planId, id);
        setParticipants(prev => prev.map(p => p.id === id ? { ...p, status: "accepted" } : p));
        alert(`${name}님이 참여자로 등록되었습니다.`);
      } catch (error) {
        alert('초대 수락에 실패했습니다.');
      }
    }
  }

  if (!isOpen) return null

  return (
    <div ref={modalRef} className="w-72 max-h-80 bg-white rounded-xl shadow-xl p-4 flex flex-col border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="font-bold text-lg">
            참여자 목록
            <span className="ml-2 text-xs text-gray-400">({isHost ? "방장" : "참여자"})</span>
          </h3>
          <span className="ml-2 text-xs text-gray-400">
            {loading ? "로딩 중..." : `${participants.filter(p => p.status !== "left").length}명`}
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
        {participants.filter(p => p.status !== "left").map((p) => (
          <li key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition group">
            <Avatar className="w-8 h-8">
              <AvatarImage src={p.avatar} />
              <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
            </Avatar>
            <span className={`font-medium text-gray-800 text-sm flex-1 ${p.name === hostName ? "text-blue-600" : ""}`}>
              {p.name}
              {p.name === hostName && <span className="ml-1 text-xs text-blue-400 font-bold">(방장)</span>}
            </span>
            {/* 방장일 때만 수락/삭제 버튼 노출 */}
            {isHost && p.status === "pending" && (
              <button
                className="ml-1 p-1 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition"
                title="초대 수락"
                onClick={() => handleAccept(p.id, p.name)}
              >
                <Check className="w-3 h-3" />
              </button>
            )}
            {isHost && p.name !== hostName && (
              <button
                className="ml-1 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition"
                title={p.status === "pending" ? "초대 거절" : "내보내기"}
                onClick={() => handleDelete(p.id, p.name, p.status)}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ViewParticipantModal