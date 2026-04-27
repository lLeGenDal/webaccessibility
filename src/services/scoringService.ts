import { Issue, WCAGLevel, MaturityLevel, POURScores, Audit } from "../types";

/**
 * Custom Proprietary Scoring & ITA Engine.
 * Built from scratch to support WCAG A, AA, AAA separation.
 */

export interface InternalScoreResult {
  internalScore: number;
  lighthouseScore: number;
  contrastScore: number;
  itaIndex: number;
  wcagBreakdown: { A: number; AA: number; AAA: number };
  pourScores: POURScores;
  maturityLevel: MaturityLevel;
  summary: string;
}

export function calculateInternalAssessment(issues: Issue[]): InternalScoreResult {
  const confirmed = issues.filter(i => i.status === "Confirmed");
  
  // Count by level
  const countA = confirmed.filter(i => i.wcagLevel === "A").length;
  const countAA = confirmed.filter(i => i.wcagLevel === "AA").length;
  const countAAA = confirmed.filter(i => i.wcagLevel === "AAA").length;

  // 1. Internal System Score (0-100)
  // Balanced weights: A issues (-5 each), AA (-2), AAA (-0.5)
  let internalScore = 100 - (countA * 5) - (countAA * 2) - (countAAA * 0.5);
  internalScore = Math.max(0, Math.round(internalScore));

  // 2. Lighthouse Score Simulation (using Axe data primarily)
  let lighthouseScore = 100 - (countA * 4) - (countAA * 2) - (countAAA * 0.5);
  lighthouseScore = Math.max(0, Math.round(lighthouseScore));

  // 3. Contrast Score
  const contrastIssues = confirmed.filter(i => 
    i.criterion === "1.4.3" || i.criterion === "1.4.6" || i.description.toLowerCase().includes("контраст")
  );
  let contrastScore = 100 - (contrastIssues.length * 10);
  contrastScore = Math.max(0, contrastScore);

  // 4. ITA Index (1-5)
  // ITA focuses on fundamental accessibility. 5.0 is perfect.
  let itaIndex = 5.0;
  itaIndex -= (countA * 0.2);
  itaIndex -= (countAA * 0.1);
  itaIndex -= (countAAA * 0.02);
  itaIndex = Math.max(1.0, Math.round(itaIndex * 10) / 10);

  // 3. Maturity Level
  let maturityLevel: MaturityLevel = "Inactive";
  if (itaIndex >= 4.5 && countA === 0) maturityLevel = "Optimized";
  else if (itaIndex >= 3.8) maturityLevel = "Integrated";
  else if (itaIndex >= 2.8) maturityLevel = "Defined";
  else if (itaIndex >= 1.8) maturityLevel = "Initial";
  else maturityLevel = "Inactive";

  // 4. POUR Scores
  const calcPrinciple = (p: keyof POURScores) => {
    const pIssues = confirmed.filter(i => i.principle?.toLowerCase() === p.toLowerCase());
    // Balanced sensitivity: A = -8%, AA = -4%, AAA = -1%
    const pPenalty = pIssues.reduce((acc, i) => acc + (i.wcagLevel === "A" ? 8 : i.wcagLevel === "AA" ? 4 : 1), 0);
    return Math.max(0, 100 - pPenalty);
  };

  const pourScores: POURScores = {
    perceivable: calcPrinciple("perceivable"),
    operable: calcPrinciple("operable"),
    understandable: calcPrinciple("understandable"),
    robust: calcPrinciple("robust")
  };

  const summary = `
    Внутренняя система оценки: ${internalScore}/100.
    Обнаружено: ${countA} критических барьеров (Level A), ${countAA} ограничений (Level AA) и ${countAAA} рекомендаций (Level AAA).
    Индекс ITA составляет ${itaIndex}, что соответствует уровню зрелости «${maturityLevel}».
  `;

  return {
    internalScore,
    lighthouseScore,
    contrastScore,
    itaIndex,
    wcagBreakdown: { A: countA, AA: countAA, AAA: countAAA },
    pourScores,
    maturityLevel,
    summary
  };
}

export const getWCAGMetadata = (criterion: string): { level: WCAGLevel; principle: keyof POURScores } => {
    const principleMap: Record<string, keyof POURScores> = {
      "1": "perceivable", "2": "operable", "3": "understandable", "4": "robust"
    };
    
    // Robust mapping for common criteria
    const levelMap: Record<string, WCAGLevel> = {
      "1.1.1": "A", "1.2.1": "A", "1.3.1": "A", "1.4.1": "A", "2.1.1": "A", "2.4.1": "A", "3.1.1": "A", "4.1.1": "A", "4.1.2": "A",
      "1.4.3": "AA", "1.4.4": "AA", "2.4.7": "AA", "3.1.2": "AA", "3.2.3": "AA", "4.1.3": "AA",
      "1.4.6": "AAA", "2.4.9": "AAA", "3.1.3": "AAA", "3.1.5": "AAA", "3.3.7": "AAA"
    };

    const firstDigit = criterion.split('.')[0];
    const defaultPrinciple: keyof POURScores = 
      firstDigit === "1" ? "perceivable" :
      firstDigit === "2" ? "operable" :
      firstDigit === "3" ? "understandable" :
      firstDigit === "4" ? "robust" : "perceivable";

    return {
      level: levelMap[criterion] || (criterion.split('.').length > 2 ? "AA" : "A"),
      principle: principleMap[firstDigit] || defaultPrinciple
    };
};
