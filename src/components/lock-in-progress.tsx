"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LockInProgressProps {
  currentValue: number
  targetValue: number
  title?: string
}

export function LockInProgress({
  currentValue,
  targetValue,
  title = "Lock-in Progress"
}: LockInProgressProps) {
  const progress = Math.min((currentValue / targetValue) * 100, 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current: {currentValue}</span>
            <span>Target: {targetValue}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-right text-sm text-muted-foreground">
            {progress.toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 