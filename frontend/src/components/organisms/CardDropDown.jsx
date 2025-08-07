import React, { useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { MoreVertical } from "lucide-react"
import { Button } from "../ui/button"
import PlanPostModal from "./PlanPostModal"
import { updatePlan } from "../../apis/planUpdate"
import { deletePlan } from "../../apis/planDelete"

const CardDropdown = ({ cardData, onEditSuccess, onDeleteSuccess }) => {
  const [open, setOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setEditModalOpen(true)
    setOpen(false)
  }

  const handleEditModalClose = () => {
    setEditModalOpen(false)
  }

  const handleEditSubmit = async (formData) => {
    setLoading(true)
    try {
      await updatePlan(cardData.id, formData)
      setEditModalOpen(false)
      if (onEditSuccess) onEditSuccess()
      alert('계획이 수정되었습니다.')
    } catch (error) {
      alert('수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      await deletePlan(cardData.id)
      if (onDeleteSuccess) onDeleteSuccess()
      alert('계획이 삭제되었습니다.')
    } catch (error) {
      alert('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const handleDropdownClick = (e) => {
    e.stopPropagation()
  }

  return (
    <>
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
      {editModalOpen && (
        <PlanPostModal
          mode="edit"
          initialData={cardData}
          onClose={handleEditModalClose}
          onSubmit={handleEditSubmit}
        />
      )}
    </>
  )
}

export default CardDropdown