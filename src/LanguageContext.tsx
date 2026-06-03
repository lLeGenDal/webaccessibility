import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "kk" | "ru";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  kk: {
    // Navigation & General
    "nav.dashboard": "Бақылау тақтасы",
    "nav.sites": "Ұйымдар",
    "nav.audits": "Аудит хаттамасы",
    "nav.startAudit": "Аудитті бастау",
    "nav.compare": "Салыстыру",
    "nav.settings": "Жүйелік реттеу",
    "nav.logout": "Жүйеден шығу",
    "nav.login": "Консольге кіру",
    "nav.register": "Тіркелгіні жасау",
    "nav.methodology": "Әдістемелік нұсқау",
    
    // Auth Page
    "auth.neural": "Нейрондық сәйкестік инфрақұрылымы",
    "auth.fullName": "Толық аты-жөні",
    "auth.email": "Электрондық пошта",
    "auth.password": "Қауіпсіздік кілті",
    "auth.placeholderName": "Әлихан Ермеков",
    "auth.placeholderEmail": "access@domain.kz",
    "auth.hasAccount": "Тіркелгіңіз бар ма? Кіру",
    "auth.noAccount": "Жаңа рұқсат керек пе? Тіркелу",
    "auth.loadingSystem": "Жүйе іске қосылуда",

    // Dashboard page general
    "dash.welcome": "Қош келдіңіз",
    "dash.monitor": "Ақпараттық ресурстардың қолжетімділігін талдау",
    "dash.itaIndex": "Интегралдық ITA индексі",
    "dash.avgScore": "Орташа бағалау көрсеткіші",
    "dash.totalSites": "Бақыланған ресурстар",
    "dash.totalAudits": "Аяқталған аудиттер",
    "dash.criticalIssues": "Күрделі олқылықтар",
    "dash.latestAudit": "Соңғы аудит",
    "dash.noAuditsYet": "Әзірге аудиттер жоқ",
    "dash.byRegions": "Қазақстан өңірлері бойынша мониторинг",
    "dash.newAuditBtn": "Жаңа аудит бастау",
    "dash.recentSites": "Аудит өткен соңғы ұйымдар",
    "dash.siteName": "Ұйым атауы",
    "dash.auditDate": "Күні",
    "dash.score": "Баға",
    "dash.viewResults": "Нәтижелерді көру",
    "dash.trend": "ITA өзгеру тенденциясы",
    "dash.distribution": "Сәйкестік деңгейінің үлесі",
    "dash.levelPassed": "Деңгейден өткендер",

    // Sites page general
    "sites.title": "Бақылаудағы ұйымдар тізілімі",
    "sites.description": "Мемлекеттік, қаржылық, білім беру және басқа да маңызды ресурстар тобы",
    "sites.addBtn": "Жаңа ұйымды қосу",
    "sites.searchPlaceholder": "Ұйымдарды атау немесе өңір бойынша іздеу...",
    "sites.nameLabel": "Ресми атауы",
    "sites.urlLabel": "Ресми веб-сайты (URL)",
    "sites.categoryLabel": "Санат",
    "sites.regionLabel": "Қазақстандағы өңірі",
    "sites.autoFill": "Интеллектуалды автоматты толтыру (Gemini)",
    "sites.autoFillLoading": "Деректер талдануда...",
    "sites.cancel": "Бас тарту",
    "sites.save": "Сақтау",
    "sites.noSites": "Бақылауда ұйымдар табылмады",
    "sites.deleteSuccess": "Ұйым сәтті жойылды",
    
    // Audit Form page
    "auditForm.title": "Жаңа қолжетімділік аудитін іске қосу",
    "auditForm.desc": "Ұйымның веб-ресурсын WCAG 2.2 стандарттары бойынша бірнеше деңгейлі терең талдаудан өткізу кілті",
    "auditForm.selectOrg": "Ұйымды таңдаңыз (тізілімнен)",
    "auditForm.selectPlaceholder": "Ұйымдық нысанды таңдаңыз...",
    "auditForm.manualInputGroup": "Немесе қолмен талдау үшін HTML кодын енгізіңіз",
    "auditForm.labelHtml": "HTML немесе мәтіндік деректер",
    "auditForm.runAuditBtn": "Аудитті бастау",
    "auditForm.analyzing": "Талдау жүргізілуде",
    
    // Audit Results page
    "results.title": "Аудит қорытындылары",
    "results.tactical": "Тактикалық есеп нұсқасы",
    "results.itaIndex": "ITA Индексі",
    "results.visualContrast": "Визуалды контраст",
    "results.screenReaders": "Экрандық дикторларды қолдау",
    "results.keyboardAccessibility": "Пернетақтамен басқару",
    "results.htmlStructure": "HTML құрылымдық семантикасы",
    "results.aiScore": "AI Семантикалық бағасы",
    "results.manualScore": "Қолмен бағалау үлесі",
    "results.summary": "Аудиттің қысқаша мазмұны",
    "results.strategicReview": "Стратегиялық шолу (AI)",
    "results.recommendations": "Әдістемелік ұсыныстар",
    "results.recommendationsSubtitle": "Реттеушілік стандарттарға толық сәйкестігін қамтасыз ету қадамдары",
    "results.issuesList": "Анықталған олқылықтардың ресми хаттамасы",
    "results.severity": "Деңгейі",
    "results.wcag": "WCAG Бөлімі",
    "results.engine": "Модуль",
    "results.recommendation": "Ұсыныс",
    "results.actions": "Әрекеттер",
    "results.pending": "Күтуде",
    "results.confirmed": "Бекітілді",
    "results.rejected": "Жойылды",
    "results.manualValidate": "Қолмен тексеруге өту",
    "results.scoreDistribution": "Ұйым бойынша сәйкестік көрсеткіштері",
    
    // Compare page
    "compare.title": "Аудит нәтижелерін өзара салыстыру",
    "compare.desc": "Әртүрлі мерзімде немесе әртүрлі ресурстар үшін жүргізілген аудит деректерін динамикалық түрде сараптау",
    "compare.chooseSource": "Бастапқы аудит",
    "compare.chooseTarget": "Салыстырылатын аудит",
    "compare.difference": "Айырмашылық",
    "compare.metric": "Көрсеткіш",
    "compare.status": "Мәртебе",
    
    // Category Names
    "cat.University": "ЖОО / Білім ордасы",
    "cat.Government": "Мемлекеттік орган",
    "cat.Finance": "Қаржы институты (Банк)",
    "cat.Healthcare": "Денсаулық сақтау",
    "cat.Company": "Жеке компания",
    "cat.Non-Profit": "Еріктілер қорлары"
  },
  ru: {
    // Navigation & General
    "nav.dashboard": "Панель управления",
    "nav.sites": "Организации",
    "nav.audits": "Протокол аудита",
    "nav.startAudit": "Начать аудит",
    "nav.compare": "Сравнение",
    "nav.settings": "Системные настройки",
    "nav.logout": "Выйти из системы",
    "nav.login": "Войти в консоль",
    "nav.register": "Создать аккаунт",
    "nav.methodology": "Методология",

    // Auth Page
    "auth.neural": "Инфраструктура нейронного соответствия",
    "auth.fullName": "Полное имя",
    "auth.email": "Электронная почта",
    "auth.password": "Ключ безопасности",
    "auth.placeholderName": "Алихан Ермеков",
    "auth.placeholderEmail": "access@domain.kz",
    "auth.hasAccount": "Уже есть аккаунт? Войти",
    "auth.noAccount": "Нужен новый доступ? Регистрация",
    "auth.loadingSystem": "Запуск системы",

    // Dashboard page general
    "dash.welcome": "Добро пожаловать",
    "dash.monitor": "Анализ доступности информационных ресурсов",
    "dash.itaIndex": "Интегральный индекс ITA",
    "dash.avgScore": "Средний показатель оценки",
    "dash.totalSites": "Мониторятся ресурсы",
    "dash.totalAudits": "Завершено аудитов",
    "dash.criticalIssues": "Критические упущения",
    "dash.latestAudit": "Последний аудит",
    "dash.noAuditsYet": "Аудитов пока нет",
    "dash.byRegions": "Мониторинг по регионам Казахстана",
    "dash.newAuditBtn": "Начать новый audit",
    "dash.recentSites": "Последние организации с аудитом",
    "dash.siteName": "Название организации",
    "dash.auditDate": "Дата",
    "dash.score": "Оценка",
    "dash.viewResults": "Посмотреть результаты",
    "dash.trend": "Тенденция изменения ITA",
    "dash.distribution": "Доля уровня соответствия",
    "dash.levelPassed": "Прошедшие уровень",

    // Sites page general
    "sites.title": "Реестр контролируемых организаций",
    "sites.description": "Группа государственных, финансовых, образовательных и других критических ресурсов",
    "sites.addBtn": "Добавить новую организацию",
    "sites.searchPlaceholder": "Поиск организаций по названию или региону...",
    "sites.nameLabel": "Официальное название",
    "sites.urlLabel": "Рефициальный сайт (URL)",
    "sites.categoryLabel": "Категория",
    "sites.regionLabel": "Регион в Казахстане",
    "sites.autoFill": "Интеллектуальное автозаполнение (Gemini)",
    "sites.autoFillLoading": "Анализ данных...",
    "sites.cancel": "Отмена",
    "sites.save": "Сохранить",
    "sites.noSites": "Контролируемые организации не найдены",
    "sites.deleteSuccess": "Организация успешно удалена",

    // Audit Form page
    "auditForm.title": "Запуск нового аудита доступности",
    "auditForm.desc": "Ключ к проведению многоуровневого глубокого анализа веб-ресурса организации по стандартам WCAG 2.2",
    "auditForm.selectOrg": "Выберите организацию (из реестра)",
    "auditForm.selectPlaceholder": "Выберите организационную форму...",
    "auditForm.manualInputGroup": "Или введите HTML-код для ручного анализа",
    "auditForm.labelHtml": "HTML или текстовые данные",
    "auditForm.runAuditBtn": "Начать аудит",
    "auditForm.analyzing": "Выполняется анализ",

    // Audit Results page
    "results.title": "Результаты аудита",
    "results.tactical": "Тактический отчет",
    "results.itaIndex": "Индекс ITA",
    "results.visualContrast": "Визуальный контраст",
    "results.screenReaders": "Поддержка экранных дикторов",
    "results.keyboardAccessibility": "Управление клавиатурой",
    "results.htmlStructure": "Структурная семантика HTML",
    "results.aiScore": "Семантическая оценка AI",
    "results.manualScore": "Доля ручной оценки",
    "results.summary": "Краткое содержание аудита",
    "results.strategicReview": "Стратегический обзор (AI)",
    "results.recommendations": "Методические рекомендации",
    "results.recommendationsSubtitle": "Шаги по обеспечению полного соответствия регулирующим стандартам",
    "results.issuesList": "Официальный протокол обнаруженных недостатков",
    "results.severity": "Уровень",
    "results.wcag": "Раздел WCAG",
    "results.engine": "Модуль",
    "results.recommendation": "Рекомендация",
    "results.actions": "Действия",
    "results.pending": "Ожидает",
    "results.confirmed": "Подтверждено",
    "results.rejected": "Удалено",
    "results.manualValidate": "Перейти к ручной проверке",
    "results.scoreDistribution": "Показатели соответствия организации",

    // Compare page
    "compare.title": "Взаимное сравнение результатов аудита",
    "compare.desc": "Динамический анализ данных аудита, проведенного в разные сроки или для разных ресурсов",
    "compare.chooseSource": "Исходный аудит",
    "compare.chooseTarget": "Сравниваемый аудит",
    "compare.difference": "Разница",
    "compare.metric": "Показатель",
    "compare.status": "Статус",

    // Category Names
    "cat.University": "ВУЗ / Учебное заведение",
    "cat.Government": "Государственный орган",
    "cat.Finance": "Финансовый институт (Банк)",
    "cat.Healthcare": "Здравоохранение",
    "cat.Company": "Частная компания",
    "cat.Non-Profit": "Волонтерские фонды"
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("qazaqaccess_lang");
    return (saved === "kk" || saved === "ru" ? saved : "kk") as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("qazaqaccess_lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["kk"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
