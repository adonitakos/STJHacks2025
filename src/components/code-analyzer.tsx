"use client"

import { useState, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalysisResponse } from "@/types/analysis"

export function CodeAnalyzer() {
  const [code, setCode] = useState("")
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please enter some code to analyze")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codebase: code }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze code")
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste your code here..."
          value={code}
          onChange={handleCodeChange}
          className="min-h-[200px] font-mono"
        />
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Code"}
        </Button>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {analysis && (
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className="grid gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Overall Score: {analysis.overallScore}</h4>
                <div className="space-y-2">
                  {Object.entries(analysis.scores).map(([criterion, data]) => (
                    <div key={criterion} className="flex justify-between items-center">
                      <span className="capitalize">{criterion}:</span>
                      <span className="font-medium">{data.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Next Steps</h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 