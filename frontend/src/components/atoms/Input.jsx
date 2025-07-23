import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Input의 사이즈 variant 정의
const inputVariants = cva(
  `
  file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground
  dark:bg-input/30 border-input
  flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none
  file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium
  disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
  focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]
  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
  `,
  {
    variants: {
      size: {
        full: "w-full", // 부모 크기에 100%
        half: "w-[calc(50%-0.5rem)]", // flex gap 감안한 절반 크기
        lg: "w-[500px]", // 큰 검색창(여행 리스트)
        sm: "w-[250px]", // 작은 검색창(메인에서 여행 상세 검색)
      },
    },
    defaultVariants: {
      size: "full",
    },
  }
)

function Input({ className, type = "text", size, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
