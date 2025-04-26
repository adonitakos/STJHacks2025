export interface Score {
  score: number;
  feedback: string;
}

export interface AnalysisResponse {
  scores: {
    readability: Score;
    maintainability: Score;
    efficiency: Score;
    robustness: Score;
    correctness: Score;
    reusability: Score;
    performance: Score;
    commentCoverage: Score;
    testCoverage: Score;
    outputOverallQuality: Score;
    codeIntegration: Score;
  };
  overallScore: number;
  nextSteps: string[];
} 