import React, { useState, useEffect } from "react";
import axe from "axe-core";
import { safeAxeRun } from "../lib/axe-utils";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, AlertTriangle, CheckCircle, Info, RefreshCw, ChevronDown, ChevronUp, Search, Eye, Globe } from "lucide-react";
import { cn } from "../lib/utils";

interface AxeResult {
  violations: axe.Result[];
  passes: axe.Result[];
  incomplete: axe.Result[];
  inapplicable: axe.Result[];
  timestamp: string;
}

export default function AxeAudit() {
  const [results, setResults] = useState<AxeResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"violations" | "passes">("violations");
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const runAudit = async (url?: string) => {
    setIsAuditing(true);
    setError(null);
    // Small delay to let UI settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      let context: any = document;

      if (url) {
        // Fetch external site HTML via proxy
        const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error("Не удалось загрузить сайт через прокси. Возможно, он защищен от автоматических запросов.");
        }
        const html = await response.text();

        // Create a temporary container to render the site
        const container = document.createElement('div');
        container.id = 'audit-sandbox';
        container.style.display = 'none';
        container.innerHTML = html;
        document.body.appendChild(container);
        context = container;
      }

      const axeResults = await safeAxeRun(context);
      
      // Cleanup sandbox
      const sandbox = document.getElementById('audit-sandbox');
      if (sandbox) sandbox.remove();

      setResults({
        violations: axeResults.violations,
        passes: axeResults.passes,
        incomplete: axeResults.incomplete,
        inapplicable: axeResults.inapplicable,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error: any) {
      console.error("Axe audit failed:", error);
      setError(error.message || "Произошла ошибка при проведении аудита.");
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const handleExternalAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;
    runAudit(targetUrl);
  };

  const getSeverityColor = (impact: string | null | undefined) => {
    switch (impact) {
      case "critical": return "text-red-600 bg-red-50 border-red-100";
      case "serious": return "text-orange-600 bg-orange-50 border-orange-100";
      case "moderate": return "text-yellow-600 bg-yellow-50 border-yellow-100";
      case "minor": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-indigo-600 w-8 h-8" />
            Аудит любого сайта (Axe Core)
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Введите URL любого сайта, чтобы прогнать его через движок <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-sm">axe-core</code>.
          </p>
          
          <form onSubmit={handleExternalAudit} className="mt-6 flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="url"
                placeholder="https://example.kz"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAuditing}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isAuditing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Проверить
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600 font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => runAudit()}
            disabled={isAuditing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", isAuditing && !targetUrl && "animate-spin")} />
            Проверить это приложение
          </button>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="text-red-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Нарушения</p>
              <p className="text-2xl font-bold text-gray-900">{results.violations.length}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="text-green-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Пройдено тестов</p>
              <p className="text-2xl font-bold text-gray-900">{results.passes.length}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Info className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Последняя проверка</p>
              <p className="text-2xl font-bold text-gray-900">{results.timestamp}</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("violations")}
            className={cn(
              "flex-1 py-4 font-bold text-sm transition-all border-b-2",
              activeTab === "violations" 
                ? "text-indigo-600 border-indigo-600 bg-indigo-50/30" 
                : "text-gray-500 border-transparent hover:bg-gray-50"
            )}
          >
            Нарушения ({results?.violations.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("passes")}
            className={cn(
              "flex-1 py-4 font-bold text-sm transition-all border-b-2",
              activeTab === "passes" 
                ? "text-green-600 border-green-600 bg-green-50/30" 
                : "text-gray-500 border-transparent hover:bg-gray-50"
            )}
          >
            Успешные тесты ({results?.passes.length || 0})
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "violations" ? (
              <motion.div
                key="violations"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {results?.violations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Нарушений не найдено!</h3>
                    <p className="text-gray-500">Ваш интерфейс соответствует базовым правилам доступности.</p>
                  </div>
                ) : (
                  results?.violations.map((violation) => (
                    <div 
                      key={violation.id}
                      className="border border-gray-100 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all"
                    >
                      <button
                        onClick={() => setExpandedIssue(expandedIssue === violation.id ? null : violation.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", getSeverityColor(violation.impact))}>
                            {violation.impact}
                          </span>
                          <h3 className="font-bold text-gray-900">{violation.help}</h3>
                        </div>
                        {expandedIssue === violation.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                      </button>
                      
                      <AnimatePresence>
                        {expandedIssue === violation.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50 p-6 border-t border-gray-100"
                          >
                            <p className="text-gray-700 mb-4">{violation.description}</p>
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Как исправить:</p>
                                <p className="text-sm text-gray-600">{violation.helpUrl ? <a href={violation.helpUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{violation.help} (Документация)</a> : violation.help}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Затронутые элементы ({violation.nodes.length}):</p>
                                <div className="space-y-2">
                                  {violation.nodes.map((node, idx) => (
                                    <div key={idx} className="bg-gray-900 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                      {node.html}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="passes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {results?.passes.map((pass) => (
                  <div key={pass.id} className="p-4 border border-green-100 bg-green-50/30 rounded-2xl flex items-start gap-3">
                    <CheckCircle className="text-green-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{pass.help}</h4>
                      <p className="text-xs text-gray-500 mt-1">{pass.description}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4">Как работает этот инструмент?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-100">Анализ DOM</h4>
                  <p className="text-sm text-indigo-200/80">Библиотека сканирует HTML-код текущей страницы и ищет несоответствия стандартам WCAG.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-100">Проверка контраста</h4>
                  <p className="text-sm text-indigo-200/80">Алгоритмы вычисляют разницу между цветом текста и фона для обеспечения читаемости.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="text-indigo-300 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-100">ARIA-валидация</h4>
                  <p className="text-sm text-indigo-200/80">Проверяется корректность использования атрибутов для экранных дикторов.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-indigo-300 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-100">Отчет об ошибках</h4>
                  <p className="text-sm text-indigo-200/80">Вы получаете точные указания на элементы, которые требуют исправления.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
