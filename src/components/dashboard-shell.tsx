import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({
  className,
  children,
  ...props
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen bg-background",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 