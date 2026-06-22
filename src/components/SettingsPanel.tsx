import React, { useState, useEffect } from "react";
import { useLanguage } from "../LanguageContext";
import { Shield, Check, AlertCircle, RefreshCw, Cpu, Activity, Play } from "lucide-react";
import { motion } from "motion/react";

export default function SettingsPanel() {
  const { language, t } = useLanguage();
  const [provider, setProvider] = useState<string>(() => localStorage.getItem("ai_provider") || "gemini");
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("/api/config/ai-status", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    localStorage.setItem("ai_provider", newProvider);
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setTestError(null);
      const res = await fetch("/api/config/test-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data.result);
      } else {
        setTestError(data.error || "Integration connection test failed");
      }
    } catch (err: any) {
      setTestError(err.message || "Connection error");
    } finally {
      setTesting(false);
    }
  };

  const getLocalized = (en: string, kk: string, ru: string) => {
    if (language === "en") return en;
    return language === "kk" ? kk : ru;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="border-b border-[#22293F] pb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          {getLocalized("System Settings", "Жүйелік реттеулер", "Системные настройки")}
        </h1>
        <p className="text-[#707AA1] mt-2 text-sm font-medium">
          {getLocalized(
            "Manage intelligent neural models and system integrations",
            "Интеллектуалды нейрондық модельдерді және жүйелік интеграцияларды басқару тиімділігі",
            "Управление интеллектуавыми нейромоделями и системной интеграцией"
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-10 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Cpu className="text-indigo-400 w-6 h-6" />
              {getLocalized("Select Artificial Intelligence Model", "Жасанды интеллект моделін таңдау", "Выбор модели Искусственного Интеллекта")}
            </h2>
            <p className="text-[#707AA1] text-sm leading-relaxed">
              {getLocalized(
                "Choose the active model to run accessibility audits. Additional model activation is based on the availability of the corresponding API key.",
                "Қолжетімділік аудиттерін өткізу үшін қай модель белсенді жұмыс істейтінін таңдаңыз. Қосымша модельді қосу белгілі бір API кілтіне негізделеді.",
                "Выберите модель, которая будет использоваться для проведения аудитов доступности. Активация модели зависит от наличия соответствующего API ключа."
              )}
            </p>

            {/* Providers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Gemini Button Card */}
              <button
                onClick={() => handleProviderChange("gemini")}
                className={`text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  provider === "gemini"
                    ? "bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/5"
                    : "bg-[#121626]/40 border-[#232B45] hover:border-[#38436B] hover:bg-[#1C233B]/40"
                }`}
              >
                <div className="flex items-start justify-between w-full mb-6">
                  <div className="bg-[#1C233B] p-3 rounded-xl border border-[#2D3558]">
                    <span className="text-xl font-bold text-indigo-400">G</span>
                  </div>
                  {provider === "gemini" && (
                    <div className="bg-indigo-500 text-white rounded-full p-1.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Google Gemini API</h3>
                  <p className="text-[#707AA1] text-xs leading-relaxed">
                    {getLocalized(
                      "Standard default model (v3.5 Flash), optimized for detailed semantic auditing.",
                      "Қазақстан өңірлері мен мекемелерін талдауға арналған стандартты таңдаулы модель (v3.5 Flash).",
                      "Стандартная модель по умолчанию (v3.5 Flash), настроенная под регионы и контекст Казахстана."
                    )}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-[#1C233B] text-[#707AA1] border border-[#2D3558] rounded-md">
                      gemini-3.5-flash
                    </span>
                    {status?.gemini?.available ? (
                      <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        {getLocalized("Active", "Шынайы қосылым", "Активен")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {getLocalized("Key not set", "Кілт жоқ", "Ключ не задан")}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Groq Button Card */}
              <button
                onClick={() => handleProviderChange("groq")}
                className={`text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  provider === "groq"
                    ? "bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/5"
                    : "bg-[#121626]/40 border-[#232B45] hover:border-[#38436B] hover:bg-[#1C233B]/40"
                }`}
              >
                <div className="flex items-start justify-between w-full mb-6">
                  <div className="bg-[#1C233B] p-3 rounded-xl border border-[#2D3558]">
                    <span className="text-xl font-bold text-amber-500">Gr</span>
                  </div>
                  {provider === "groq" && (
                    <div className="bg-indigo-500 text-white rounded-full p-1.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Groq API Cloud</h3>
                  <p className="text-[#707AA1] text-xs leading-relaxed">
                    {getLocalized(
                      "Powerful and fast open-weights alternative based on Meta Llama 3.3 (70B).",
                      "Қуатты әрі тез Meta Llama 3.3 (70B) моделі арқылы талдау жасайтын бірінші ашық бастапқы балама.",
                      "Мощная альтернатива на базе Meta Llama 3.3 (70B) — молниеносный интеллект с открытым кодом."
                    )}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-[#1C233B] text-[#707AA1] border border-[#2D3558] rounded-md">
                      llama-3.3-70b
                    </span>
                    {status?.groq?.available ? (
                      <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        {getLocalized("Active", "Шынайы қосылым", "Активен")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {getLocalized("Key not set", "Кілт жоқ (Авто)", "Ключ не задан")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Connection Sandbox */}
          <div className="glass-card p-10 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Activity className="text-indigo-400 w-5 h-5" />
              {getLocalized("Integration System Diagnostics", "Интеграция жүйесін диагностикалау", "Диагностика системы интеграции")}
            </h2>
            <p className="text-[#707AA1] text-sm leading-relaxed">
              {getLocalized(
                "Test connection to the selected neural model. The diagnostic run measures integration speed and config correctness.",
                "Таңдалған нейрожелілік модельмен байланысты сынақтан өткізіңіз. Сынақ нәтижесі жүйе жылдамдығы мен дұрыс баптауларды көрсетеді.",
                "Протестируйте соединение с выбранной нейросетевой моделью. Тестовый запрос вернет ответ с проверкой скорости и точности настроек."
              )}
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 active:scale-95"
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {getLocalized("Test Connection", "Байланысты сынау", "Проверить соединение")}
              </button>
            </div>

            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-green-500/10 border border-green-500/20 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                  <Check className="w-4 h-4" />
                  {getLocalized("Connection established successfully", "Қосылым сәтті орнатылды", "Соединение успешно установлено")}
                </div>
                <p className="text-[#A6AFC9] text-xs font-mono bg-[#111422] p-3 rounded-lg border border-[#1e233b] whitespace-pre-wrap">
                  {testResult}
                </p>
              </motion.div>
            )}

            {testError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {getLocalized("Error establishing connection", "Байланысу барысында қате орын алды", "Ошибка во время соединения")}
                </div>
                <p className="text-[#A6AFC9] text-xs font-mono bg-[#111422] p-3 rounded-lg border border-[#1e233b] whitespace-pre-wrap">
                  {testError}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          <div className="glass-card p-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="text-indigo-400 w-5 h-5" />
              {getLocalized("Security Standards", "Қауіпсіздік деңгейі", "Стандарты безопасности")}
            </h3>
            <p className="text-[#707AA1] text-xs leading-relaxed">
              {getLocalized(
                "All API keys are securely managed server-side. No sensitive credentials or keys are ever exposed or transmitted to the browser.",
                "Барлық API кілттері тек серверлік құрылымда қауіпсіз өңделеді. Браузер деңгейінде құпия деректер немесе кілттер ешқашан көрсетілмейді және жіберілмейді.",
                "Все API ключи защищены и обрабатываются исключительно на сервере. Секретные токены никогда не передаются и не отображаются в браузере."
              )}
            </p>
          </div>

          <div className="glass-card p-8 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {getLocalized("Supported Models", "Қолдаулы модельдер", "Поддерживаемые модели")}
            </h3>
            <ul className="text-xs text-[#707AA1] space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span><strong>Google Gemini 1.5/2.5/3.5 Flash</strong>: {getLocalized("Optimized for fast semantic analysis and structured outputs.", "жылдам талдау мен автоматты құрылымдарға бапталған.", "молниеносный сбор данных.")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span><strong>Groq Llama 3.3 70B Valued</strong>: {getLocalized("Highly capable model for complex and deep accessibility reasoning.", "ауыр және күрделі семантикалық деңгейлі логиканы теруге арналған.", "мощная открытая модель для сложных семантических аудитов.")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
