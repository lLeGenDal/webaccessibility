export type KZRegion = 
  | "Абайская область" | "Акмолинская область" | "Актюбинская область" 
  | "Алматинская область" | "Атырауская область" | "Западно-Казахстанская область" 
  | "Жамбылская область" | "Область Жетісу" | "Карагандинская область" 
  | "Костанайская область" | "Кызылординская область" | "Мангистауская область" 
  | "Павлодарская область" | "Северо-Казахстанская область" | "Туркестанская область" 
  | "Область Ұлытау" | "Восточно-Казахстанская область" 
  | "г. Астана" | "г. Алматы" | "г. Шымкент"
  | "Абай облысы" | "Ақмола облысы" | "Ақтөбе облысы" 
  | "Алматы облысы" | "Атырау облысы" | "Батыс Қазақстан облысы" 
  | "Жамбыл облысы" | "Жетісу облысы" | "Қарағанды облысы" 
  | "Қостанай облысы" | "Қызылорда облысы" | "Маңғыстау облысы" 
  | "Павлодар облысы" | "Солтүстік Қазақстан облысы" | "Түркістан облысы" 
  | "Ұлытау облысы" | "Шығыс Қазақстан облысы" 
  | "Астана қ." | "Алматы қ." | "Шымкент қ.";

export type SiteCategory = 
  | "University" 
  | "Company" 
  | "Government" 
  | "Healthcare" 
  | "Finance" 
  | "Non-Profit";

export interface Site {
  id: string;
  name: string;
  url: string;
  category: SiteCategory;
  region: KZRegion;
  createdAt: string;
  ownerId: string;
  lastItaIndex?: number;
  lastInternalScore?: number;
}

export interface POURScores {
  perceivable: number;
  operable: number;
  understandable: number;
  robust: number;
}

export type MaturityLevel = "Inactive" | "Initial" | "Defined" | "Integrated" | "Optimized";

export type WCAGLevel = "A" | "AA" | "AAA";

export interface Audit {
  id: string;
  siteId: string;
  date: string;
  
  // Independent Scoring Layers
  internalScore: number; // Our custom proprietary engine (0-100)
  axeScore: number;      // Clean Axe-Core technical score (0-100)
  aiScore: number;       // Gemini semantic/visual qualitative score (0-100)
  lighthouseScore: number; // Simulated Lighthouse accessibility score (0-100)
  contrastScore: number;  // Multi-factor contrast score
  
  itaIndex: number;      // Normalized 1-5 index based on WCAG weights
  maturityLevel: MaturityLevel;
  pourScores: POURScores;
  
  manualReviewCompleted: boolean;
  region: KZRegion;
  
  wcagBreakdown: {
    A: number;
    AA: number;
    AAA: number;
  };
  
  aiInsights?: {
    semanticAltQuality: number; // 0-100
    labelClarity: number;      // 0-100
    navigationLogic: number;   // 0-100
    recommendations: {
      kz: string;
      ru: string;
    };
  };
  
  strategicReview?: string;
  summary: string;
  wcagVersion: "2.2";
  ownerId: string;
}

export interface Issue {
  id: string;
  auditId: string;
  criterion: string; // e.g., "1.1.1"
  wcagLevel: WCAGLevel;
  principle: keyof POURScores;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  recommendation: string;
  element?: string;
  engine: "Internal" | "Axe" | "AI" | "Manual" | "Lighthouse";
  status: "Pending" | "Confirmed" | "Rejected";
  source: string;
  comment?: string;
  helpUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
}
