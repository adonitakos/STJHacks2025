"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, Zap, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Issue {
  line: number;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

interface Suggestion {
  line: number;
  content: string;
  type: "addition" | "modification";
}

interface AnalysisResult {
  issues: Issue[];
  suggestions: Suggestion[];
}

interface CodeAnalysisProps {
  code: string;
  analysis: AnalysisResult;
}

interface Stats {
  totalLines: number;
  issuesFixed: number;
  suggestionsApplied: number;
  score: number;
  streak: number;
  achievements: string[];
}

export function CodeAnalysis({ code, analysis }: CodeAnalysisProps) {
  const [stats, setStats] = useState<Stats>({
    totalLines: 0,
    issuesFixed: 0,
    suggestionsApplied: 0,
    score: 0,
    streak: 0,
    achievements: [],
  });

  useEffect(() => {
    const newStats = {
      totalLines: code.split("\n").length,
      issuesFixed: analysis.issues.filter(i => i.severity === "error").length,
      suggestionsApplied: analysis.suggestions.length,
      score: calculateScore(analysis),
      streak: stats.streak + 1,
      achievements: checkAchievements(analysis, stats),
    };
    setStats(newStats);
  }, [analysis]);

  const calculateScore = (analysis: AnalysisResult) => {
    const errorPenalty = analysis.issues.filter(i => i.severity === "error").length * 10;
    const warningPenalty = analysis.issues.filter(i => i.severity === "warning").length * 5;
    const suggestionBonus = analysis.suggestions.length * 2;
    return Math.max(0, 100 - errorPenalty - warningPenalty + suggestionBonus);
  };

  const checkAchievements = (analysis: AnalysisResult, currentStats: Stats) => {
    const newAchievements = [...currentStats.achievements];
    
    if (analysis.issues.length === 0 && !newAchievements.includes("Perfect Code")) {
      newAchievements.push("Perfect Code");
    }
    
    if (analysis.suggestions.length >= 5 && !newAchievements.includes("Code Guru")) {
      newAchievements.push("Code Guru");
    }
    
    if (currentStats.streak >= 3 && !newAchievements.includes("Consistent Coder")) {
      newAchievements.push("Consistent Coder");
    }
    
    return newAchievements;
  };

  const getLineColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-yellow-100";
      case "warning":
        return "bg-yellow-50";
      case "info":
        return "bg-blue-50";
      default:
        return "";
    }
  };

  const renderCodeWithHighlights = () => {
    const lines = code.split("\n");
    const issuesByLine = analysis.issues.reduce((acc, issue) => {
      acc[issue.line] = issue;
      return acc;
    }, {} as Record<number, Issue>);

    const suggestionsByLine = analysis.suggestions.reduce((acc, suggestion) => {
      acc[suggestion.line] = suggestion;
      return acc;
    }, {} as Record<number, Suggestion>);

    return (
      <div className="font-mono text-sm text-black">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const issue = issuesByLine[lineNumber];
          const suggestion = suggestionsByLine[lineNumber];
          
          return (
            <div key={index} className="relative group">
              <div className={`flex ${issue ? getLineColor(issue.severity) : ""}`}>
                <span className="text-gray-500 w-8 select-none">{lineNumber}</span>
                <span className="flex-1">{line}</span>
              </div>
              
              {suggestion && (
                <div className="ml-8 mt-1 text-green-600">
                  <span className="text-gray-500">+ </span>
                  {suggestion.content}
                </div>
              )}

              {issue && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute left-0 top-0 w-full h-full cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <div className="space-y-1">
                        <div className={`font-semibold ${
                          issue.severity === "error" ? "text-red-600" :
                          issue.severity === "warning" ? "text-yellow-600" :
                          "text-blue-600"
                        }`}>
                          {issue.severity.toUpperCase()}
                        </div>
                        <div>{issue.message}</div>
                        {issue.suggestion && (
                          <div className="text-sm text-gray-600">
                            Suggestion: {issue.suggestion}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Code Score</p>
                <p className="text-2xl font-bold">{stats.score}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <Progress value={stats.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issues Fixed</p>
                <p className="text-2xl font-bold">{stats.issuesFixed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <Progress 
              value={(stats.issuesFixed / stats.totalLines) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suggestions</p>
                <p className="text-2xl font-bold">{stats.suggestionsApplied}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
            <Progress 
              value={(stats.suggestionsApplied / stats.totalLines) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{stats.streak}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
            <Progress 
              value={(stats.streak / 10) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Hover over highlighted lines to see detailed feedback and suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[600px] border rounded-lg p-4 bg-gray-50">
            {renderCodeWithHighlights()}
          </div>
        </CardContent>
      </Card>

      {stats.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                >
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">{achievement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 