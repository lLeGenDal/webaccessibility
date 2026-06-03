import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useLanguage } from "../LanguageContext";
import { Site, Audit } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend,
  AreaChart, Area
} from "recharts";
import { Globe, ClipboardCheck, AlertTriangle, CheckCircle2, TrendingUp, Users, School, Building2, Trophy, ArrowUpRight, Layers, Activity, BarChart3, Calculator, ShieldCheck, BrainCircuit, Landmark, Eye, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import KazakhstanMap from "./KazakhstanMap";

const inferRegion = (name: string): string => {
  const n = name.toLocaleLowerCase();
  if (n.includes("астана") || n.includes("astana")) return "г. Астана";
  if (n.includes("алматы") || n.includes("almaty")) return "г. Алматы";
  if (n.includes("шымкент") || n.includes("shymkent")) return "г. Шымкент";
  if (n.includes("караганд") || n.includes("karagand")) return "Карагандинская область";
  if (n.includes("акмолин") || n.includes("akmolin")) return "Акмолинская область";
  if (n.includes("атырау") || n.includes("atyrau")) return "Атырауская область";
  if (n.includes("актобе") || n.includes("aktobe")) return "Актюбинская область";
  if (n.includes("костанай") || n.includes("kostanay")) return "Костанайская область";
  if (n.includes("павлодар") || n.includes("pavlodar")) return "Павлодарская область";
  if (n.includes("мангистау") || n.includes("mangistau") || n.includes("актау")) return "Мангистауская область";
  if (n.includes("кызылорд") || n.includes("kyzylord")) return "Кызылординская область";
  if (n.includes("жамбыл") || n.includes("zhambyl") || n.includes("тараз")) return "Жамбылская область";
  if (n.includes("туркестан") || n.includes("turkestan")) return "Туркестанская область";
  if (n.includes("северо-казах") || n.includes("петропавл")) return "Северо-Казахстанская область";
  if (n.includes("западно-казах") || n.includes("уральск")) return "Западно-Казахстанская область";
  if (n.includes("восточно-казах") || n.includes("усть-камен")) return "Восточно-Казахстанская область";
  if (n.includes("абай") || n.includes("семей")) return "Абайская область";
  if (n.includes("жетысу") || n.includes("талдыкорг")) return "Жетысуская область";
  if (n.includes("улытау") || n.includes("жезказган")) return "Улытауская область";
  return "";
};

const RadialMetric = ({ name, value, color }: any) => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative w-24 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ value }, { value: 100 - value }]}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={45}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            cornerRadius={10}
          >
            <Cell fill={color} />
            <Cell fill="#2D3558" stroke="none" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-white leading-none">{value}%</span>
      </div>
    </div>
    <span className="text-[10px] font-bold text-[#707AA1] uppercase tracking-widest">{name}</span>
  </div>
);


export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [sites, setSites] = useState<Site[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      if (!user) {
        setLoading(false);
        return;
      }
      const [sitesData, auditsData] = await Promise.all([
        apiService.getSites(user.id),
        apiService.getAudits()
      ]);
      
      const userSites = sitesData.filter(s => s.ownerId === user.id);
      setSites(userSites);

      const uniqueAuditsMap = new Map<string, Audit>();
      // Filter audits that belong to user's sites or belong directly to user
      const userAudits = auditsData.filter(a => a.ownerId === user.id);
      
      userAudits.forEach(audit => {
        const existing = uniqueAuditsMap.get(audit.siteId);
        if (!existing || new Date(audit.date).getTime() > new Date(existing.date).getTime()) {
          uniqueAuditsMap.set(audit.siteId, audit);
        }
      });
      
      const finalAudits = Array.from(uniqueAuditsMap.values()).filter((audit, index, self) => 
        index === self.findIndex((t) => t.id === audit.id)
      );
      setAudits(finalAudits);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Refresh every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const avgIta = audits.length > 0 
    ? (audits.reduce((acc, curr) => acc + (curr.itaIndex || 0), 0) / audits.length).toFixed(1) 
    : "0.0";

  const trendData = audits.slice().reverse().map((a, i) => ({
    name: `Q${Math.floor(i/4) + 1}`,
    score: a.internalScore,
    axe: a.axeScore,
  }));

  const avgPOUR = audits.length > 0 ? {
    perceivable: Math.round(audits.reduce((sum, a) => sum + (a.pourScores?.perceivable || 0), 0) / audits.length),
    operable: Math.round(audits.reduce((sum, a) => sum + (a.pourScores?.operable || 0), 0) / audits.length),
    understandable: Math.round(audits.reduce((sum, a) => sum + (a.pourScores?.understandable || 0), 0) / audits.length),
    robust: Math.round(audits.reduce((sum, a) => sum + (a.pourScores?.robust || 0), 0) / audits.length),
  } : { perceivable: 0, operable: 0, understandable: 0, robust: 0 };

  const topSites = [...audits]
    .sort((a, b) => b.itaIndex - a.itaIndex)
    .slice(0, 3)
    .map(a => ({
      ...a,
      siteName: sites.find(s => s.id === a.siteId)?.name || "Unknown Org"
    }));

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-indigo-400 text-sm font-black uppercase tracking-[0.3em] animate-pulse">
        {language === "kk" ? "Жүйе үндестірілуде" : "Синхронизация системы"}
      </p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {sites.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-16 text-center border-dashed border-2 border-[#2D3558]"
        >
          <div className="w-24 h-24 bg-[#161B31] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#2D3558]">
            <Globe className="w-10 h-10 text-[#4F5A85]" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            {language === "kk" ? "Ұйымдар табылмады" : "Организации не найдены"}
          </h2>
          <p className="text-[#707AA1] max-w-md mx-auto mb-10 text-lg font-medium">
            {language === "kk" 
              ? "Қолжетімділік аудитін жүргізу үшін алдымен бірінші ұйымыңызды қосыңыз." 
              : "Для запуска аудита доступности сначала добавьте свою первую организацию."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/sites" 
              className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              {t("sites.addBtn")}
            </Link>
          </div>
        </motion.div>
      )}

      {sites.length > 0 && (
        <>
          <header className="flex items-end justify-between border-b border-[#22293F] pb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {t("dash.welcome")}, {profile?.displayName?.split(' ')[0]}
          </h1>
        </div>
        <div className="flex gap-4">
          <Link to="/audit/new" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-[0_5px_20px_rgba(79,70,229,0.3)] flex items-center gap-3 active:scale-95">
             <ClipboardCheck className="w-5 h-5" />
             {t("dash.newAuditBtn")}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Metric Cards Row */}
        <div className="lg:col-span-3 glass-card p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em] mb-4">
              {language === "kk" ? "ОРТАША ИНДЕКС КӨРСЕТКІШІ" : "СРЕДНИЙ ПОКАЗАТЕЛЬ ИНДЕКСА"}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-black text-white">{avgIta}</span>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em] mb-4">
              {language === "kk" ? "ЦИФРЛЫҚ ПУЛЬС" : "ЦИФРОВОЙ ПУЛЬС"}
            </p>
            <div className="h-12 w-full bg-indigo-500/10 rounded-xl overflow-hidden relative border border-indigo-500/20">
               <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]" style={{ width: `${parseFloat(avgIta) * 10}%` }}></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 glass-card p-8">
          <div className="flex items-center justify-around h-full">
            <RadialMetric name={language === "kk" ? "Қабылдануы" : "Воспринимаемость"} value={avgPOUR.perceivable} color="#6366f1" />
            <RadialMetric name={language === "kk" ? "Басқарылуы" : "Управляемость"} value={avgPOUR.operable} color="#22d3ee" />
            <RadialMetric name={language === "kk" ? "Тұрақтылығы" : "Надежность"} value={avgPOUR.robust} color="#e879f9" />
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-8 flex flex-col justify-between group cursor-pointer hover:bg-[#232A42] transition-colors">
          <div>
            <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em] mb-4">
              {language === "kk" ? "ЖАЛПЫ САНЫ" : "ОБЩЕЕ КОЛИЧЕСТВО"}
            </p>
            <span className="text-3xl font-black text-white">{sites.length}</span>
            <p className="text-[10px] text-indigo-400 mt-1 font-bold">{t("nav.sites")}</p>
          </div>
          <div className="w-full h-1 bg-[#2D3558] rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-2/3"></div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-0 overflow-hidden group">
          <div className="p-8 pb-0">
             <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em] mb-2">
               {language === "kk" ? "ЖЕТІСТІК ДЕҢГЕЙІ" : "УРОВЕНЬ ДОСТИЖЕНИЙ"}
             </p>
             <span className="text-3xl font-black text-white">84.2%</span>
          </div>
          <div className="h-24 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[50, 45, 60, 55, 75, 84, 82].map(v => ({ v }))}>
                <defs>
                   <linearGradient id="miniSuccess" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#f43f5e" fill="url(#miniSuccess)" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Main Charts Row */}
        <div className="lg:col-span-8 glass-card p-10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {language === "kk" ? "Қолжетімділік қарқыны" : "Динамика доступности"}
              </h3>
              <p className="text-[#707AA1] text-xs font-medium mt-1">
                {language === "kk" ? "Көпплатформалы экожүйе заңдылығының барысы" : "Ход развития мультиплатформенной экосистемы"}
              </p>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                 <span className="text-[10px] font-black text-[#707AA1] uppercase">
                   {language === "kk" ? "Сәйкестік" : "Соответствие"}
                 </span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                 <span className="text-[10px] font-black text-[#707AA1] uppercase">
                   {language === "kk" ? "ЖИ Сенімділігі" : "Доверие ИИ"}
                 </span>
               </div>
            </div>
          </div>
          
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData}>
                 <defs>
                   <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="axeColor" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3558" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#707AA1', fontWeight: 700 }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#707AA1', fontWeight: 700 }} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1F2641', border: '1px solid #2D3558', borderRadius: '16px', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#scoreColor)" />
                 <Area type="monotone" dataKey="axe" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#axeColor)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-12">
          <KazakhstanMap sites={sites} audits={audits} />
        </div>

        <div className="lg:col-span-4 glass-card p-8">
           <div className="flex items-center justify-between mb-10">
             <h3 className="text-xl font-bold text-white tracking-tight">
               {language === "kk" ? "Үздік нәтижелер" : "Лучшие результаты"}
             </h3>
             <button className="text-[#707AA1] hover:text-white transition-colors">
               <ArrowUpRight className="w-5 h-5" />
             </button>
           </div>
           
           <div className="space-y-8">
              {topSites.map((audit, i) => (
                <div key={`${audit.id}-${i}`} className="group relative">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#161B31] border border-[#2D3558] flex items-center justify-center text-white p-2 overflow-hidden shadow-lg shadow-black/20">
                       <Landmark className={cn("w-6 h-6", i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-amber-600")} />
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white truncate max-w-[140px]">{audit.siteName}</span>
                          <span className="text-xs font-black text-indigo-400">
                            {language === "kk" ? "Инд" : "Инд"}: {audit.itaIndex}
                          </span>
                       </div>
                       <div className="w-full h-1.5 bg-[#2D3558] rounded-full mt-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${audit.internalScore}%` }}
                            transition={{ delay: i * 0.2, duration: 1 }}
                            className={cn("h-full rounded-full", i === 0 ? "bg-indigo-500" : i === 1 ? "bg-purple-500" : "bg-cyan-500")} 
                          />
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Link to="/audits" className="block w-full py-4 glass-card bg-[#232A42] border-[#2D3558] text-center text-sm font-bold text-white hover:bg-[#2D3558] transition-all rounded-2xl">
                {language === "kk" ? "Барлық аудиттерді көру" : "Посмотреть все аудиты"}
              </Link>
           </div>
        </div>

        {/* Bottom Section */}
        <div className="lg:col-span-4 glass-card p-10 flex flex-col justify-between">
           <div>
             <h3 className="text-xl font-bold text-white tracking-tight mb-2">
               {language === "kk" ? "Аудиттердің бөлінуі" : "Распределение аудитов"}
             </h3>
             <p className="text-[#707AA1] text-xs font-medium">
               {language === "kk" ? "Аймақтық айлық белсенділік" : "Региональная месячная активность"}
             </p>
           </div>
           
           <div className="h-[200px] mt-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: 'AST', val: 75, bench: 30 },
                   { name: 'ALA', val: 50, bench: 45 },
                   { name: 'SHM', val: 35, bench: 25 },
                   { name: 'KRG', val: 65, bench: 20 },
                 ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3558" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#707AA1', fontWeight: 900 }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1F2641', border: '1px solid #2D3558', borderRadius: '12px', color: '#fff' }}
                     cursor={{ fill: '#2D3558' }}
                   />
                   <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={8} />
                   <Bar dataKey="bench" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={8} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-8 glass-card p-10">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {language === "kk" ? "Жүйелік статус" : "Системный статус"}
              </h3>
              <div className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-green-500/20">
                {language === "kk" ? "Барлық жүйелер қалыпты жұмыс істеуде" : "Все системы функционируют в норме"}
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-[#161B31] rounded-2xl border border-[#2D3558]">
                 <span className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">
                   {language === "kk" ? "WCAG Қамтылуы" : "Покрытие WCAG"}
                 </span>
                 <p className="text-2xl font-bold text-white mt-2">2.2 AA {language === "kk" ? "Деңгейі" : "Уровень"}</p>
              </div>
              <div className="p-6 bg-[#161B31] rounded-2xl border border-[#2D3558]">
                 <span className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">
                   {language === "kk" ? "Сканерлеу кідірісі" : "Задержка сканирования"}
                 </span>
                 <p className="text-2xl font-bold text-white mt-2">~42с / {language === "kk" ? "сайт" : "сайт"}</p>
              </div>
              <div className="p-6 bg-[#161B31] rounded-2xl border border-[#2D3558]">
                 <span className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">
                   {language === "kk" ? "Негізгі қозғалтқыштар" : "Главные движки"}
                 </span>
                 <p className="text-2xl font-bold text-white mt-2">v3.5.0-ЖИ</p>
              </div>
           </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

