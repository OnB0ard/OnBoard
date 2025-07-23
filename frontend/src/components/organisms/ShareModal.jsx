"use client"

import * as React from "react"
import { Popover, PopoverTrigger, PopoverContent,  } from "@radix-ui/react-popover"

import { Copy } from "lucide-react"
import { Button } from "../ui/button"

const ShareModal = () => {
  const [open, setOpen] = React.useState(false)
  const inviteUrl = "https://www.figma.com/..."

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    alert("링크가 복사되었습니다!")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="px-3 py-2 bg-black text-white rounded-md">공유하기</Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-64 rounded-xl shadow-lg bg-white p-4"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-semibold">계획 초대하기</h2>
          {/* <Button onClick={() => setOpen(false)} className="text-xl leading-none bg-black text-white w-10 h-10 p-0 flex items-center justify-center rounded-xl">
            ×
          </Button> */}
        </div>
        <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50">
          <div className="flex-1 text-sm bg-transparent outline-none text-gray-700 truncate">
            https://www.figma.com/...
          </div>
          <Button onClick={handleCopy} className="bg-black text-white w-10 h-10 p-0 flex items-center justify-center rounded-xl">
            <Copy className="w-4 h-4 text-gray-200" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ShareModal
