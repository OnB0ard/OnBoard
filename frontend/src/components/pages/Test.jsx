import { useState } from "react"
import { Button } from "@/components/atoms/Button"
import PlanPostModal from "@/components/organisms/PlanPostModal"

const Test = () => {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <Button onClick={handleOpen}>모달 열기</Button>

      {isOpen && (
        <PlanPostModal
          onClose={handleClose}
          onSubmit={() => {
            console.log("제출됨")
            handleClose()
          }}
        />
      )}
    </div>
  )
}

export default Test
