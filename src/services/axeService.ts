import { Issue, WCAGLevel, POURScores } from "../types";
import axe from "axe-core";

/**
 * Standalone Axe-Core Engine.
 * Provides a clean technical accessibility score (0-100).
 */

const tagToLevel = (tags: string[]): WCAGLevel => {
  if (tags.includes("wcag2aaa")) return "AAA";
  if (tags.includes("wcag2aa") || tags.includes("wcag21aa")) return "AA";
  return "A";
};

const getPrinciple = (criterion: string): keyof POURScores => {
  const map: Record<string, keyof POURScores> = {
    "1": "perceivable", "2": "operable", "3": "understandable", "4": "robust"
  };
  return map[criterion.split(".")[0]] || "perceivable";
};

export async function runAxeAudit(html: string): Promise<{ score: number; issues: Partial<Issue>[] }> {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const results = await axe.run(container, {
      resultTypes: ['violations'],
      rules: {
        'color-contrast': { enabled: true },
        'valid-lang': { enabled: true }
      }
    });
    
    const issues: Partial<Issue>[] = results.violations.map(v => {
      const level = tagToLevel(v.tags);
      const criterion = v.tags.find(t => /^\d+\.\d+\.\d+$/.test(t)) || "1.1.1";
      
      return {
        criterion,
        wcagLevel: level,
        principle: getPrinciple(criterion),
        severity: v.impact === 'critical' ? 'Critical' : v.impact === 'serious' ? 'High' : v.impact === 'moderate' ? 'Medium' : 'Low',
        description: `${v.help}: ${v.description}`,
        recommendation: v.nodes[0]?.failureSummary || v.description,
        element: v.nodes[0]?.html.substring(0, 500),
        engine: "Axe",
        source: "Axe Core",
        status: "Confirmed",
        helpUrl: v.helpUrl
      };
    });

    // Score: 100 base, -15 for Critical, -8 for Serious, -4 for Moderate
    let score = 100;
    results.violations.forEach(v => {
      const penalty = v.impact === 'critical' ? 15 : v.impact === 'serious' ? 8 : v.impact === 'moderate' ? 4 : 2;
      score -= penalty;
    });

    return {
      score: Math.max(0, Math.round(score)),
      issues
    };
  } finally {
    document.body.removeChild(container);
  }
}
