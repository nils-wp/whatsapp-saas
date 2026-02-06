import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm shadow-emerald-500/25",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500/50 shadow-sm shadow-red-500/25",
        outline:
          "border border-slate-700 bg-transparent text-slate-100 hover:border-emerald-500 hover:text-emerald-400 active:bg-emerald-500/10",
        secondary:
          "bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-600 shadow-sm",
        ghost:
          "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white active:bg-white/15",
        link: "text-emerald-400 underline-offset-4 hover:underline hover:text-emerald-300 p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-6 text-base has-[>svg]:px-4",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
