import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Audit, Site, Issue } from "../types";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { GitCompare, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Zap, ShieldCheck, BarChart3, Globe, Layers, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { apiService } from "../services/apiService";

export default function AuditCompare() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedAudit1, setSelectedAudit1] = useState<string>("");
  const [selectedAudit2, setSelectedAudit2] = useState<string>("");
  const [audit1Data, setAudit1Data] = useState<Audit | null>(null);
  const [audit2Data, setAudit2Data] = useState<Audit | null>(null);
  const [audit1Issues, setAudit1Issues] = useState<Issue[]>([]);
  const [audit2Issues, setAudit2Issues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const sitesData = await apiService.getSites(user.id);
        setSites(sitesData);

        const auditsData = await apiService.getAudits();
        const userAudits = auditsData.filter(a => a.ownerId === user.id);
        setAudits(userAudits);
      } catch (error) {
        console.error("Error fetching data for comparison:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchAuditDetails = async (id: string, setter: (a: Audit | null) => void, issueSetter: (i: Issue[]) => void) => {
      if (!id) {
        setter(null);
        issueSetter([]);
        return;
      }
      try {
        const auditData = await apiService.getAuditById(id);
        if (auditData) {
          setter(auditData);
          const issuesData = await apiService.getIssues(id);
          issueSetter(issuesData);
        }
      } catch (error) {
        console.error("Error fetching audit details:", error);
      }
    };

    fetchAuditDetails(selectedAudit1, setAudit1Data, setAudit1Issues);
    fetchAuditDetails(selectedAudit2, setAudit2Data, setAudit2Issues);
  }, [selectedAudit1, selectedAudit2]);

  const comparisonData = [
    { name: 'Internal', a1: audit1Data?.internalScore || 0, a2: audit2Data?.internalScore || 0 },
    { name: 'Axe Core', a1: audit1Data?.axeScore || 0, a2: audit2Data?.axeScore || 0 },
    { name: 'Lighthouse', a1: audit1Data?.lighthouseScore || 0, a2: audit2Data?.lighthouseScore || 0 },
    { name: 'AI Score', a1: audit1Data?.aiScore || 0, a2: audit2Data?.aiScore || 0 },
    { name: 'Contrast', a1: audit1Data?.contrastScore || 0, a2: audit2Data?.contrastScore || 0 }
  ];

  const radarData = [
    { subject: 'Воспринимаемость', a1: audit1Data?.pourScores?.perceivable || 0, a2: audit2Data?.pourScores?.perceivable || 0, fullMark: 100 },
    { subject: 'Управляемость', a1: audit1Data?.pourScores?.operable || 0, a2: audit2Data?.pourScores?.operable || 0, fullMark: 100 },
    { subject: 'Понятность', a1: audit1Data?.pourScores?.understandable || 0, a2: audit2Data?.pourScores?.understandable || 0, fullMark: 100 },
    { subject: 'Надежность', a1: audit1Data?.pourScores?.robust || 0, a2: audit2Data?.pourScores?.robust || 0, fullMark: 100 },
  ];

  const getSiteName = (siteId: string) => sites.find(s => s.id === siteId)?.name || "Неизвестный сайт";

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Сравнение аудитов</h1>
          <p className="text-gray-500 mt-1">Сравните результаты двух различных оценок доступности.</p>
        </div>
        <Link to="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Назад в дашборд
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700">Первый аудит</label>
          <select 
            value={selectedAudit1}
            onChange={e => setSelectedAudit1(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Выберите аудит...</option>
            {audits.map(a => (
              <option key={a.id} value={a.id}>
                {getSiteName(a.siteId)} - {new Date(a.date).toLocaleDateString()} (ITA: {a.itaIndex})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700">Второй аудит</label>
          <select 
            value={selectedAudit2}
            onChange={e => setSelectedAudit2(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Выберите аудит...</option>
            {audits.map(a => (
              <option key={a.id} value={a.id}>
                {getSiteName(a.siteId)} - {new Date(a.date).toLocaleDateString()} (ITA: {a.itaIndex})
              </option>
            ))}
          </select>
        </div>
      </div>

      {audit1Data && audit2Data ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Сравнение зрелости (Marks & Al-Ali)
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={getSiteName(audit1Data.siteId)}
                      dataKey="a1"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name={getSiteName(audit2Data.siteId)}
                      dataKey="a2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Индекс ITA и Уровень зрелости
              </h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ITA (Аудит 1)</p>
                    <p className="text-4xl font-black text-indigo-600">{audit1Data.itaIndex || 0}</p>
                    <p className="text-[10px] text-gray-400 mt-2 uppercase">{audit1Data.maturityLevel}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">WCAG A/AA/AAA</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">{audit1Data.wcagBreakdown?.A || 0}</span>
                      <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold">{audit1Data.wcagBreakdown?.AA || 0}</span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">{audit1Data.wcagBreakdown?.AAA || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ITA (Аудит 2)</p>
                    <p className="text-4xl font-black text-green-600">{audit2Data.itaIndex || 0}</p>
                    <p className="text-[10px] text-gray-400 mt-2 uppercase">{audit2Data.maturityLevel}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">WCAG A/AA/AAA</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">{audit2Data.wcagBreakdown?.A || 0}</span>
                      <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold">{audit2Data.wcagBreakdown?.AA || 0}</span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">{audit2Data.wcagBreakdown?.AAA || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Сравнение метрик</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" />
                    <Bar name={getSiteName(audit1Data.siteId)} dataKey="a1" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar name={getSiteName(audit2Data.siteId)} dataKey="a2" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {comparisonData.map(metric => (
                  <div key={metric.name} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{metric.name}</p>
                    <div className="flex items-center gap-2">
                      {metric.a1 > metric.a2 ? (
                        <div className="flex items-center gap-1.5 text-indigo-600">
                          <ArrowLeft className="w-4 h-4" />
                          <span className="text-sm font-bold">Аудит 1</span>
                        </div>
                      ) : metric.a2 > metric.a1 ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <span className="text-sm font-bold">Аудит 2</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-bold">Ничья</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {metric.a1}% vs {metric.a2}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-8">
              <div className="text-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Разница в счете</p>
                <div className={cn(
                  "text-6xl font-black",
                  audit1Data.internalScore === audit2Data.internalScore ? "text-gray-400" : 
                  audit1Data.internalScore > audit2Data.internalScore ? "text-indigo-600" : "text-green-600"
                )}>
                  {Math.abs(audit1Data.internalScore - audit2Data.internalScore)}%
                </div>
                <p className="text-gray-500 mt-2">
                  {audit1Data.internalScore > audit2Data.internalScore ? getSiteName(audit1Data.siteId) : getSiteName(audit2Data.siteId)} доступнее.
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Проблемы (Аудит 1)</span>
                  <span className="font-bold text-indigo-600">{audit1Issues.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Проблемы (Аудит 2)</span>
                  <span className="font-bold text-green-600">{audit2Issues.length}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Критические (Аудит 1)</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      audit1Issues.filter(i => i.severity === 'Critical').length > 0 
                        ? "bg-red-100 text-red-600" 
                        : "bg-green-100 text-green-600"
                    )}>
                      {audit1Issues.filter(i => i.severity === 'Critical').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Критические (Аудит 2)</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      audit2Issues.filter(i => i.severity === 'Critical').length > 0 
                        ? "bg-red-100 text-red-600" 
                        : "bg-green-100 text-green-600"
                    )}>
                      {audit2Issues.filter(i => i.severity === 'Critical').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Критические проблемы ({getSiteName(audit1Data.siteId)})</span>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {audit1Issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length}
                </span>
              </h3>
              <div className="space-y-4">
                {audit1Issues.filter(i => i.severity === 'Critical' || i.severity === 'High').slice(0, 5).map((issue, idx) => (
                  <div key={`${issue.id}-${idx}`} className="p-4 rounded-2xl bg-red-50 border border-red-100">
                    <p className="font-bold text-red-900 text-sm">{issue.criterion}</p>
                    <p className="text-xs text-red-700 mt-1 line-clamp-2">{issue.description}</p>
                  </div>
                ))}
                {audit1Issues.length === 0 && <p className="text-gray-400 text-center py-4">Проблем не обнаружено.</p>}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Критические проблемы ({getSiteName(audit2Data.siteId)})</span>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {audit2Issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length}
                </span>
              </h3>
              <div className="space-y-4">
                {audit2Issues.filter(i => i.severity === 'Critical' || i.severity === 'High').slice(0, 5).map((issue, idx) => (
                  <div key={`${issue.id}-${idx}`} className="p-4 rounded-2xl bg-red-50 border border-red-100">
                    <p className="font-bold text-red-900 text-sm">{issue.criterion}</p>
                    <p className="text-xs text-red-700 mt-1 line-clamp-2">{issue.description}</p>
                  </div>
                ))}
                {audit2Issues.length === 0 && <p className="text-gray-400 text-center py-4">Проблем не обнаружено.</p>}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl py-24 text-center">
          <GitCompare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Выберите два аудита для начала сравнения.</p>
        </div>
      )}
    </div>
  );
}
