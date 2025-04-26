import * as React from "react"
import { cn } from "@/lib/utils"

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
} 