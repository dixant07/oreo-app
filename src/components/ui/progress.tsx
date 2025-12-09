import * as React from "react"

import { cn } from "@/lib/utils/cn"

const Progress = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        value?: number
        indicatorClassName?: string
    }
>(({ className, value, indicatorClassName, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-slate-900/20 dark:bg-slate-50/20",
            className
        )}
        {...props}
    >
        <div
            className={cn("h-full w-full flex-1 bg-slate-900 transition-all dark:bg-slate-50", indicatorClassName)}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
