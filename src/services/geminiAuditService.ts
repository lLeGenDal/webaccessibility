import { GoogleGenAI, Type } from "@google/genai";
import { Issue } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
}

export async function runAISemanticAudit(
  siteUrl: string,
  html: string,
  technicalIssues: Issue[]
): Promise<AIAnalysisResult> {
  // Extract key semantic elements for AI to evaluate
  const scriptMatch = html.match(/<img[^>]*alt=["']([^"']*)["'][^>]*>/g) || [];
  const altTexts = scriptMatch.slice(0, 15).join("\n"); // Sample 15 images
  
  const labelMatch = html.match(/<label[^>]*>([\s\S]*?)<\/label>/g) || [];
  const labels = labelMatch.slice(0, 10).join("\n");

  const prompt = `
    Website: ${siteUrl}
    
    You are an expert accessibility auditor. Evaluate the SEMANTIC quality of the following elements.
    Automated tools can check for the PRESENCE of attributes, but only you can check their MEANINGFULNESS.
    
    ALT TEXTS:
    ${altTexts}
    
    LABELS:
    ${labels}
    
    EXISTING TECHNICAL ISSUES:
    ${technicalIssues.map(i => i.description).join("\n")}

    TASKS:
    1. Score 'semanticAltQuality' (0-100): Are alt texts descriptive or generic like "image1", "logo"?
    2. Score 'labelClarity' (0-100): Do labels clearly describe input purpose?
    3. Score 'navigationLogic' (0-100): Based on technical issues, how logical is the flow?
    4. Provide 'aiScore' (Weighted average of the above).
    5. Generate 'recommendations' in Kazakh and Russian for fixing semantic (meaning) issues.
    6. Generate a list of 'issues' (Partial<Issue>[]) for specific semantic or contrast problems found.
       For contrast issues, look for potentially problematic color pairs mentioned in labels or CSS-like text.
       Each issue MUST have: description, criterion (WCAG string), wcagLevel (A/AA/AAA), severity (Critical/High/Medium/Low), recommendation, engine ("AI" or "Contrast").
    
    Return JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiScore: { type: Type.NUMBER },
            semanticAltQuality: { type: Type.NUMBER },
            labelClarity: { type: Type.NUMBER },
            navigationLogic: { type: Type.NUMBER },
            recommendations: {
              type: Type.OBJECT,
              properties: {
                kz: { type: Type.STRING },
                ru: { type: Type.STRING }
              },
              required: ["kz", "ru"]
            },
            summary: { type: Type.STRING },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  criterion: { type: Type.STRING },
                  wcagLevel: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  engine: { type: Type.STRING }
                },
                required: ["description", "criterion", "wcagLevel", "severity", "recommendation", "engine"]
              }
            }
          },
          required: ["aiScore", "semanticAltQuality", "labelClarity", "navigationLogic", "recommendations", "summary", "issues"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
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
      issues: []
    };
  }
}

export async function suggestOfficialUrl(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 3) return null;

  const prompt = `
    Find the official website URL for the organization in Kazakhstan: "${orgName}".
    Return only the URL. If you are not sure, try to find the most probable official one (.kz, .gov.kz, .edu.kz etc).
    If absolutely unknown, return "null".
    Reply ONLY with the URL string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const url = response.text.trim();
    if (url.toLowerCase() === "null" || !url.startsWith("http")) {
      return null;
    }
    return url;
  } catch (error) {
    console.error("Gemini URL suggestion error:", error);
    return null;
  }
}

export async function suggestOrgRegion(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 3) return null;

  const prompt = `
    Determine the primary region (oblast or city) in Kazakhstan where the organization "${orgName}" is located.
    Choose ONLY from this exact list:
    Абайская область, Акмолинская область, Актюбинская область, Алматинская область, Атырауская область, 
    Западно-Казахстанская область, Жамбылская область, Жетысуская область, Карагандинская область, 
    Костанайская область, Кызылординская область, Мангистауская область, Павлодарская область, 
    Северо-Казахстанская область, Туркестанская область, Улытауская область, Восточно-Казахстанская область, 
    г. Астана, г. Алматы, г. Шымкент.

    Return ONLY the name from the list. If unknown, return "null".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const region = response.text.trim();
    if (region.toLowerCase() === "null") return null;
    return region;
  } catch (error) {
    console.error("Gemini context suggestion error:", error);
    return null;
  }
}

export async function suggestOfficialName(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 2) return null;

  const prompt = `
    You are an expert on Kazakhstan organizations.
    User entered an abbreviation or partial name: "${orgName}".
    Find the FULL OFFICIAL name of this organization in Russian (e.g., "КАСУ" -> "Казахстанско-Американский свободный университет").
    If it is already a full name or you are not sure, return the original input.
    Reply ONLY with the full name string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const fullName = response.text.trim();
    return fullName || orgName;
  } catch (error) {
    console.error("Gemini name suggestion error:", error);
    return orgName;
  }
}

export async function suggestOrgCategory(orgName: string): Promise<string | null> {
  if (!orgName || orgName.trim().length < 2) return null;

  const prompt = `
    Based on the name "${orgName}", categorize this organization in Kazakhstan.
    Choose ONLY from this exact list:
    University, Company, Government, Healthcare, Finance, Non-Profit.

    Examples:
    - "Kaspi" -> "Finance"
    - "IITU" -> "University"
    - "Halyk Bank" -> "Finance"
    - "KazMunayGas" -> "Company"
    - "Министерство" -> "Government"
    - "Больница" -> "Healthcare"

    Return ONLY the category name. If unknown, return "Company" as default.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const category = response.text.trim();
    return category;
  } catch (error) {
    console.error("Gemini category suggestion error:", error);
    return "Company";
  }
}
