import { useState } from "react"
import { Calendar as BaseCalendar } from "@/components/ui/calendar"

function CalendarRange({ className, onChange }) {
  const [range, setRange] = useState({ from: undefined, to: undefined })
  const [leftMonth, setLeftMonth] = useState(new Date())
  const [rightMonth, setRightMonth] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth
  })

  // 연도 범위 설정 (현재 연도부터 10년 후까지)
  const currentYear = new Date().getFullYear()
  const fromYear = currentYear
  const toYear = currentYear + 10

  const handleSelect = (selected) => {
    setRange(selected)
    // 달력에서 날짜를 선택할 때마다 onChange 호출
    if (onChange && selected) {
      onChange(selected)
    }
  }

  const handleLeftMonthChange = (month) => {
    setLeftMonth(month)
    // 왼쪽 달력이 오른쪽 달력보다 늦거나 같으면 오른쪽을 다음 달로 설정
    if (month >= rightMonth) {
      const nextMonth = new Date(month)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setRightMonth(nextMonth)
    }
  }

  const handleRightMonthChange = (month) => {
    // 오른쪽 달력이 왼쪽 달력보다 빠르거나 같으면 왼쪽을 이전 달로 설정
    if (month <= leftMonth) {
      const prevMonth = new Date(month)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      setLeftMonth(prevMonth)
    }
    setRightMonth(month)
  }

  return (
    <div className="flex gap-4">
      {/* 왼쪽 달력 */}
      <BaseCalendar
        mode="range"
        selected={range}
        onSelect={handleSelect}
        month={leftMonth}
        onMonthChange={handleLeftMonthChange}
        numberOfMonths={1}
        showOutsideDays={false}
        className={className ?? "rounded-md border shadow-sm"}
        captionLayout="dropdown"
        fromYear={fromYear}
        toYear={toYear}
      />
      
      {/* 오른쪽 달력 */}
      <BaseCalendar
        mode="range"
        selected={range}
        onSelect={handleSelect}
        month={rightMonth}
        onMonthChange={handleRightMonthChange}
        numberOfMonths={1}
        showOutsideDays={false}
        className={className ?? "rounded-md border shadow-sm"}
        captionLayout="dropdown"
        fromYear={fromYear}
        toYear={toYear}
      />
    </div>
  )
}

export { CalendarRange }