import { useState } from "react"
import { CalendarRange } from "@/components/atoms/CalendarRange"
import { Button } from "@/components/atoms/Button"

import "./CalendarModal.css"

function CalendarModal({ isOpen, onClose, onChange }) {
  const [selectedRange, setSelectedRange] = useState({ from: undefined, to: undefined })

  if (!isOpen) return null

  const formatDate = (date) => {
    if (!date) return ""
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    return `${yyyy}.${mm}.${dd}`
  }

  const handleRangeChange = (range) => {
    setSelectedRange(range)
  }

  const handleComplete = () => {
    if (selectedRange.from && selectedRange.to) {
      onChange(selectedRange)
      onClose()
    }
  }

  const handleCancel = () => {
    setSelectedRange({ from: undefined, to: undefined })
    onClose()
  }

  return (
    <div
      className="calendar-modal__backdrop"
      onClick={handleCancel}
    >
      <div
        className="calendar-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="calendar-modal__header">
          <h3 className="calendar-modal__title">여행 기간 선택</h3>
          <div className="calendar-modal__date-info">
            <div className="calendar-modal__date-item">
              <span className="calendar-modal__date-label">시작일:</span>
              <span className="calendar-modal__date-value">
                {selectedRange.from ? formatDate(selectedRange.from) : "날짜를 선택하세요"}
              </span>
            </div>
            <div className="calendar-modal__date-item">
              <span className="calendar-modal__date-label">도착일:</span>
              <span className="calendar-modal__date-value">
                {selectedRange.to ? formatDate(selectedRange.to) : "날짜를 선택하세요"}
              </span>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div className="calendar-modal__calendar">
          <CalendarRange onChange={handleRangeChange} />
        </div>

        {/* 버튼 */}
        <div className="calendar-modal__footer">
          <Button
            background="white"
            textColor="black"
            border="gray"
            shape="pill"
            onClick={handleCancel}
          >
            취소
          </Button>
          <Button
            background="dark"
            textColor="white"
            shape="pill"
            onClick={handleComplete}
            disabled={!selectedRange.from || !selectedRange.to}
          >
            완료
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CalendarModal
