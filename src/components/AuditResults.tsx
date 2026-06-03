import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Audit, Issue, Site } from "../types";
import { 
  ChevronLeft, AlertCircle, AlertTriangle, Info, CheckCircle2, 
  Trash2, ExternalLink, ShieldCheck, Zap, 
  Search, Layout, Activity, Landmark, Eye, BrainCircuit, Sparkles, Calculator 
} from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { apiService } from "../services/apiService";

export default function AuditResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const auditData = await apiService.getAuditById(id);
        if (auditData) {
          setAudit(auditData);
          
          const sites = await apiService.getSites(""); 
          const foundSite = sites.find(s => s.id === auditData.siteId);
          if (foundSite) {
            setSite(foundSite);
          }

          const issuesData = await apiService.getIssues(id);
          const cleanIssues = issuesData.filter((issue, index, self) => 
            index === self.findIndex((t) => t.id === issue.id)
          );
          setIssues(cleanIssues);
        }
      } catch (error) {
        console.error("Error fetching audit results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      await apiService.deleteAudit(id!);
      navigate("/audits");
    } catch (error) {
      console.error("Error deleting audit:", error);
      setIsDeleting(false);
    }
  };

  const confirmedIssues = issues.filter(i => i.status === "Confirmed");
  const grouped = confirmedIssues.reduce((acc, i) => {
    if (!acc[i.criterion]) acc[i.criterion] = [];
    acc[i.criterion].push(i);
    return acc;
  }, {} as Record<string, Issue[]>);

  if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Нәтижелер жүктелуде...</div>;
  if (!audit || !site) return <div className="p-8 text-center text-red-500">Аудит табылмады.</div>;

  const severityColor = (sev: string) => {
    switch (sev) {
      case "Critical": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "High": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    }
  };

  const severityIcon = (sev: string) => {
    switch (sev) {
      case "Critical": return <AlertCircle className="w-4 h-4 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />;
      case "High": return <AlertTriangle className="w-4 h-4" />;
      case "Medium": return <Info className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const engineIcon = (engine: string) => {
    switch (engine) {
      case "Axe": return <ShieldCheck className="w-4 h-4" />;
      case "Internal": return <Search className="w-4 h-4" />;
      case "AI": return <Sparkles className="w-4 h-4" />;
      case "Manual": return <Eye className="w-4 h-4" />;
      case "Lighthouse": return <Landmark className="w-4 h-4" />;
      case "Contrast": return <Zap className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const engineLabel = (engine: string) => {
    switch (engine) {
      case "Axe": return "Axe Core Engine";
      case "Internal": return "Proprietary System";
      case "AI": return "Gemini AI Semantic";
      case "Manual": return "Expert Review";
      case "Lighthouse": return "Lighthouse Audit";
      case "Contrast": return "Contrast Analyzer";
      default: return engine;
    }
  };

  const getPourDescription = (key: string) => {
    switch (key) {
      case 'perceivable': return 'Қабылдану деңгейі: ақпарат және интерфейс компоненттері қолданушының сезу мүшелеріне түсінікті түрде ұсынылуы тиіс.';
      case 'operable': return 'Басқарылу деңгейі: интерфейстің компоненттері мен навигациясы жұмысқа қабілетті болуы тиіс.';
      case 'understandable': return 'Түсініктілігі: интерфейс ережелері мен ақпарат түсінікті болуы тиіс.';
      case 'robust': return 'Сенімділігі: контент әр түрлі көмекші технологиялармен талдау үшін жеткілікті сенімді болуы тиіс.';
      default: return '';
    }
  };

  const getPourTitle = (key: string) => {
    switch (key) {
      case 'perceivable': return 'Қабылдануы';
      case 'operable': return 'Басқарылуы';
      case 'understandable': return 'Түсініктілігі';
      case 'robust': return 'Сенімділігі';
      default: return key;
    }
  };

  const getExternalReportUrl = (engine: string, url: string) => {
    switch (engine.toLowerCase()) {
      case 'wave': return `https://wave.webaim.org/report#/${encodeURIComponent(url)}`;
      case 'lighthouse': return `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}&tab=accessibility`;
      case 'siteimprove': return `https://accessibility-checker.siteimprove.com/?url=${encodeURIComponent(url)}`;
      case 'silktide': return `https://silktide.com/accessibility-checker/`;
      case 'axe': return `https://www.deque.com/axe/`;
      default: return null;
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 border-b border-[#22293F]">
        <div className="flex items-center gap-6">
          <Link to="/audits" className="p-4 glass-card hover:bg-[#2D3558] transition-all text-[#707AA1] hover:text-white group">
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">АудитТалдауы (AuditIntelligence)</h1>
              {issues.some(i => i.status === "Pending") ? (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-amber-500/20">
                  Тексеру күтілуде
                </span>
              ) : (
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                  Бекітілген нәтиже
                </span>
              )}
            </div>
            <p className="text-[#707AA1] mt-2 font-medium tracking-wide">
              {site.name} • <span className="text-indigo-400">{new Date(audit.date).toLocaleDateString()}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to={`/audit/${id}/manual`} className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-[0_5px_20px_rgba(79,70,229,0.3)]">
            <CheckCircle2 className="w-5 h-5" /> Сарапшы шолуы
          </Link>
          <button 
            onClick={() => setIsDeleting(!isDeleting)}
            className="p-3.5 glass-card text-rose-400 hover:bg-rose-500 hover:text-white border-rose-500/20 transition-all"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </header>
      
      {isDeleting && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-between">
           <div className="flex items-center gap-4 text-rose-400">
             <AlertCircle className="w-6 h-6" />
             <span className="font-bold uppercase tracking-widest text-xs">Аудит жазбасын орталықтандырылған тізілімнен жою керек пе?</span>
           </div>
           <div className="flex gap-4">
             <button onClick={handleDelete} className="px-6 py-2 bg-rose-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-rose-500 transition-all">Жоюды растау</button>
             <button onClick={() => setIsDeleting(false)} className="px-6 py-2 glass-card text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl">Тоқтату</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: "Техникалық жүйе", value: audit.internalScore, color: "text-indigo-400", info: "Ішкі сканерлеу алгоритмдеріне негізделген кешенді техникалық бағалау." },
          { label: "Axe Техникалық", value: audit.axeScore, color: "text-indigo-400", info: "Ахе Core индустриялық стандартына негізделген бағалау (құрылымды тексеру)." },
          { label: "Lighthouse Веб", value: audit.lighthouseScore || 0, color: "text-amber-400", info: "Базалық тексеруге арналған Google Lighthouse қолжетімділік балдарын модельдеу." },
          { label: "Контраст деңгейі", value: audit.contrastScore || 0, color: "text-emerald-400", info: "Контраст индексі. WCAG 1.4.3 және 1.4.6 критерийлеріне негізделген (мәтін/фон)." },
          { label: "Нейрондық семантика", value: audit.aiScore, color: "text-indigo-400", info: "Gemini ЖИ семантикалық бағасы. Сипаттамаларды және контент қисынын талдайды." }
        ].map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 border-[#2D3558] hover:border-indigo-500/30 transition-all group relative"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black text-[#4F5A85] uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">{item.label}</p>
              <div className="relative group/info">
                <Info className="w-3.5 h-3.5 text-[#2D3558] group-hover:text-indigo-400 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[#1F2641] border border-[#2D3558] rounded-xl text-[10px] font-medium text-[#A6AFC9] opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                  {item.info}
                </div>
              </div>
            </div>
            <div className={cn("text-4xl font-black transition-all group-hover:scale-110 origin-left", item.color)}>
              {item.value}
              <span className="text-xs opacity-30 ml-1 font-bold">/100</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card p-8 border-[#2D3558]">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-indigo-600 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Нейрондық түсініктер (Insights)</h2>
                <p className="text-[10px] text-[#707AA1] uppercase tracking-[0.2em] font-black">Gemini 1.5 динамикалық сканерлеу технологиясы</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
               {[
                 { label: "Семант. құрылым", value: audit.aiInsights?.semanticAltQuality || 0, icon: Search },
                 { label: "Элемент анықтығы", value: audit.aiInsights?.labelClarity || 0, icon: Layout },
                 { label: "Логикалық ағын", value: audit.aiInsights?.navigationLogic || 0, icon: Activity }
               ].map(stat => (
                 <div key={stat.label} className="p-6 bg-[#161B31] rounded-2xl border border-[#2D3558] group hover:border-indigo-500/50 transition-all">
                   <div className="flex items-center gap-2 mb-4 text-[#4F5A85]">
                     <stat.icon className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                     <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                   </div>
                   <div className="flex items-end gap-2">
                     <div className="text-4xl font-black text-white">{stat.value}</div>
                     <div className="text-[10px] font-bold text-[#4F5A85] mb-2 uppercase tracking-widest">Index</div>
                   </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/20">
               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Аймақтық хаттама (KZ)</span>
                 </div>
                 <div className="text-sm leading-relaxed text-[#A6AFC9] whitespace-pre-wrap font-medium">
                   <ReactMarkdown>{audit.aiInsights?.recommendations?.kz || "Нейрондық синтез күтілуде..."}</ReactMarkdown>
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Операциялық нұсқаулық (RU)</span>
                 </div>
                 <div className="text-sm leading-relaxed text-[#A6AFC9] whitespace-pre-wrap font-medium">
                   <ReactMarkdown>{audit.aiInsights?.recommendations?.ru || "Талдау буфері бос."}</ReactMarkdown>
                 </div>
               </div>
            </div>
          </section>

          <section className="glass-card p-8 border-[#2D3558]">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#22293F]">
              <h2 className="text-2xl font-bold text-white tracking-tight italic">Нейрондық стратегиялық синтез</h2>
              <span className="px-3 py-1 bg-[#161B31] text-[#707AA1] text-[10px] font-black uppercase tracking-widest rounded border border-[#2D3558]">
                Интеллект деңгейі: Белсенді
              </span>
            </div>
            
            {audit.strategicReview && (
              <div className="mb-10 p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 italic text-indigo-200/90 leading-relaxed font-serif text-lg">
                <ReactMarkdown>{audit.strategicReview}</ReactMarkdown>
              </div>
            )}

            <div className="prose prose-invert prose-indigo max-w-none text-[#A6AFC9] leading-relaxed mb-10 overflow-hidden">
              <ReactMarkdown>{audit.summary}</ReactMarkdown>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-3">Қоғамдық әсер ету матрицасы</p>
                <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                  {audit.itaIndex >= 4 ? "Экожүйенің оңтайлы үйлесімділігі. Жоғары қолжетімділік расталды." : 
                   audit.itaIndex >= 3 ? "Навигациялық маңызды қиындықтар анықталды. Негізгі компоненттердің кейбірі кейбір пайдаланушылар үшін жұмыс істемейді." :
                   "Маңызды бұзушылықтар. Инфрақұрылым пайдаланушылардың әртүрлі санаттары үшін мүлдем қолжетімді емес."}
                </p>
              </div>
              <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Архитектуралық директива</p>
                <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">
                  {audit.itaIndex < 3 ? "P1 деңгейіндегі құрылымдық бұзушылықтарды дереу жою қажет. Базалық тұрақтылықты қалпына келтіру бірінші кезектегі міндет." :
                   "AA деңгейіне сәйкестігін арттыру үшін ARIA семантикасы мен контраст көрсеткіштерін кезең-кезеңімен жақсарту ұсынылады."}
                </p>
              </div>
            </div>
          </section>

          <section className="glass-card p-8 border-[#2D3558]">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Көпфакторлы қозғалтқышты тексеру
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Core Engine', val: audit.internalScore, icon: Search, color: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' },
                { name: 'Axe Core 4.8', val: audit.axeScore, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                { name: 'Neural (Gen)', val: audit.aiScore, icon: BrainCircuit, color: 'text-violet-400', bg: 'bg-violet-500/5', border: 'border-violet-500/10' },
                { name: 'Lighthouse', val: audit.lighthouseScore || 0, icon: Landmark, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' }
              ].map(tool => (
                <div key={tool.name} className={cn("flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all hover:bg-[#1C2237]", tool.bg, tool.border)}>
                  <tool.icon className={cn("w-8 h-8", tool.color)} />
                  <div className="text-center">
                    <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-widest">{tool.name}</p>
                    <p className="text-2xl font-black text-white mt-1">{tool.val}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card p-8 border-[#2D3558]">
            <h2 className="text-xl font-bold text-white mb-8">Баллдарды есептеу әдістемесі</h2>
            <div className="space-y-8">
              <div className="p-6 bg-[#161B31] rounded-2xl border border-[#2D3558]">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">ITA индексінің алгоритмі (v2.2)</h3>
                <div className="p-5 bg-[#0D111D] rounded-xl border border-[#2D3558] mb-6 overflow-x-auto">
                  <p className="text-[10px] font-black text-[#4F5A85] uppercase tracking-widest mb-2">Теңдеу формуласы</p>
                  <code className="text-xl font-mono text-indigo-400 font-bold whitespace-nowrap">
                    ITA = 5.0 - (Σ A × 0.5) - (Σ AA × 0.2) - (Σ AAA × 0.05)
                  </code>
                </div>
                <p className="text-sm text-[#A6AFC9] leading-relaxed mb-6 font-medium">
                  Стратегиялық <strong>ITA индексі (1.0 - 5.0)</strong> расталған өлшем деректерді көпөлшемді талдау арқылы жасалады. <strong>A</strong> деңгейіндегі бұзушылықтар маңызды бұғаттаушы фактор ретінде қарастырылады.
                </p>
                <div className="flex gap-4">
                   <Link to="/methodology" className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-6 py-3 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
                     <Calculator className="w-4 h-4" /> Толық әдістеме
                   </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-rose-500/5 p-6 rounded-2xl border border-rose-500/20">
                  <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Critical Blockers (A)</h3>
                  <div className="text-3xl font-black text-white">{audit.wcagBreakdown?.A || 0}</div>
                  <p className="text-[10px] text-[#707AA1] mt-3 leading-relaxed font-bold uppercase tracking-tight">System failure points that prevent mission-critical user flow.</p>
                </div>
                <div className="bg-[#161B31] p-6 rounded-2xl border border-[#2D3558]">
                  <h3 className="text-[10px] font-black text-[#707AA1] uppercase tracking-widest mb-2">Maturity Level</h3>
                  <div className="text-xl font-black text-white uppercase tracking-tight">{audit.maturityLevel}</div>
                  <p className="text-[10px] text-[#4F5A85] mt-3 leading-relaxed font-bold uppercase tracking-tight">Organization readiness index for sustainable accessibility integration.</p>
                </div>
                <div className="bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/20">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">ITA Validation</h3>
                  <p className="text-xs text-[#A6AFC9] font-medium leading-relaxed">
                    {audit.manualReviewCompleted 
                      ? "Strategic ITA authorized by certified lead specialist." 
                      : "Preliminary scan data. Strategic authorization required for official registry."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              Анықталған ауытқулар
              <span className="px-3 py-0.5 bg-[#161B31] text-indigo-400 rounded-full text-xs font-black shadow-[0_0_10px_rgba(79,70,229,0.2)] border border-indigo-500/20">{issues.length}</span>
            </h2>
            
            {issues.map((issue, idx) => (
              <motion.div 
                key={`${issue.id}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card border-[#22293F] overflow-hidden group hover:border-indigo-500/30 transition-all"
              >
                <div className="p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2", severityColor(issue.severity))}>
                        {severityIcon(issue.severity)}
                        {issue.severity}
                      </div>
                      <div className="px-4 py-1.5 bg-[#161B31] text-[#707AA1] rounded-xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 border border-[#2D3558]">
                        {engineIcon(issue.engine)}
                        {engineLabel(issue.engine)}
                      </div>
                      <span className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.2em]">{issue.criterion}</span>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                      issue.wcagLevel === "A" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      issue.wcagLevel === "AA" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    )}>
                      Level {issue.wcagLevel}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-6 group-hover:text-indigo-300 transition-colors">{issue.description}</h3>
                  
                  {issue.element && (
                    <div className="bg-[#0D111D] text-indigo-300/80 p-5 rounded-2xl mb-6 font-mono text-[11px] overflow-x-auto border border-[#22293F] scrollbar-thin scrollbar-thumb-[#2D3558]">
                      {issue.element}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-6">
                    <div className="md:col-span-3 p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Түзету директивасы</p>
                      <p className="text-sm text-[#A6AFC9] leading-relaxed font-medium">{issue.recommendation}</p>
                    </div>
                    <div className="flex justify-end pt-2">
                       {issue.helpUrl && (
                        <a 
                          href={issue.helpUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-4 glass-card text-[#707AA1] hover:text-indigo-400 hover:border-indigo-500/30 transition-all group/btn"
                        >
                          <ExternalLink className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </section>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-10 border-[#2D3558] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                audit.maturityLevel === "Optimized" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                audit.maturityLevel === "Integrated" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                audit.maturityLevel === "Defined" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-[#161B31] text-[#707AA1] border-[#2D3558]"
              )}>
                {audit.maturityLevel || "Тіркеу кезеңі"}
              </div>
            </div>
            <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.3em] mb-6">Strategic ITA Index</p>
            <div className="text-8xl font-black text-indigo-400 mb-6 drop-shadow-[0_0_20px_rgba(129,140,248,0.3)]">
              {audit.itaIndex}
            </div>
            
            <div className="mb-6 flex justify-center">
              {audit.manualReviewCompleted ? (
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                  <ShieldCheck className="w-4 h-4 shadow-sm" /> Бекітілген тексеру
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                  <AlertCircle className="w-4 h-4" /> Бастапқы сканерлеу
                </div>
              )}
            </div>

            <p className="text-[9px] font-bold text-[#4F5A85] uppercase tracking-[0.2em] mb-10">
              {audit.manualReviewCompleted ? "Strategic Sector Maximum: 5.0" : "Manual override requirement active"}
            </p>
            
            {!audit.manualReviewCompleted && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                <AlertCircle className="w-5 h-5 shrink-0" />
                Data integrity unconfirmed: Expert review needed
              </div>
            )}

            <div className="mt-10 pt-10 border-t border-[#22293F]">
              <p className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em] mb-8 text-center">Нейрондық POUR диагностикасы</p>
              <div className="space-y-6">
                {Object.entries(audit.pourScores || {}).map(([key, val]) => (
                  <div key={key} className="bg-[#161B31] p-5 rounded-2xl border border-[#2D3558] group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{getPourTitle(key)}</p>
                      <span className="text-[10px] font-black text-indigo-400 tracking-tighter">{val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0D111D] rounded-full overflow-hidden relative group-hover:shadow-[0_0_10px_rgba(79,70,229,0.2)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-white/10 animate-pulse" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-8 border-[#2D3558]">
            <h3 className="text-lg font-bold text-white mb-8">Құрылымдық талдау</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-rose-500/5 p-4 rounded-2xl text-center border border-rose-500/10">
                <p className="text-[10px] font-black text-rose-400 uppercase mb-2">Level A</p>
                <p className="text-3xl font-black text-white">{audit.wcagBreakdown?.A || 0}</p>
              </div>
              <div className="bg-orange-500/5 p-4 rounded-2xl text-center border border-orange-500/10">
                <p className="text-[10px] font-black text-orange-400 uppercase mb-2">Level AA</p>
                <p className="text-3xl font-black text-white">{audit.wcagBreakdown?.AA || 0}</p>
              </div>
              <div className="bg-indigo-500/5 p-4 rounded-2xl text-center border border-indigo-500/10">
                <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Level AAA</p>
                <p className="text-3xl font-black text-white">{audit.wcagBreakdown?.AAA || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 border-[#2D3558]">
            <h3 className="text-lg font-bold text-white mb-6">Нысаналы параметрлер</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-2">Қол жеткізу нүктесі (URL)</p>
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2 break-all transition-colors underline underline-offset-4 decoration-indigo-500/30">
                  {site.url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#22293F]">
                <div>
                  <p className="text-[9px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-2">Санат сыныптамасы</p>
                  <p className="text-sm text-white font-black tracking-tight uppercase">
                    {site.category || "General"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-2">Протокол нұсқасы</p>
                  <p className="text-sm text-white font-black tracking-tight uppercase">WCAG 2.2 AA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
