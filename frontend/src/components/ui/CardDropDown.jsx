import React from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { MoreVertical } from "lucide-react"
import { Button } from "../ui/button"

// cardData prop을 받아서 onEdit, onDelete에 넘김
const CardDropdown = ({ cardData, onEdit, onDelete }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="p-1 rounded-full hover:bg-gray-100 transition min-w-0 w-auto h-auto">
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
            onSelect={() => onEdit && onEdit(cardData)}
          >
            수정
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
            onSelect={() => onDelete && onDelete(cardData)}
          >
            삭제
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default CardDropdown
