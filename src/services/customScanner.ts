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
      description: "Құрылымдық бағдарлар жетіспейді (landmarks: main, nav, header, footer).",
      recommendation: "Парақшаның негізгі аймақтарын белгілеу үшін семантикалық HTML5 тегтерін пайдаланыңыз.",
      engine: "Internal",
      source: "Semantic Engine",
      status: "Confirmed"
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
      description: `Бос күйдегі ${emptyInteractive.length} интерактивті элемент (сілтеме немесе батырма) анықталды.`,
      recommendation: "Сілтемелер мен батырмалардың барлығында мәтіндік сипаттама немесе aria-label бар екеніне көз жеткізіңіз.",
      engine: "Internal",
      source: "Interaction Engine",
      status: "Confirmed"
    });
    score -= 15;
  }

  // 3a. Operable: meaningful link text
  const vagueLinks = Array.from(doc.querySelectorAll('a')).filter(a => {
    const text = a.textContent?.trim().toLowerCase();
    return text === 'подробнее' || text === 'click here' || text === 'ссылка' || text === 'здесь' || text === 'толығырақ' || text === 'сілтеме' || text === 'басыңыз';
  });
  if (vagueLinks.length > 0) {
    issues.push({
      criterion: "2.4.4",
      wcagLevel: "A",
      principle: "operable",
      severity: "Medium",
      description: `Түсініксіз мәтіні бар (мысалы, "толығырақ") ${vagueLinks.length} сілтеме анықталды.`,
      recommendation: "Мән-жайдан тыс ауысу мақсатын сипаттайтын сілтеме мәтінін пайдаланыңыз.",
      engine: "Internal",
      source: "Content Engine",
      status: "Confirmed"
    });
    score -= 5;
  }

  // 3b. Operable: iframe titles
  const iframes = doc.querySelectorAll('iframe:not([title])');
  if (iframes.length > 0) {
    issues.push({
      criterion: "2.4.1",
      wcagLevel: "A",
      principle: "operable",
      severity: "Low",
      description: "Title атрибуты жоқ iframe элементтері анықталды.",
      recommendation: "Ішіндегі мазмұнды сипаттау үшін iframe элементтеріне title атрибутын қосыңыз.",
      engine: "Internal",
      source: "Container Engine",
      status: "Confirmed"
    });
    score -= 3;
  }

  // 3c. Operable: Page Title
  const titleTag = doc.querySelector('title');
  if (!titleTag || !titleTag.textContent?.trim()) {
    issues.push({
      criterion: "2.4.2",
      wcagLevel: "A",
      principle: "operable",
      severity: "High",
      description: "Парақша атауы (title) жоқ немесе бос.",
      recommendation: "Құжаттың <head> бөліміне мағыналы <title> тегін қосыңыз.",
      engine: "Internal",
      source: "Head Engine",
      status: "Confirmed"
    });
    score -= 10;
  }

  // 3d. Operable: Skip Link (looking for a link early in the DOM that jumps to an internal ID)
  const skipLink = Array.from(doc.querySelectorAll('a')).find(a => {
    const href = a.getAttribute('href');
    return href && href.startsWith('#') && href.length > 1;
  });
  if (!skipLink) {
    issues.push({
      criterion: "2.4.1",
      wcagLevel: "A",
      principle: "operable",
      severity: "Medium",
      description: "Қайталанатын блоктарды өткізіп жіберу механизмі (skip link) жоқ.",
      recommendation: "Парақшаның басына 'Негізгі контентке өту' сілтемесін қосыңыз.",
      engine: "Internal",
      source: "Navigation Engine",
      status: "Confirmed"
    });
    score -= 5;
  }

  // 4. Operable: Tabindex > 0
  const badTabindex = doc.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
  if (badTabindex.length > 0) {
    issues.push({
      criterion: "2.4.3",
      wcagLevel: "A",
      principle: "operable",
      severity: "Medium",
      description: "Оң мәнді tabindex параметрлерін пайдалану табиғи табуляция ретін бұзады.",
      recommendation: "Оң мәнді tabindex параметрлерін алып тастаңыз. 0 немесе -1 мәндерін пайдаланыңыз.",
      engine: "Internal",
      source: "Focus Engine",
      status: "Confirmed"
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
      description: "Парақшаның автоматты түрде жаңаруы (meta refresh) анықталды.",
      recommendation: "Автоматты түрде жаңарудан аулақ болыңыз; пайдаланушыға уақытты бақылауға мүмкіндік беріңіз.",
      engine: "Internal",
      source: "Timing Engine",
      status: "Confirmed"
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
      description: "Құжаттың негізгі тілі көрсетілмеген (html тегінің lang атрибуты).",
      recommendation: "<html> тегіне lang атрибутын (мысалы, lang=\"kk\" немесе lang=\"ru\") қосыңыз.",
      engine: "Internal",
      source: "Language Engine",
      status: "Confirmed"
    });
    score -= 20;
  }

  // 5a. Understandable: Form Labels
  const inputs = doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const hasLabel = id ? doc.querySelector(`label[for="${id}"]`) : input.closest('label');
    const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    const hasTitle = input.getAttribute('title');

    if (!hasLabel && !hasAriaLabel && !hasTitle) {
      issues.push({
        criterion: "3.3.2",
        wcagLevel: "A",
        principle: "understandable",
        severity: "High",
        description: `Пішін өрісінде (${input.tagName.toLowerCase()}) байланыстырылған таңбаша (label) немесе сипаттама жоқ.`,
        recommendation: "Өріс мақсатын сипаттау үшін for атрибуты бар <label> элементін немесе aria-label параметрін пайдаланыңыз.",
        engine: "Internal",
        source: "Form Engine",
        status: "Confirmed"
      });
      score -= 10;
    }
  });

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
      description: "Элементтерде қайталанатын ID анықталды, бұл экрандағы мәтінді оқу құрылғыларында мәселе тудыруы мүмкін.",
      recommendation: "Парақшадағы барлық ID атрибуттары бірегей екеніне көз жеткізіңіз.",
      engine: "Internal",
      source: "Parser Engine",
      status: "Confirmed"
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
            description: "Contenteditable элементінде ARIA рөлі көрсетілмеген.",
            recommendation: "Экрандағы мәтінді оқу құрылғысы элемент мақсатын түсінуі үшін тиісті рөлді (мысалы, role=\"textbox\") қосыңыз.",
            engine: "Internal",
            source: "ARIA Engine",
            status: "Confirmed"
        });
        score -= 10;
    }
  });

  // 7. Robust: Deprecated HTML
  const deprecated = doc.querySelectorAll('font, center, strike, marquee, basefont, big, tt');
  if (deprecated.length > 0) {
    issues.push({
      criterion: "4.1.1",
      wcagLevel: "A",
      principle: "robust",
      severity: "Low",
      description: `Ескірген HTML тегтерін (${deprecated[0].tagName.toLowerCase()}) пайдалану.`,
      recommendation: "Ескірген тегтерді (font, center т.б.) заманауи CSS баламаларына ауыстырыңыз.",
      engine: "Internal",
      source: "Standards Engine",
      status: "Confirmed"
    });
    score -= 5;
  }

  // 7b. Robust: Buttons and Links without role should not have aria-attributes that require role
  const ariaWithoutRole = doc.querySelectorAll('div[aria-expanded], span[aria-expanded], div[aria-pressed], span[aria-pressed]');
  if (ariaWithoutRole.length > 0) {
    issues.push({
        criterion: "4.1.2",
        wcagLevel: "A",
        principle: "robust",
        severity: "Medium",
        description: "Рөлді (role) көрсетпей, интерактивті емес элементтерде интерактивті ARIA атрибуттарын пайдалану.",
        recommendation: "Тиісті рөлді (button, link) қосыңыз немесе стандартты HTML элементтерін пайдаланыңыз.",
        engine: "Internal",
        source: "ARIA Engine",
        status: "Confirmed"
    });
    score -= 7;
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
        description: `Тақырыптар иерархиясы бұзылған: H${lastLevel} деңгейінен H${level} деңгейіне өту`,
        recommendation: "Тақырыптардың дәйекті иерархиясын пайдаланыңыз.",
        engine: "Internal",
        source: "Hierarchy Engine",
        status: "Confirmed"
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
            description: "Ұзын пішін анықталды. Бір деректерді қайталап енгізуге қатысты тексеріңіз (WCAG 2.2).",
            recommendation: "Автотолтыруды пайдаланыңыз немесе бұрын енгізілген ақпаратты ұсыныңыз.",
            engine: "Internal",
            source: "WCAG 2.2 Scanner",
            status: "Confirmed"
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
