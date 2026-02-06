import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-500/20 text-emerald-400 [a&]:hover:bg-emerald-500/30",
        secondary:
          "border-transparent bg-slate-700 text-gray-300 [a&]:hover:bg-slate-600",
        success:
          "border-transparent bg-green-500/20 text-green-400 [a&]:hover:bg-green-500/30",
        warning:
          "border-transparent bg-yellow-500/20 text-yellow-400 [a&]:hover:bg-yellow-500/30",
        destructive:
          "border-transparent bg-red-500/20 text-red-400 [a&]:hover:bg-red-500/30",
        outline:
          "border-slate-700 bg-transparent text-slate-300 [a&]:hover:border-slate-600 [a&]:hover:bg-slate-800/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
