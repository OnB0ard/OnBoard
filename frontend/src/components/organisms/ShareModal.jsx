"use client"

import * as React from "react"
import { Copy } from "lucide-react"
import { Button } from "../ui/button"

const ShareModal = ({ open, onOpenChange, trigger }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const inviteUrl = "https://www.figma.com/..."

  // 외부에서 제어하는 경우와 내부에서 제어하는 경우를 구분
  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    alert("링크가 복사되었습니다!")
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
    <div className="w-72 rounded-xl shadow-lg bg-white p-4 border border-gray-200">
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
          {inviteUrl}
        </div>
        <Button onClick={handleCopy} className="bg-black text-white w-8 h-8 p-0 flex items-center justify-center rounded-lg">
          <Copy className="w-4 h-4 text-gray-200" />
        </Button>
      </div>
    </div>
  )
}

export default ShareModal
