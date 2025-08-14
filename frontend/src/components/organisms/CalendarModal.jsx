import { useState } from "react"
import { CalendarRange } from "@/components/atoms/CalendarRange"
import { Button } from "@/components/atoms/Button"

import "./CalendarModal.css"

function CalendarModal({ isOpen, onClose, onChange }) {
  const [selectedRange, setSelectedRange] = useState({ from: undefined, to: undefined })
  const [errorMessage, setErrorMessage] = useState("")

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
    // 선택 변경 시 에러 메시지 초기화
    if (errorMessage) setErrorMessage("")
  }

  const handleComplete = () => {
    if (selectedRange.from && selectedRange.to) {
      // 오늘 00:00 기준으로 과거 날짜 선택 방지
      const today = new Date()
      const todayYmd = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startYmd = new Date(
        selectedRange.from.getFullYear(),
        selectedRange.from.getMonth(),
        selectedRange.from.getDate()
      )
      const endYmd = new Date(
        selectedRange.to.getFullYear(),
        selectedRange.to.getMonth(),
        selectedRange.to.getDate()
      )

      if (startYmd < todayYmd || endYmd < todayYmd) {
        setErrorMessage("지나간 일을 계획할 수 없습니다")
        return
      }

      // 선택 기간이 30일을 초과하는지 검사 (양끝 포함하여 일수 계산)
      const diffMs = endYmd - startYmd
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1

      if (diffDays > 30) {
        setErrorMessage("최대 30일까지만 선택해주세요")
        return
      }

      // 정상 범위일 때 에러 초기화
      if (errorMessage) setErrorMessage("")
      onChange(selectedRange)
      onClose()
    }
  }

  const handleCancel = () => {
    setSelectedRange({ from: undefined, to: undefined })
    setErrorMessage("")
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

        {/* 달력과 버튼 컴테이너 */}
        <div className="calendar-modal__content">
          {/* 달력 */}
          <div className="calendar-modal__calendar">
            <CalendarRange onChange={handleRangeChange} />
          </div>

          {/* 에러 메시지 (버튼 위 영역) */}
          {errorMessage && (
            <div className="calendar-modal__error" role="alert" aria-live="polite">
              {errorMessage}
            </div>
          )}

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
    </div>
  )
}

export default CalendarModal
