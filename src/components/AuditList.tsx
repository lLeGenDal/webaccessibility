import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Audit, Site } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trash2, ExternalLink, Calendar, BarChart3, AlertCircle, Loader2, Search, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { apiService } from "../services/apiService";

export default function AuditList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteIdFilter = searchParams.get("siteId");
  
  const [audits, setAudits] = useState<Audit[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user) return;
        const [sitesData, auditsData] = await Promise.all([
          apiService.getSites(user.uid),
          apiService.getAudits()
        ]);
        setSites(sitesData);
        
        let filtered = auditsData;
        if (siteIdFilter) {
          filtered = auditsData.filter(a => a.siteId === siteIdFilter);
        }

        const uniqueAuditsMap = new Map<string, Audit>();
        filtered.forEach(audit => {
          const existing = uniqueAuditsMap.get(audit.siteId);
          if (!existing || new Date(audit.date).getTime() > new Date(existing.date).getTime()) {
            uniqueAuditsMap.set(audit.siteId, audit);
          }
        });

        const finalAudits = Array.from(uniqueAuditsMap.values()).filter((audit, index, self) => 
          index === self.findIndex((t) => t.id === audit.id)
        );

        setAudits(finalAudits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error("Error loading audits:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, siteIdFilter]);

  const handleDeleteAudit = async (id: string) => {
    try {
      await apiService.deleteAudit(id);
      const updatedAudits = await apiService.getAudits();
      setAudits(updatedAudits.filter(a => siteIdFilter ? a.siteId === siteIdFilter : true));
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting audit:", error);
      setDeletingId(null);
    }
  };

  const filteredAudits = audits.filter(audit => {
    const site = sites.find(s => s.id === audit.siteId);
    return site?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           site?.url.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {siteIdFilter && (
            <button 
              onClick={() => navigate("/sites")}
              className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {siteIdFilter ? `История изменений: ${sites.find(s => s.id === siteIdFilter)?.name}` : "История аудитов"}
            </h1>
            <p className="text-gray-500 mt-1">
              {siteIdFilter ? "Динамика доступности в рамках методологии VaMoLà" : "Список всех проведенных проверок доступности."}
            </p>
          </div>
        </div>
        {!siteIdFilter && (
          <div className="relative group w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Поиск по сайтам..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
        )}
      </header>

      {filteredAudits.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Аудиты не найдены</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">Запустите свой первый аудит, чтобы увидеть результаты здесь.</p>
          <button 
            onClick={() => navigate('/audit/new')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Запустить аудит
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAudits.map((audit, index) => {
              const site = sites.find(s => s.id === audit.siteId);
              return (
                <motion.div
                  key={`${audit.id}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => navigate(`/audit/${audit.id}`)}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                        audit.internalScore >= 90 ? "bg-green-50 text-green-600" :
                        audit.internalScore >= 70 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                      )}>
                        {audit.internalScore}%
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 line-clamp-1">{site?.name || "Удаленный сайт"}</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{site?.category === 'University' ? 'ВУЗ' : 'Компания'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletingId === audit.id ? (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteAudit(audit.id); }}
                            className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Да
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                            className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(audit.id); }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Индекс ITA</p>
                      <p className="text-xl font-black text-indigo-600">{audit.itaIndex || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Зрелость</p>
                      <p className="text-xs font-bold text-gray-700">{audit.maturityLevel}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Axe Core</span>
                      <span className="text-sm font-black text-gray-700">{audit.axeScore}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">AI Score</span>
                      <span className="text-sm font-black text-indigo-600">{audit.aiScore}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(audit.date), "d MMM yyyy", { locale: ru })}
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600 group-hover:translate-x-1 transition-transform">
                      Детали <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
