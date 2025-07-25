import React, { useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { MoreVertical } from "lucide-react"
import { Button } from "../ui/button"

// cardData prop을 받아서 onEdit, onDelete에 넘김
const CardDropdown = ({ cardData, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)

  const handleEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('CardDropdown에서 수정 버튼 클릭됨!', cardData)
    setOpen(false) // 드롭다운 닫기
    if (onEdit) {
      onEdit(cardData)
    }
  }

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('CardDropdown에서 삭제 버튼 클릭됨!', cardData)
    setOpen(false) // 드롭다운 닫기
    if (onDelete) {
      onDelete(cardData)
    }
  }

  const handleDropdownClick = (e) => {
    e.stopPropagation()
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button 
          variant="ghost" 
          className="p-1 rounded-full hover:bg-gray-100 transition min-w-0 w-auto h-auto"
          onClick={handleDropdownClick}
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          className="z-50 min-w-[8rem] rounded-md border bg-white p-1 shadow-lg"
        >
          <DropdownMenu.Item
            className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            onSelect={handleEdit}
            onClick={handleEdit}
          >
            수정
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
            onSelect={handleDelete}
            onClick={handleDelete}
          >
            삭제
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default CardDropdown
