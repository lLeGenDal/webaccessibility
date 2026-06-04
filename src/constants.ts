export const KAZAKHSTAN_REGIONS = [
  "Абай облысы",
  "Ақмола облысы",
  "Ақтөбе облысы",
  "Алматы облысы",
  "Атырау облысы",
  "Батыс Қазақстан облысы",
  "Жамбыл облысы",
  "Жетісу облысы",
  "Қарағанды облысы",
  "Қостанай облысы",
  "Қызылорда облысы",
  "Маңғыстау облысы",
  "Павлодар облысы",
  "Солтүстік Қазақстан облысы",
  "Түркістан облысы",
  "Ұлытау облысы",
  "Шығыс Қазақстан облысы",
  "Астана қ.",
  "Алматы қ.",
  "Шымкент қ."
];

export const REGION_MAP_RU_TO_KK: Record<string, string> = {
  "Абайская область": "Абай облысы",
  "Акмолинская область": "Ақмола облысы",
  "Актюбинская область": "Ақтөбе облысы",
  "Алматинская область": "Алматы облысы",
  "Атырауская область": "Атырау облысы",
  "Западно-Казахстанская область": "Батыс Қазақстан облысы",
  "Жамбылская область": "Жамбыл облысы",
  "Область Жетісу": "Жетісу облысы",
  "Жетысуская область": "Жетісу облысы",
  "Карагандинская область": "Қарағанды облысы",
  "Костанайская область": "Қостанай облысы",
  "Кызылординская область": "Қызылорда облысы",
  "Мангистауская область": "Маңғыстау облысы",
  "Павлодарская область": "Павлодар облысы",
  "Северо-Казахстанская область": "Солтүстік Қазақстан облысы",
  "Туркестанская область": "Түркістан облысы",
  "Область Ұлытау": "Ұлытау облысы",
  "Улытауская область": "Ұлытау облысы",
  "Восточно-Казахстанская область": "Шығыс Қазақстан облысы",
  "г. Астана": "Астана қ.",
  "г. Алматы": "Алматы қ.",
  "г. Шымкент": "Шымкент қ.",
  "Астана": "Астана қ.",
  "Алматы": "Алматы қ.",
  "Шымкент": "Шымкент қ."
};

export const normalizeToKzRegion = (regionStr: string): string => {
  if (!regionStr) return "Алматы қ.";
  const trimmed = regionStr.trim();
  if (REGION_MAP_RU_TO_KK[trimmed]) {
    return REGION_MAP_RU_TO_KK[trimmed];
  }
  
  // Case-insensitive exact match
  const lower = trimmed.toLowerCase();
  for (const [ru, kk] of Object.entries(REGION_MAP_RU_TO_KK)) {
    if (ru.toLowerCase() === lower || kk.toLowerCase() === lower) {
      return kk;
    }
  }

  // Substring fallback checks
  if (lower.includes("астана") || lower.includes("astana")) return "Астана қ.";
  if (lower.includes("алматы") || lower.includes("almaty")) return "Алматы қ.";
  if (lower.includes("шымкент") || lower.includes("shymkent")) return "Шымкент қ.";
  if (lower.includes("абай") || lower.includes("семей")) return "Абай облысы";
  if (lower.includes("акмол") || lower.includes("ақмол") || lower.includes("кокше") || lower.includes("көкше")) return "Ақмола облысы";
  if (lower.includes("актюб") || lower.includes("ақтөб") || lower.includes("aktobe")) return "Ақтөбе облысы";
  if (lower.includes("атырау") || lower.includes("atyrau")) return "Атырау облысы";
  if (lower.includes("батыс қазақстан") || lower.includes("западно-казахстан") || lower.includes("орал") || lower.includes("уральск")) return "Батыс Қазақстан облысы";
  if (lower.includes("жамбыл") || lower.includes("тараз")) return "Жамбыл облысы";
  if (lower.includes("жетісу") || lower.includes("жетысу") || lower.includes("талдықорған") || lower.includes("талдыкорган")) return "Жетісу облысы";
  if (lower.includes("караганд") || lower.includes("қарағанды")) return "Қарағанды облысы";
  if (lower.includes("костан") || lower.includes("қостан")) return "Қостанай облысы";
  if (lower.includes("кызылорд") || lower.includes("қызылорд")) return "Қызылорда облысы";
  if (lower.includes("маңғыстау") || lower.includes("мангистау") || lower.includes("актау") || lower.includes("ақтау")) return "Маңғыстау облысы";
  if (lower.includes("павлодар") || lower.includes("pavlodar")) return "Павлодар облысы";
  if (lower.includes("солтүстік") || lower.includes("северо-казах") || lower.includes("петропавл")) return "Солтүстік Қазақстан облысы";
  if (lower.includes("туркестан") || lower.includes("түркістан")) return "Түркістан облысы";
  if (lower.includes("ұлытау") || lower.includes("улытау") || lower.includes("жезк") || lower.includes("жезқ")) return "Ұлытау облысы";
  if (lower.includes("шығыс қазақстан") || lower.includes("восточно-казах") || lower.includes("өскемен") || lower.includes("усть-камен")) return "Шығыс Қазақстан облысы";

  return "Алматы қ."; // Safe default
};
