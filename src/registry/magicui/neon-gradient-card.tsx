import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeonGradientCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function NeonGradientCard({
  className,
  children,
  ...props
}: NeonGradientCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg p-[1px]",
        "bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500",
        "bg-[length:200%_100%] animate-gradient",
        "before:absolute before:inset-0 before:bg-background before:rounded-lg before:m-[1px]",
        className
      )}
      {...props}
    >
      <div className="relative z-10 h-full w-full rounded-lg bg-background p-4">
        {children}
      </div>
    </div>
  )
} 