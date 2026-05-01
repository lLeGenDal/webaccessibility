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
import { Activity } from "lucide-react";

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
        setLoading(true);
        if (!user) return;
        const [sitesData, auditsData] = await Promise.all([
          apiService.getSites(user.id),
          apiService.getAudits()
        ]);
        
        const userSites = sitesData.filter(s => s.ownerId === user.id);
        setSites(userSites);
        
        let userAudits = auditsData.filter(a => a.ownerId === user.id);
        
        if (siteIdFilter) {
          userAudits = userAudits.filter(a => a.siteId === siteIdFilter);
        }

        const uniqueAuditsMap = new Map<string, Audit>();
        userAudits.forEach(audit => {
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
      // Reload everything to stay in sync
      const [sitesData, auditsData] = await Promise.all([
        apiService.getSites(user?.id || ""),
        apiService.getAudits()
      ]);
      const userSites = sitesData.filter(s => s.ownerId === user?.id);
      setSites(userSites);
      const userAudits = auditsData.filter(a => a.ownerId === user?.id);
      setAudits(userAudits.filter(a => siteIdFilter ? a.siteId === siteIdFilter : true));
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-indigo-400 text-sm font-black uppercase tracking-[0.3em] animate-pulse">Accessing Audit Vault</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-[#22293F]">
        <div className="flex items-center gap-6">
          {siteIdFilter && (
            <button 
              onClick={() => navigate("/sites")}
              className="p-3 bg-[#111422] hover:bg-[#1C2133] border border-[#2D3558] rounded-2xl transition-all text-[#707AA1] hover:text-white group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              {siteIdFilter ? `${sites.find(s => s.id === siteIdFilter)?.name}` : "Audit Logs"}
            </h1>
            <p className="text-[#707AA1] mt-2 font-medium italic">
              {siteIdFilter ? "Compliance dynamics within the VaMoLà strategy" : "A complete chronological registry of digital accessibility assessments."}
            </p>
          </div>
        </div>
        {!siteIdFilter && (
          <div className="relative group w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter by organization..."
              className="w-full pl-12 pr-6 py-4 bg-[#1F2641]/50 border border-[#2D3558] rounded-2xl text-sm text-white placeholder-[#4F5A85] focus:ring-2 focus:ring-indigo-500 outline-none transition-all backdrop-blur-md"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4F5A85] group-focus-within:text-indigo-400 transition-colors" />
          </div>
        )}
      </header>

      {filteredAudits.length === 0 ? (
        <div className="glass-card p-16 text-center border border-dashed border-[#2D3558]">
          <div className="w-20 h-20 bg-[#161B31] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#2D3558]">
            <BarChart3 className="w-8 h-8 text-[#4F5A85]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No audits found</h3>
          <p className="text-[#707AA1] max-w-sm mx-auto mb-10 font-medium">No assessment history detected for this criteria.</p>
          <button 
            onClick={() => navigate('/audit/new')}
            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/30"
          >
            Initiate First Scan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
                  className="glass-card p-8 hover:shadow-2xl hover:border-indigo-500/50 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shadow-lg",
                        audit.internalScore >= 90 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        audit.internalScore >= 70 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      )}>
                        <span className="text-xl">{audit.internalScore}%</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{site?.name || "Target System"}</h3>
                        <p className="text-[10px] text-[#4F5A85] uppercase tracking-[0.2em] font-black mt-1">{site?.category || "Standard"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletingId === audit.id ? (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteAudit(audit.id); }}
                            className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20"
                          >
                            Yes
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                            className="px-3 py-1.5 bg-[#1F2641] text-[#A6AFC9] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#2D3558]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(audit.id); }}
                          className="p-3 text-[#4F5A85] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#111422] p-4 rounded-2xl border border-[#2D3558] group-hover:border-indigo-500/30 transition-colors">
                      <p className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-2">ITA Index</p>
                      <p className="text-2xl font-black text-indigo-400">{audit.itaIndex || 0}</p>
                    </div>
                    <div className="bg-[#111422] p-4 rounded-2xl border border-[#2D3558] group-hover:border-indigo-500/30 transition-colors">
                      <p className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-2">Maturity</p>
                      <p className="text-sm font-bold text-white line-clamp-1">{audit.maturityLevel}</p>
                    </div>
                  </div>

                  <div className="flex gap-6 mb-8 px-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-1">Axe Core</span>
                      <span className="text-lg font-black text-white">{audit.axeScore}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-1">AI Intelligence</span>
                      <span className="text-lg font-black text-indigo-400">{audit.aiScore}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-1">Contrast</span>
                      <span className="text-lg font-black text-amber-400">{audit.contrastScore}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em] pt-6 border-t border-[#22293F]">
                    <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-indigo-500" />
                       {format(new Date(audit.date), "d MMM yyyy", { locale: ru })}
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400 group-hover:text-white transition-colors">
                      Report <ExternalLink className="w-3 h-3" />
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
