import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  `
  file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground
  flex h-9 min-w-0 px-3 py-1 text-base transition-[color,box-shadow]
  file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium
  disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
  outline-none focus:outline-none focus:ring-0 focus:border-none
  bg-transparent border-none shadow-none rounded-none
  `,
  {
    variants: {
      size: {
        full: "w-full",
        half: "w-[calc(50%-0.5rem)]",
        lg: "w-[500px]",
        sm: "w-[250px]",
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
