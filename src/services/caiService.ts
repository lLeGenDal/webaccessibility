import { Issue, Audit, MaturityLevel, POURScores } from "../types";

/**
 * Complex Accessibility Index (CAI) Service.
 * Implements the multi-factor mathematical model.
 */

interface CAIInput {
  axeScore: number;
  customScore: number;
  lighthouseScore: number;
  issues: Issue[];
}

export interface CAIResult {
  finalScore: number;
  itaIndex: number;
  maturityLevel: MaturityLevel;
  summary: string;
}

export function calculateCAI(input: CAIInput): CAIResult {
  const { axeScore, customScore, lighthouseScore, issues } = input;

  // 1. Base Multi-Factor Score
  // FinalScore = (CustomScore * 0.4) + (AxeScore * 0.3) + (LighthouseScore * 0.3)
  let finalScore = (customScore * 0.4) + (axeScore * 0.3) + (lighthouseScore * 0.3);

  // 2. Penalty System
  // Critical (-20), Serious (-10), Moderate (-4)
  const confirmedIssues = issues.filter(i => i.status === "Confirmed");
  
  const criticalCount = confirmedIssues.filter(i => i.severity === "Critical").length;
  const seriousCount = confirmedIssues.filter(i => i.severity === "High").length;
  const moderateCount = confirmedIssues.filter(i => i.severity === "Medium").length;

  const totalPenalty = (criticalCount * 20) + (seriousCount * 10) + (moderateCount * 4);
  
  finalScore = Math.max(0, finalScore - totalPenalty);

  // 3. ITA Index Mapping (1-5)
  const itaIndex = Math.max(1, Math.min(5, (finalScore / 20)));
  
  let maturityLevel: MaturityLevel = "Inactive";
  if (itaIndex >= 4.5) maturityLevel = "Optimized";
  else if (itaIndex >= 3.5) maturityLevel = "Integrated";
  else if (itaIndex >= 2.5) maturityLevel = "Defined";
  else if (itaIndex >= 1.5) maturityLevel = "Initial";
  else maturityLevel = "Inactive";

  return {
    finalScore: Math.round(finalScore),
    itaIndex: Math.round(itaIndex * 10) / 10,
    maturityLevel,
    summary: generateCAISummary(input, finalScore)
  };
}

function generateCAISummary(input: CAIInput, score: number): string {
  const { issues } = input;
  const critical = issues.filter(i => i.severity === "Critical").length;
  
  let text = `Итоговый индекс CAI: ${score.toFixed(1)}/100.\n\n`;
  
  if (critical > 0) {
    text += `🆘 Обнаружено ${critical} критических барьеров. Согласно модели CAI, каждый такой барьер снижает оценку на 20 баллов.\n`;
  } else {
    text += `✅ Критических барьеров не обнаружено. Продолжайте оптимизацию Serious и Moderate факторов.\n`;
  }
  
  return text;
}
