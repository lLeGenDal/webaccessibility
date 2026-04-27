import { Issue } from "../types";

// Lighthouse scoring logic (based on Axe Core results since Lighthouse uses Axe)
// In a real production environment, we would call the PageSpeed Insights API
export const getLighthouseScore = (axeScore: number, violationsCount: number): number => {
  // Lighthouse is very sensitive to critical issues
  return Math.max(0, Math.round(axeScore * 0.95 - (violationsCount * 0.5)));
};

// WAVE simulation logic
// WAVE identifies Errors, Contrast Errors, Alerts, etc.
export const runWaveSimulation = (axeIssues: Partial<Issue>[]): { score: number; issues: any[] } => {
  const errors = axeIssues.filter(i => i.severity === 'Critical' || i.severity === 'High');
  const contrast = axeIssues.filter(i => i.criterion === '1.4.3');
  const alerts = axeIssues.filter(i => i.severity === 'Medium' || i.severity === 'Low');

  // WAVE score logic: less about 0-100, more about counts, but we normalize for the dashboard
  const score = Math.max(0, 100 - (errors.length * 4 + contrast.length * 3 + alerts.length * 1));
  
  return { 
    score, 
    issues: [
      ...errors.map(e => ({ ...e, source: 'WAVE', label: 'Error' })),
      ...contrast.map(c => ({ ...c, source: 'WAVE', label: 'Contrast Error' })),
    ] 
  };
};

// Siteimprove DCI (Digital Certainty Index) Accessibility Score
export const calculateSiteimproveDCI = (axeIssues: Partial<Issue>[]): number => {
  // Siteimprove weights WCAG A and AA issues heavily
  const levelA = axeIssues.filter(i => i.wcagLevel === "A").length;
  const levelAA = axeIssues.filter(i => i.wcagLevel === "AA").length;
  
  const score = 100 - (levelA * 6 + levelAA * 3);
  return Math.max(0, Math.round(score));
};

// Silktide scoring logic
export const getSilktideScore = (axeScore: number): number => {
  // Silktide usually gives slightly more optimistic scores than Axe but penalizes UX issues
  return Math.min(100, Math.round(axeScore * 1.05 - 2));
};
