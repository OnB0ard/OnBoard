import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      background: {
        dark: "bg-slate-700 hover:bg-slate-600",
        white: "bg-white hover:bg-gray-100",
        sky: "bg-[#E1EAFD] hover:bg-[#C4E4FD]", // 여행에 어울릴 것 같은 하늘색
      },
      textColor: {
        white: "text-white",
        black: "text-black",
      },
      shape: {
        rounded: "rounded-md",
        pill: "rounded-full",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6",
      },
      border: {
        none: "",
        gray: "border border-gray-300 dark:border-gray-600",
      },
    },
    defaultVariants: {
      background: "dark",
      textColor: "white",
      shape: "pill",
      size: "md",
      border: "none",
    },
  }
)


function Button({
  className,
  background,
  textColor,
  shape,
  size,
  border,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ background, textColor, shape, size, border, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
