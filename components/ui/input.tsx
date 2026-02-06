import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-slate-100 shadow-sm transition-all duration-200 outline-none md:text-sm",
        "placeholder:text-gray-500",
        "file:inline-flex file:h-8 file:border-0 file:bg-slate-800 file:text-sm file:font-medium file:text-slate-100 file:rounded-md file:px-3 file:mr-3",
        "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25",
        "hover:border-slate-600",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-800/50",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        "selection:bg-emerald-500 selection:text-white",
        className
      )}
      {...props}
    />
  )
}

export { Input }
