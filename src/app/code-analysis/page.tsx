"use client";

import { CodeAnalysis } from "@/components/code-analysis";
import { useSearchParams } from "next/navigation";

export default function CodeAnalysisPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const analysis = searchParams.get("analysis") ? JSON.parse(searchParams.get("analysis")!) : null;

  if (!code || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Code Analysis Available</h1>
          <p className="text-gray-600">
            Please analyze some code first to see the results.
          </p>
        </div>
      </div>
    );
  }

  return <CodeAnalysis code={code} analysis={analysis} />;
} 