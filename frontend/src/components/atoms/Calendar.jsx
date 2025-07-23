import * as React from "react"
import { Calendar as BaseCalendar } from "@/components/ui/calendar"

function Calendar({ value, onChange, className }) {
  const [date, setDate] = React.useState(value ?? new Date())

  const handleSelect = (selected) => {
    setDate(selected)
    onChange?.(selected)
  }

  return (
    <BaseCalendar
      mode="single"
      selected={date}
      onSelect={handleSelect}
      className={className ?? "rounded-md border shadow-sm"}
      captionLayout="dropdown"
    />
  )
}

export { Calendar }