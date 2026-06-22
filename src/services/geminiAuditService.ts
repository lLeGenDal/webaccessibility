import { Issue } from "../types";
import { normalizeToKzRegion } from "../constants";

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
    "Content-Type": "application/json",
    "x-ai-provider": localStorage.getItem("ai_provider") || "gemini"
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

interface OrgPreset {
  aliases: string[];
  fullName: string;
  url: string;
  region: string;
  category: "University" | "Company" | "Government" | "Healthcare" | "Finance" | "Non-Profit";
}

const ORG_PRESETS: OrgPreset[] = [
  {
    aliases: ["nu", "ну", "назарбаев", "nazarbayev"],
    fullName: "Назарбаев Университеті (Nazarbayev University)",
    url: "https://nu.edu.kz",
    region: "Астана қ.",
    category: "University"
  },
  {
    aliases: ["aitu", "аиту", "astana it", "астана ит"],
    fullName: "Astana IT University",
    url: "https://astanait.edu.kz",
    region: "Астана қ.",
    category: "University"
  },
  {
    aliases: ["kbtu", "кбту", "британ"],
    fullName: "Казахстанско-Британский технический университет (КБТУ)",
    url: "https://kbtu.edu.kz",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["iitu", "муит", "ит университет"],
    fullName: "Международный университет информационных технологий (МУИТ)",
    url: "https://iitu.edu.kz",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["kaznu", "казну", "фараби"],
    fullName: "Казахский национальный университет имени аль-Фараби (КазНУ)",
    url: "https://kaznu.kz",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["enu", "ену", "гумилев"],
    fullName: "Евразийский национальный университет имени Л.Н. Гумилева (ЕНУ)",
    url: "https://enu.kz",
    region: "Астана қ.",
    category: "University"
  },
  {
    aliases: ["sdu", "сду", "демирел"],
    fullName: "Университет Сулеймана Демиреля (СДУ)",
    url: "https://sdu.edu.kz",
    region: "Алматы облысы",
    category: "University"
  },
  {
    aliases: ["satbayev", "сатпаев", "казниту", "политех"],
    fullName: "Satbayev University (КазНИТУ им. К. Сатпаева)",
    url: "https://satbayev.university",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["kimep", "кимеп"],
    fullName: "Университет КИМЕП (KIMEP University)",
    url: "https://kimep.kz",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["narxoz", "нархоз"],
    fullName: "Университет Нархоз (Narxoz University)",
    url: "https://narxoz.edu.kz",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["almau", "алмау", "маб", "management university"],
    fullName: "Almaty Management University (AlmaU)",
    url: "https://almau.edu.kz",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["kazatu", "сейфуллин", "сейфуллина", "агро", "seifullin"],
    fullName: "Казахский агротехнический исследовательский университет им. С. Сейфуллина",
    url: "https://kazatu.edu.kz",
    region: "Астана қ.",
    category: "University"
  },
  {
    aliases: ["муа", "amu", "астана мед", "медицинский университет астана"],
    fullName: "Медицинский университет Астана (МУА)",
    url: "https://amu.edu.kz",
    region: "Астана қ.",
    category: "University"
  },
  {
    aliases: ["casu", "касу", "американский", "kafu", "кафу", "kasu", "kacu", "kazu", "касувко", "кафувко", "kauf", "кауф", "өскемен", "усть-каменогорск"],
    fullName: "Казахстанско-Американский свободный университет (КАСУ)",
    url: "https://casu.edu.kz",
    region: "Шығыс Қазақстан облысы",
    category: "University"
  },
  {
    aliases: ["aues", "ауэс", "энергетик"],
    fullName: "Алматинский университет энергетики и связи (АУЭС)",
    url: "https://aues.edu.kz",
    region: "Алматы қ.",
    category: "University"
  },
  {
    aliases: ["kaspi", "каспи"],
    fullName: "АО Kaspi Bank",
    url: "https://kaspi.kz",
    region: "Алматы қ.",
    category: "Finance"
  },
  {
    aliases: ["halyk", "халык", "народный"],
    fullName: "АО Народный Банк Казахстана (Halyk Bank)",
    url: "https://halykbank.kz",
    region: "Алматы қ.",
    category: "Finance"
  },
  {
    aliases: ["jusan", "жусан"],
    fullName: "АО Jusan Bank",
    url: "https://jusan.kz",
    region: "Алматы қ.",
    category: "Finance"
  },
  {
    aliases: ["forte", "форте"],
    fullName: "АО ForteBank",
    url: "https://fortebank.kz",
    region: "Астана қ.",
    category: "Finance"
  },
  {
    aliases: ["bcc", "центркредит", "цк"],
    fullName: "АО Банк ЦентрКредит (BCC)",
    url: "https://bcc.kz",
    region: "Алматы қ.",
    category: "Finance"
  },
  {
    aliases: ["екб", "eub", "евразийский банк"],
    fullName: "АО Евразийский банк",
    url: "https://eubank.kz",
    region: "Алматы қ.",
    category: "Finance"
  },
  {
    aliases: ["акимат алматы", "almaty akimat"],
    fullName: "Акимат города Алматы",
    url: "https://almaty.gov.kz",
    region: "Алматы қ.",
    category: "Government"
  },
  {
    aliases: ["акимат астаны", "astana akimat"],
    fullName: "Акимат города Астана",
    url: "https://astana.gov.kz",
    region: "Астана қ.",
    category: "Government"
  },
  {
    aliases: ["акимат шымкента", "shymkent akimat"],
    fullName: "Акимат города Шымкент",
    url: "https://shymkent.gov.kz",
    region: "Шымкент қ.",
    category: "Government"
  },
  {
    aliases: ["egov", "егов", "цон", "электронное правительство"],
    fullName: "Портал электронного правительства Республики Казахстан (eGov)",
    url: "https://egov.kz",
    region: "Астана қ.",
    category: "Government"
  },
  {
    aliases: ["казпочта", "kazpost"],
    fullName: "АО Казпочта",
    url: "https://kazpost.kz",
    region: "Астана қ.",
    category: "Company"
  }
];

const transliteCyrillic = (txt: string): string => {
  const cyrToLat: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'ә': 'ae', 'ғ': 'g', 'қ': 'q', 'ң': 'n', 'ө': 'o', 'ұ': 'u', 'ү': 'u', 'һ': 'h', 'і': 'i'
  };
  return txt.replace(/[а-яА-ЯёЁәӘғҒқҚңҢөӨұҰүҮіІһҺ]/g, (char) => {
    return cyrToLat[char.toLowerCase()] || '';
  });
};

const findPreset = (orgName: string): OrgPreset | null => {
  const name = orgName.toLowerCase().trim();
  if (name.length < 2) return null;

  // Standardize common lookalikes (homoglyphs) to Latin
  const homoglyphReplacer = (s: string) => {
    return s
      .replace(/с/g, "s")   // Cyrillic 'с' to 's'
      .replace(/c/g, "s")   // Latin 'c' to 's'
      .replace(/к/g, "k")   // Cyrillic 'к' to 'k'
      .replace(/а/g, "a")   // Cyrillic 'а' to 'a'
      .replace(/у/g, "u")   // Cyrillic 'у' to 'u'
      .replace(/ф/g, "f")   // Cyrillic 'ф' to 'f'
      .replace(/е/g, "e")   // Cyrillic 'е' to 'e'
      .replace(/о/g, "o")   // Cyrillic 'о' to 'o'
      .replace(/р/g, "r")   // Cyrillic 'р' to 'r'
      .replace(/и/g, "i")   // Cyrillic 'и' to 'i'
      .replace(/і/g, "i")   // Cyrillic 'і' to 'i'
      .replace(/[^a-z0-9]/g, ""); // strip non-alphas
  };

  const normalizedInput = homoglyphReplacer(name);
  const normalizedInputTranslit = homoglyphReplacer(transliteCyrillic(name));

  // 1. Check exact matches on normalized forms
  for (const preset of ORG_PRESETS) {
    for (const alias of preset.aliases) {
      const normAlias = homoglyphReplacer(alias);
      if (normAlias === normalizedInput || normAlias === normalizedInputTranslit || normAlias === name) {
        return preset;
      }
    }
  }

  // 2. Fallback to contains-checks on normalized forms for multi-word queries like "Касу усть-каменогорск"
  for (const preset of ORG_PRESETS) {
    for (const alias of preset.aliases) {
      const normAlias = homoglyphReplacer(alias);
      if (
        normAlias.length >= 2 && 
        (normalizedInput.includes(normAlias) || 
         normalizedInputTranslit.includes(normAlias) || 
         normAlias.includes(normalizedInput))
      ) {
        return preset;
      }
    }
  }

  return null;
};

const fallbackSuggestUrl = (orgName: string): string => {
  const preset = findPreset(orgName);
  if (preset) return preset.url;

  const name = orgName.toLowerCase().trim();
  const slug = transliteCyrillic(orgName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 15);

  if (slug.length >= 2) {
    if (name.includes("университет") || name.includes("колледж") || name.includes("school") || name.includes("академ") || name.includes("институт")) {
      return `https://${slug}.edu.kz`;
    }
    if (name.includes("министр") || name.includes("департамент") || name.includes("комитет") || name.includes("управление") || name.includes("акимат")) {
      return `https://${slug}.gov.kz`;
    }
    return `https://${slug}.kz`;
  }
  return "https://google.kz";
};

const fallbackSuggestRegion = (orgName: string): string => {
  const preset = findPreset(orgName);
  if (preset) return preset.region;

  const name = orgName.toLowerCase().trim();
  if (name.includes("алматы қ") || name.includes("алматы г") || name.includes("алматы сі") || name.includes("алматы сити")) return "Алматы қ.";
  if (name.includes("астана қ") || name.includes("астана г") || name.includes("астана сі") || name.includes("астана сити") || name.includes("нур-султан")) return "Астана қ.";
  if (name.includes("шымкент қ") || name.includes("шымкент г") || name.includes("шымкент сі") || name.includes("шымкент сити")) return "Шымкент қ.";

  if (name.includes("абай") || name.includes("семей")) return "Абай облысы";
  if (name.includes("ақмола") || name.includes("акмола") || name.includes("кокшетау") || name.includes("көкшетау")) return "Ақмола облысы";
  if (name.includes("ақтөбе") || name.includes("актобе") || name.includes("aktobe")) return "Ақтөбе облысы";
  if (name.includes("талғар") || name.includes("талгар") || name.includes("қаскелең") || name.includes("каскелен") || name.includes("алматы обл") || name.includes("илийск") || name.includes("гвардейск")) return "Алматы облысы";
  if (name.includes("атырау") || name.includes("atyrau")) return "Атырау облысы";
  if (name.includes("батыс қазақстан") || name.includes("западно-казахстан") || name.includes("орал") || name.includes("уральск") || name.includes("зко") || name.includes("wko")) return "Батыс Қазақстан облысы";
  if (name.includes("жамбыл") || name.includes("тараз") || name.includes("taraz")) return "Жамбыл облысы";
  if (name.includes("жетісу") || name.includes("жетысу") || name.includes("талдықорған") || name.includes("талдыкорган")) return "Жетісу облысы";
  if (name.includes("қарағанды") || name.includes("караганда") || name.includes("karaganda")) return "Қарағанды облысы";
  if (name.includes("қостанай") || name.includes("костанай") || name.includes("kostanay")) return "Қостанай облысы";
  if (name.includes("қызылорда") || name.includes("кызылорда") || name.includes("kyzylorda")) return "Қызылорда облысы";
  if (name.includes("маңғыстау") || name.includes("мангистау") || name.includes("актау") || name.includes("ақтау")) return "Маңғыстау облысы";
  if (name.includes("павлодар") || name.includes("pavlodar")) return "Павлодар облысы";
  if (name.includes("солтүстік қазақстан") || name.includes("северо-казахстан") || name.includes("петропавл") || name.includes("ско") || name.includes("sko")) return "Солтүстік Қазақстан облысы";
  if (name.includes("түркістан") || name.includes("туркестан") || name.includes("turkestan")) return "Түркістан облысы";
  if (name.includes("ұлытау") || name.includes("улытау") || name.includes("жезқазған") || name.includes("жезказган")) return "Ұлытау облысы";
  if (name.includes("шығыс қазақстан") || name.includes("восточно-казахстан") || name.includes("өскемен") || name.includes("усть-каменогорск") || name.includes("вко") || name.includes("eko")) return "Шығыс Қазақстан облысы";

  if (name.includes("алматы") || name.includes("almaty")) return "Алматы қ.";
  if (name.includes("астана") || name.includes("astana")) return "Астана қ.";
  if (name.includes("шымкент") || name.includes("shymkent")) return "Шымкент қ.";

  return "Алматы қ.";
};

const fallbackSuggestName = (orgName: string): string => {
  const preset = findPreset(orgName);
  if (preset) return preset.fullName;
  return orgName.charAt(0).toUpperCase() + orgName.slice(1);
};

const fallbackSuggestCategory = (orgName: string): string => {
  const preset = findPreset(orgName);
  if (preset) return preset.category;

  const name = orgName.toLowerCase().trim();
  if (
    name.includes("университет") || name.includes("университеті") || name.includes("university") ||
    name.includes("институт") || name.includes("академия") || name.includes("колледж") ||
    name.includes("school") || name.includes("iitu") || name.includes("муит") ||
    name.includes("казну") || name.includes("ену") || name.includes("кбту") ||
    name.includes("касу") || name.includes("ауэс")
  ) {
    return "University";
  }
  if (
    name.includes("министерство") || name.includes("департамент") || name.includes("акимат") ||
    name.includes("управление") || name.includes("комитет") || name.includes("прокуратура") ||
    name.includes("мчс") || name.includes("мвд")
  ) {
    return "Government";
  }
  if (
    name.includes("банк") || name.includes("финанс") || name.includes("kaspi") ||
    name.includes("halyk") || name.includes("инвест") || name.includes("кредит") ||
    name.includes("bank") || name.includes("jusan")
  ) {
    return "Finance";
  }
  if (
    name.includes("больница") || name.includes("клиника") || name.includes("емхана") ||
    name.includes("госпиталь") || name.includes("стоматология") || name.includes("медицинский") ||
    name.includes("санаторий") || name.includes("шипажай")
  ) {
    return "Healthcare";
  }
  if (
    name.includes("фонд") || name.includes("оф ") || name.includes("қоғамдық қор") ||
    name.includes("ассоциация") || name.includes("волонтер") || name.includes("союз")
  ) {
    return "Non-Profit";
  }
  return "Company";
};

export async function suggestOfficialUrl(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 2) return null;

  const preset = findPreset(orgName);
  if (preset) return preset.url;

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
  if (!orgName || orgName.trim().length < 2) return null;

  const preset = findPreset(orgName);
  if (preset) return preset.region;

  try {
    const res = await fetch("/api/gemini/suggest-region", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ orgName })
    });
    if (!res.ok) throw new Error("Suggest region fetch failed");
    const data = await res.json();
    return data.region ? normalizeToKzRegion(data.region) : fallbackSuggestRegion(orgName);
  } catch (error) {
    console.warn("Gemini context suggestion client error, falling back locally:", error);
    return fallbackSuggestRegion(orgName);
  }
}

export async function suggestOfficialName(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 2) return null;

  const preset = findPreset(orgName);
  if (preset) return preset.fullName;

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

  const preset = findPreset(orgName);
  if (preset) return preset.category;

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
