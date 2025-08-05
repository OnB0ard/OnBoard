"use client"
import * as React from "react"
import { Copy } from "lucide-react"
import { Button } from "../ui/button"
import { createInvitationLink } from "../../apis/participantApi.js"

const ShareModal = ({ open, onOpenChange, trigger, planId }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [inviteUrl, setInviteUrl] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const modalRef = React.useRef(null)

  // 외부에서 제어하는 경우와 내부에서 제어하는 경우를 구분
  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  // 외부 클릭 감지 및 초대 링크 생성
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      generateInviteLink(); // 모달이 열릴 때 초대 링크 생성
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen, planId])

  // 초대 링크 생성
  const generateInviteLink = async () => {
    if (!planId) return;
    
    try {
      setLoading(true);
      const response = await createInvitationLink(planId);
      const baseUrl = window.location.origin;
      const planUrl = `${baseUrl}/plan/${planId}`;
      setInviteUrl(planUrl);
    } catch (error) {
      console.error('초대 링크 생성 실패:', error);
      // 실패 시 기본 URL 생성
      const baseUrl = window.location.origin;
      const planUrl = `${baseUrl}/plan/${planId}`;
      setInviteUrl(planUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      alert("링크가 복사되었습니다!")
    }
  }

  // 트리거 버튼만 렌더링
  if (trigger) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        {React.cloneElement(trigger, {
          onClick: (e) => {
            e.stopPropagation()
            setIsOpen(true)
          }
        })}
      </div>
    )
  }

  // 팝오버 컨텐츠만 렌더링
  if (!isOpen) return null;

  return (
    <div ref={modalRef} className="w-72 rounded-xl shadow-lg bg-white p-4 border border-gray-200 relative z-[99999]" style={{ zIndex: 99999, position: 'relative' }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold">계획 초대하기</h2>
        <Button 
          onClick={() => setIsOpen(false)} 
          className="text-lg leading-none bg-gray-100 hover:bg-gray-200 text-gray-600 w-6 h-6 p-0 flex items-center justify-center rounded-full text-sm"
        >
          ×
        </Button>
      </div>
      <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50">
        <div className="flex-1 text-sm bg-transparent outline-none text-gray-700 truncate">
          {loading ? "링크 생성 중..." : inviteUrl || "링크를 생성할 수 없습니다."}
        </div>
        <Button 
          onClick={handleCopy} 
          disabled={loading || !inviteUrl}
          className="bg-black text-white w-8 h-8 p-0 flex items-center justify-center rounded-lg disabled:bg-gray-400"
        >
          <Copy className="w-4 h-4 text-gray-200" />
        </Button>
      </div>
    </div>
  )
}

export default ShareModal
