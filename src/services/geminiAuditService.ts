import { Issue } from "../types";

export interface AIAnalysisResult {
  aiScore: number;
  semanticAltQuality: number;
  labelClarity: number;
  navigationLogic: number;
  recommendations: {
    kz: string;
    ru: string;
  };
  summary: string;
  issues: Partial<Issue>[];
  strategicReview?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: any = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Stage 1: Preliminary Structural Risk Assessment
 */
export async function runAIPreAudit(html: string): Promise<string> {
  try {
    const res = await fetch("/api/gemini/pre-audit", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ html })
    });
    if (!res.ok) throw new Error("Pre-audit fetch failed");
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error("runAIPreAudit error:", err);
    return "Initial structural scan completed.";
  }
}

/**
 * Stage 2: Main Semantic & Strategic Audit
 */
export async function runAISemanticAudit(
  siteUrl: string,
  html: string,
  technicalIssues: Issue[]
): Promise<AIAnalysisResult> {
  try {
    const res = await fetch("/api/gemini/semantic-audit", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ siteUrl, html, technicalIssues })
    });
    if (!res.ok) throw new Error("Semantic audit fetch failed");
    return await res.json();
  } catch (error) {
    console.error("Gemini semantic analysis error:", error);
    return {
      aiScore: 60,
      semanticAltQuality: 50,
      labelClarity: 50,
      navigationLogic: 50,
      recommendations: {
        kz: "AI талдауы уақытша қолжетімді емес.",
        ru: "AI анализ временно недоступен."
      },
      summary: "AI semantic audit encountered an error.",
      strategicReview: "Strategic failure during neural processing.",
      issues: []
    };
  }
}

/**
 * Stage 3: Final Synthesis
 */
export async function runAIFinalSynthesis(
  audit: any,
  issues: Issue[]
): Promise<string> {
  try {
    const res = await fetch("/api/gemini/final-synthesis", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ audit, issues })
    });
    if (!res.ok) throw new Error("Final synthesis fetch failed");
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error("runAIFinalSynthesis error:", err);
    return audit.summary;
  }
}

const fallbackSuggestUrl = (orgName: string): string => {
  const name = orgName.toLowerCase().trim();
  if (name.includes("kaznu") || name.includes("казну")) return "https://kaznu.kz";
  if (name.includes("enu") || name.includes("ену")) return "https://enu.kz";
  if (name.includes("iitu") || name.includes("муит")) return "https://iitu.edu.kz";
  if (name.includes("kbtu") || name.includes("кбту")) return "https://kbtu.edu.kz";
  if (name.includes("casu") || name.includes("касу")) return "https://casu.edu.kz";
  if (name.includes("aues") || name.includes("ауэс")) return "https://aues.edu.kz";
  if (name.includes("kaspi") || name.includes("каспи")) return "https://kaspi.kz";
  if (name.includes("halyk") || name.includes("халык")) return "https://halykbank.kz";
  if (name.includes("eub") || name.includes("евразийский банк")) return "https://eubank.kz";
  if (name.includes("jusan") || name.includes("жусан")) return "https://jusan.kz";
  return "https://" + orgName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".kz";
};

const fallbackSuggestRegion = (orgName: string): string => {
  const name = orgName.toLowerCase().trim();
  if (name.includes("алматы") || name.includes("almaty")) return "г. Алматы";
  if (name.includes("астана") || name.includes("astana") || name.includes("нур-султан") || name.includes("nursultan")) return "г. Астана";
  if (name.includes("шымкент") || name.includes("shymkent")) return "г. Шымкент";
  if (name.includes("караганд") || name.includes("karagand") || name.includes("қарағанды")) return "Карагандинская область";
  if (name.includes("актобе") || name.includes("aktobe") || name.includes("ақтөбе")) return "Актюбинская область";
  if (name.includes("павлодар") || name.includes("pavlodar")) return "Павлодарская область";
  if (name.includes("атырау") || name.includes("atyrau")) return "Атырауская область";
  return "г. Алматы";
};

const fallbackSuggestName = (orgName: string): string => {
  const name = orgName.toUpperCase().trim();
  const pairs: Record<string, string> = {
    "КАЗНУ": "Казахский национальный университет имени аль-Фараби",
    "ЕНУ": "Евразийский национальный университет имени Л. Н. Гумилева",
    "МУИТ": "Международный университет информационных технологий",
    "IITU": "Международный университет информационных технологий",
    "КБТУ": "Казахстанско-Британский технический университет",
    "КАСУ": "Казахстанско-Американский свободный университет",
    "АУЭС": "Алматинский университет энергетики и связи",
  };
  return pairs[name] || (orgName.charAt(0).toUpperCase() + orgName.slice(1));
};

const fallbackSuggestCategory = (orgName: string): string => {
  const name = orgName.toLowerCase().trim();
  if (
    name.includes("университет") || name.includes("университеті") || name.includes("university") ||
    name.includes("институт") || name.includes("академия") || name.includes("колледж") ||
    name.includes("iitu") || name.includes("муит") || name.includes("казну")
  ) {
    return "University";
  }
  if (name.includes("министерство") || name.includes("департамент") || name.includes("акимат") || name.includes("управление")) {
    return "Government";
  }
  if (name.includes("банк") || name.includes("финанс") || name.includes("kaspi") || name.includes("halyk")) {
    return "Finance";
  }
  if (name.includes("больница") || name.includes("клиника") || name.includes("емхана") || name.includes("госпиталь")) {
    return "Healthcare";
  }
  return "Company";
};

export async function suggestOfficialUrl(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 3) return null;

  try {
    const res = await fetch("/api/gemini/suggest-url", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ orgName })
    });
    if (!res.ok) throw new Error("Suggest URL fetch failed");
    const data = await res.json();
    return data.url || fallbackSuggestUrl(orgName);
  } catch (error) {
    console.warn("Gemini URL suggestion client error, falling back locally:", error);
    return fallbackSuggestUrl(orgName);
  }
}

export async function suggestOrgRegion(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 3) return null;

  try {
    const res = await fetch("/api/gemini/suggest-region", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ orgName })
    });
    if (!res.ok) throw new Error("Suggest region fetch failed");
    const data = await res.json();
    return data.region || fallbackSuggestRegion(orgName);
  } catch (error) {
    console.warn("Gemini context suggestion client error, falling back locally:", error);
    return fallbackSuggestRegion(orgName);
  }
}

export async function suggestOfficialName(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 2) return null;

  try {
    const res = await fetch("/api/gemini/suggest-name", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ orgName })
    });
    if (!res.ok) throw new Error("Suggest name fetch failed");
    const data = await res.json();
    return data.fullName || fallbackSuggestName(orgName);
  } catch (error) {
    console.warn("Gemini name suggestion client error, falling back locally:", error);
    return fallbackSuggestName(orgName);
  }
}

export async function suggestOrgCategory(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 2) return null;

  try {
    const res = await fetch("/api/gemini/suggest-category", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ orgName })
    });
    if (!res.ok) throw new Error("Suggest category fetch failed");
    const data = await res.json();
    return data.category || fallbackSuggestCategory(orgName);
  } catch (error) {
    console.warn("Gemini category suggestion client error, falling back locally:", error);
    return fallbackSuggestCategory(orgName);
  }
}
