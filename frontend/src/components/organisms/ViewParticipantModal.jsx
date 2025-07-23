import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import { Check, X } from "lucide-react"

// 예시 참여자 데이터
const participants = [
  { id: 1, name: "김경진", avatar: "https://randomuser.me/api/portraits/men/32.jpg", status: "accepted" },
  { id: 2, name: "리쿠", avatar: "https://randomuser.me/api/portraits/men/33.jpg", status: "accepted" },
  { id: 3, name: "박예쁜", avatar: "https://randomuser.me/api/portraits/women/44.jpg", status: "pending" },
  { id: 4, name: "최멋짐", avatar: "https://randomuser.me/api/portraits/men/45.jpg", status: "accepted" },
];

// 공통 렌더 함수
function ParticipantList({ myName, hostName }) {
  const [list, setList] = useState(participants);
  const isHost = myName === hostName;

  // 삭제/거절
  const handleDelete = (id, name, status) => {
    if (status === "pending") {
      if (window.confirm(`${name}님의 초대를 거절하시겠습니까?`)) {
        setList(prev => prev.filter(p => p.id !== id));
        alert(`${name}님의 초대가 거절되었습니다.`);
      }
    } else {
      if (window.confirm(`${name}님을 정말로 내보내시겠습니까?`)) {
        setList(prev => prev.filter(p => p.id !== id));
        alert(`${name}님이 방에서 내보내졌습니다.`);
      }
    }
  };
  // 초대 수락
  const handleAccept = (id, name) => {
    if (window.confirm(`${name}님의 초대를 수락하시겠습니까?`)) {
      setList(prev => prev.map(p => p.id === id ? { ...p, status: "accepted" } : p));
      alert(`${name}님이 참여자로 등록되었습니다.`);
    }
  };

  return (
    <div className="w-64 max-h-80 bg-white rounded-xl shadow-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">
          참여자 목록
          <span className="ml-2 text-xs text-gray-400">({isHost ? "방장" : "참여자"})</span>
        </h3>
        <span className="text-xs text-gray-400">{list.length}명</span>
      </div>
      <ul className="space-y-2 overflow-y-auto pr-1 flex-1">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition group">
            <Avatar>
              <AvatarImage src={p.avatar} />
              <AvatarFallback>{p.name[0]}</AvatarFallback>
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
                <Check className="w-4 h-4" />
              </button>
            )}
            {isHost && p.name !== hostName && (
              <button
                className="ml-1 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition"
                title={p.status === "pending" ? "초대 거절" : "내보내기"}
                onClick={() => handleDelete(p.id, p.name, p.status)}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const ViewParticipantModal = () => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 방장일 때 */}
      <ParticipantList myName="김경진" hostName="김경진" />
      {/* 방장이 아닐 때 */}
      {/* <ParticipantList myName="리쿠" hostName="김경진" /> */}
    </div>
  );
};

export default ViewParticipantModal;