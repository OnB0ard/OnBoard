// 이 파일은 백엔드 측에서 참여자 목록 데이터 받아와서 적용시킬 수 있는 파일

import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import { Check, X } from "lucide-react"

// participants: [{ id, name, avatar, isHost, status }]
// myName: 현재 로그인한 사용자 이름
// hostName: 방장 닉네임(카드 기준)
const ViewParticipantModal = ({ participants: initialParticipants = [], myName = "", hostName = "" }) => {
  const [participants, setParticipants] = useState(initialParticipants)
  const isHost = myName === hostName

  // 삭제/거절
  const handleDelete = (id, name, status) => {
    if (status === "pending") {
      if (window.confirm(`${name}님의 초대를 거절하시겠습니까?`)) {
        setParticipants(prev => prev.filter(p => p.id !== id))
        alert(`${name}님의 초대가 거절되었습니다.`)
        // 실제 거절 API 호출 필요
      }
    } else {
      if (window.confirm(`${name}님을 정말로 내보내시겠습니까?`)) {
        setParticipants(prev => prev.filter(p => p.id !== id))
        alert(`${name}님이 방에서 내보내졌습니다.`)
        // 실제 삭제 API 호출 필요
      }
    }
  }
  // 초대 수락
  const handleAccept = (id, name) => {
    if (window.confirm(`${name}님의 초대를 수락하시겠습니까?`)) {
      setParticipants(prev => prev.map(p => p.id === id ? { ...p, status: "accepted" } : p))
      alert(`${name}님이 참여자로 등록되었습니다.`)
      // 실제 수락 API 호출 필요
    }
  }

  return (
    <div className="w-72 max-h-80 bg-white rounded-xl shadow-xl p-4 flex flex-col border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">
          참여자 목록
          <span className="ml-2 text-xs text-gray-400">({isHost ? "방장" : "참여자"})</span>
        </h3>
        <span className="text-xs text-gray-400">{participants.length}명</span>
      </div>
      <ul className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-48">
        {participants.map((p) => (
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