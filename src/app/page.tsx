// app/page.tsx
"use client";

import { AppNavbar } from "@/components/app-navbar";
import { NeonGradientCard } from "@/registry/magicui/neon-gradient-card";
import { LockInProgress } from "@/components/lock-in-progress";
import { Loader2 } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableCaption,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { useState } from "react";

interface ScoreData {
  score: number;
  weight: number;
  feedback: string;
}

interface AnalysisResponse {
  scores: {
    [key: string]: ScoreData;
  };
  overallScore: number;
  codeLines: number;
  commentLines: number;
  nextSteps: string[];
}

export default function DashboardPage() {
  const [codeText, setCodeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const handleAnalyze = async () => {
    if (!codeText.trim()) {
      setError("Please enter some code to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codebase: codeText }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while analyzing the code");
    } finally {
      setLoading(false);
    }
  };

  // Calculate the highest score from the analysis
  const getHighestScore = () => {
    if (!analysis) return 0;
    return Math.max(...Object.values(analysis.scores).map(data => data.score));
  };

  // Get score for a specific criterion
  const getScore = (criterion: string) => {
    if (!analysis) return null;
    return analysis.scores[criterion]?.score || null;
  };

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="flex-1 space-y-8 p-6 pt-24">
        {/* Text Analysis Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Analyze Your Code</CardTitle>
            <CardDescription>
              Paste your code below to analyze it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full h-64 p-4 border rounded-lg font-mono"
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              placeholder="Paste your code here..."
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={loading || !codeText.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Code"
              )}
            </Button>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            {analysis && (
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Overall Score: {analysis.overallScore.toFixed(1)}</h4>
                    <div className="space-y-2">
                      {Object.entries(analysis.scores).map(([criterion, data]) => (
                        <div key={criterion} className="flex justify-between items-center">
                          <span className="capitalize">{criterion}:</span>
                          <span className="font-medium">{data.score}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>Code Lines: {analysis.codeLines}</p>
                      <p>Comment Lines: {analysis.commentLines}</p>
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

        {/* 1) Neon-gradient stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: "Coding Time Logged", 
              value: "3h 25m", 
              desc: "today",
              isStatic: true
            },
            { 
              label: "Readability Score", 
              value: getScore("Readability"), 
              desc: "vs peer avg",
              isStatic: false
            },
            { 
              label: "Comment Coverage", 
              value: getScore("CommentCoverage"), 
              desc: "documented code",
              isStatic: false
            },
            { 
              label: "Test Coverage", 
              value: getScore("TestCoverage"), 
              desc: "with unit tests",
              isStatic: false
            },
          ].map((stat) => (
            <NeonGradientCard
              key={stat.label}
              className="flex flex-col items-center justify-center p-4"
            >
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </h3>
              <p className="mt-2 text-2xl font-semibold">
                {stat.isStatic ? (
                  stat.value
                ) : (
                  stat.value !== null ? (
                    <AnimatedCounter 
                      value={stat.value as number} 
                      duration={2000}
                      suffix=" %"
                    />
                  ) : (
                    "N/A"
                  )
                )}
              </p>
              <span className="text-xs text-muted-foreground">
                {stat.desc}
              </span>
            </NeonGradientCard>
          ))}
        </div>

        {/* 3) Recent sessions table */}
        <Card className="overflow-auto">
          <Table>
            <TableCaption>Recent Coding Sessions</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time Coded</TableHead>
                <TableHead>Readability</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Tests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { date: "Apr 25, 2025", time: "2h 10m", read: "82 %", comm: "40 %", test: "20 %" },
                { date: "Apr 24, 2025", time: "3h 00m", read: "85 %", comm: "45 %", test: "25 %" },
                { date: "Apr 23, 2025", time: "1h 45m", read: "78 %", comm: "38 %", test: "15 %" },
              ].map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell>{row.read}</TableCell>
                  <TableCell>{row.comm}</TableCell>
                  <TableCell>{row.test}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <LockInProgress 
          currentValue={analysis ? getHighestScore() : 75} 
          targetValue={100} 
          title="Your Lock-in Progress" 
        />
      </main>
    </div>
  );
}
