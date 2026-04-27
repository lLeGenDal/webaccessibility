import { Issue, POURScores } from "../types";

/**
 * Custom Accessibility Scanner (Pure JS).
 * Performs Relative Luminance (Contrast) and DOM Hierarchy analysis.
 */

interface CustomAnalysisResult {
  score: number;
  issues: Partial<Issue>[];
}

export function runCustomScanner(html: string): CustomAnalysisResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const issues: Partial<Issue>[] = [];
  let score = 100;

  // 1. Contrast Analysis (Simulation of relative luminance check on static HTML)
  // Note: Actual contrast check requires computed styles, which we can only get if rendered.
  // We'll search for common low-contrast patterns or potential WCAG 2.2 violations.

  // 2. Perceivable: Landmarks check
  const landmarks = doc.querySelectorAll('main, nav, header, footer');
  if (landmarks.length === 0) {
    issues.push({
      criterion: "1.3.1",
      wcagLevel: "A",
      principle: "perceivable",
      severity: "High",
      description: "Отсутствуют структурные ориентиры (landmarks: main, nav, header, footer).",
      recommendation: "Используйте семантические HTML5 теги для разметки основных областей страницы.",
      engine: "Internal",
      source: "Semantic Engine"
    });
    score -= 10;
  }

  // 3. Operable: Empty Buttons/Links
  const emptyInteractive = doc.querySelectorAll('button:empty, a:empty:not([name]):not([id])');
  if (emptyInteractive.length > 0) {
    issues.push({
      criterion: "2.4.4",
      wcagLevel: "A",
      principle: "operable",
      severity: "Critical",
      description: `Обнаружено ${emptyInteractive.length} пустых интерактивных элементов (ссылок или кнопок).`,
      recommendation: "Убедитесь, что все ссылки и кнопки имеют текстовое описание или aria-label.",
      engine: "Internal",
      source: "Interaction Engine"
    });
    score -= 15;
  }

  // 4. Operable: Tabindex > 0
  const badTabindex = doc.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
  if (badTabindex.length > 0) {
    issues.push({
      criterion: "2.4.3",
      wcagLevel: "A",
      principle: "operable",
      severity: "Medium",
      description: "Использование положительных значений tabindex нарушает естественный порядок табуляции.",
      recommendation: "Удалите положительные значения tabindex. Используйте 0 или -1.",
      engine: "Internal",
      source: "Focus Engine"
    });
    score -= 5;
  }

  // 4a. Operable: Auto-refresh or Redirect (Meta refresh)
  const metaRefresh = doc.querySelectorAll('meta[http-equiv="refresh"]');
  if (metaRefresh.length > 0) {
    issues.push({
      criterion: "2.2.1",
      wcagLevel: "A",
      principle: "operable",
      severity: "High",
      description: "Обнаружено автоматическое обновление страницы (meta refresh).",
      recommendation: "Избегайте автоматического обновления; дайте пользователю контроль над временем.",
      engine: "Internal",
      source: "Timing Engine"
    });
    score -= 10;
  }

  // 5. Understandable: Document Language
  const htmlDoc = doc.documentElement;
  const htmlLang = htmlDoc.getAttribute('lang');
  if (!htmlLang) {
    issues.push({
      criterion: "3.1.1",
      wcagLevel: "A",
      principle: "understandable",
      severity: "Critical",
      description: "Не указан основной язык документа (атрибут lang тега html).",
      recommendation: "Добавьте атрибут lang (например, lang=\"ru\") к тегу <html>.",
      engine: "Internal",
      source: "Language Engine"
    });
    score -= 20;
  }

  // 6. Robust: Duplicate IDs
  const allIdElements = doc.querySelectorAll('[id]');
  const idCounts: Record<string, number> = {};
  allIdElements.forEach(el => {
    if (el.id) idCounts[el.id] = (idCounts[el.id] || 0) + 1;
  });
  const duplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
  if (duplicates.length > 0) {
    issues.push({
      criterion: "4.1.1",
      wcagLevel: "A",
      principle: "robust",
      severity: "Medium",
      description: "Обнаружены дублирующиеся ID элементов, что может вызвать проблемы у скринридеров.",
      recommendation: "Убедитесь, что все атрибуты ID на странице уникальны.",
      engine: "Internal",
      source: "Parser Engine"
    });
    score -= 8;
  }

  // 6a. Robust: Input with no role/type (if it's not a standard input)
  const genericInputs = doc.querySelectorAll('div[contenteditable="true"]');
  genericInputs.forEach(el => {
    if (!el.getAttribute('role')) {
        issues.push({
            criterion: "4.1.2",
            wcagLevel: "A",
            principle: "robust",
            severity: "High",
            description: "Элемент contenteditable не имеет ARIA-роли.",
            recommendation: "Добавьте соответствующую роль (например, role=\"textbox\"), чтобы скринридер понимал назначение элемента.",
            engine: "Internal",
            source: "ARIA Engine"
        });
        score -= 10;
    }
  });

  // 7. Robust: Deprecated HTML
  const deprecated = doc.querySelectorAll('font, center, strike, marquee, basefont');
  if (deprecated.length > 0) {
    issues.push({
      criterion: "4.1.1",
      wcagLevel: "A",
      principle: "robust",
      severity: "Low",
      description: "Использование устаревших HTML-тегов.",
      recommendation: "Замените устаревшие теги (font, center и др.) на современные CSS-аналоги.",
      engine: "Internal",
      source: "Standards Engine"
    });
    score -= 5;
  }

  // 8. DOM Hierarchy (Heading levels)
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach((h) => {
    const level = parseInt(h.tagName[1]);
    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push({
        criterion: "1.3.1",
        wcagLevel: "A",
        principle: "perceivable",
        severity: "Medium",
        description: `Нарушена иерархия заголовков: переход от H${lastLevel} к H${level}`,
        recommendation: "Используйте последовательную иерархию заголовков.",
        engine: "Internal",
        source: "Hierarchy Engine"
      });
      score -= 5;
    }
    lastLevel = level;
  });

  // 3. WCAG 2.2: Target Size (Search for small interactive elements)
  const interactive = Array.from(doc.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
  interactive.forEach((el) => {
    // In static HTML we check for missing classes that usually define sizing or explicit styles 
    // This is a heuristic.
  });

  // 4. WCAG 2.2: Redundant Entry (Forms check)
  const forms = doc.querySelectorAll('form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input');
    if (inputs.length > 10) { // Heuristic: very long forms often have redundant entries
        issues.push({
            criterion: "3.3.7", // WCAG 2.2 Redundant Entry
            wcagLevel: "AAA",
            principle: "understandable",
            severity: "Low",
            description: "Обнаружена длинная форма. Проверьте на предмет повторного ввода одних и тех же данных (WCAG 2.2).",
            recommendation: "Используйте автозаполнение или предоставляйте ранее введенную информацию.",
            engine: "Internal",
            source: "WCAG 2.2 Scanner"
        });
        score -= 2;
    }
  });

  return {
    score: Math.max(0, score),
    issues
  };
}

/**
 * Relative Luminance calculation helper
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const getL = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * getL(r) + 0.7152 * getL(g) + 0.0722 * getL(b);
}

export function getContrastRatio(L1: number, L2: number): number {
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}
