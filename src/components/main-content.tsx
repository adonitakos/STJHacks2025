import * as React from "react"
import { cn } from "@/lib/utils"

interface MainContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MainContent({
  className,
  children,
  ...props
}: MainContentProps) {
  return (
    <main
      className={cn(
        "flex-1 space-y-4 p-4 sm:px-6 sm:py-0 md:gap-8",
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
} 