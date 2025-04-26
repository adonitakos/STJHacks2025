"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnalysisResponse } from "@/types/analysis"

interface FileContent {
  path: string;
  content: string;
}

export function FolderUpload() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(async (files: FileList) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Processing files:', Array.from(files).map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      })))

      const fileContents: FileContent[] = await Promise.all(
        Array.from(files).map(async (file: File) => {
          try {
            if (file.size > 1024 * 1024) {
              console.warn(`Skipping large file: ${file.name} (${file.size} bytes)`)
              return {
                path: file.name,
                content: `// Skipped large file: ${file.name} (${file.size} bytes)`
              }
            }

            if (!file.type.startsWith('text/') && !file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|h|hpp|cs|go|rb|php|html|css|scss|json|md|txt)$/i)) {
              console.warn(`Skipping non-text file: ${file.name} (type: ${file.type})`)
              return {
                path: file.name,
                content: `// Skipped non-text file: ${file.name}`
              }
            }

            console.log(`Reading file: ${file.name}`)
            const content = await file.text()
            console.log(`Successfully read file: ${file.name}`)
            
            return {
              path: file.name,
              content
            }
          } catch (err) {
            console.error(`Error reading file ${file.name}:`, err)
            return {
              path: file.name,
              content: `// Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`
            }
          }
        })
      )

      const validFiles = fileContents.filter(file => 
        !file.content.startsWith('// Error reading file:') &&
        !file.content.startsWith('// Skipped large file:') &&
        !file.content.startsWith('// Skipped non-text file:')
      )

      if (validFiles.length === 0) {
        throw new Error('No valid files could be read. Please ensure you are selecting text files.')
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          codebase: validFiles.reduce((acc, file) => {
            return acc + `\n\n// File: ${file.path}\n${file.content}`
          }, "")
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze code: ${response.statusText}`)
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : "An error occurred while processing the files")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFiles(files)
    }
  }, [processFiles])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Codebase Analysis</CardTitle>
        <CardDescription>
          Click to select your codebase files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            style={{ display: 'none' }}
          />
          <p>Click to select files</p>
          <p className="text-sm text-muted-foreground mt-2">
            Supported file types: .js, .ts, .jsx, .tsx, .py, .java, .cpp, .h, .hpp, .cs, .go, .rb, .php, .html, .css, .scss, .json, .md, .txt
          </p>
        </div>

        {loading && <p className="text-center">Analyzing codebase...</p>}
        
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