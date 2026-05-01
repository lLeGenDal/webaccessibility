import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Site, KZRegion } from "../types";
import { useNavigate } from "react-router-dom";
import { Plus, Globe, Trash2, ExternalLink, Building2, GraduationCap, Search, Loader2, AlertCircle, BarChart3, Edit2, ShieldCheck, Activity, Calculator, Heart, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { suggestOfficialUrl, suggestOrgRegion, suggestOfficialName, suggestOrgCategory } from "../services/geminiAuditService";
import { apiService } from "../services/apiService";
import { useMigrationStatus } from "../services/migrationTracking";

import { KAZAKHSTAN_REGIONS } from "../constants";

export default function SiteList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [newSite, setNewSite] = useState({ name: "", url: "", category: "University" as const, region: "" as KZRegion });
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [isFindingUrl, setIsFindingUrl] = useState(false);
  const [manualAddError, setManualAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { status: migrationStatus } = useMigrationStatus();

  useEffect(() => {
    const loadSites = async () => {
      try {
        setLoading(true);
        if (!user) return;
        const data = await apiService.getSites(user.uid);
        const filtered = data.filter(s => s.ownerId === user.uid);
        setSites(filtered);
      } catch (error) {
        console.error("Error loading sites:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSites();
  }, [user, migrationStatus]);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    let urlToSave = newSite.url.trim();
    setIsAddingManually(true);
    setManualAddError(null);
    
    try {
      const siteId = Math.random().toString(36).substring(2, 15);
      await apiService.saveSite({
        id: siteId,
        ...newSite,
        url: urlToSave,
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      } as Site);
      
      const updated = await apiService.getSites(user.uid);
      setSites(updated);
      setShowAddModal(false);
      setNewSite({ name: "", url: "", category: "University", region: "" as KZRegion });
    } catch (error) {
      console.error("Error adding site:", error);
      setManualAddError("Ошибка при сохранении сайта в базу данных.");
    } finally {
      setIsAddingManually(false);
    }
  };

  const handleUpdateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite || !user) return;
    
    setIsAddingManually(true);
    setManualAddError(null);
    
    try {
      await apiService.saveSite(editingSite);
      const updated = await apiService.getSites(user.uid);
      setSites(updated);
      setEditingSite(null);
    } catch (error) {
      console.error("Error updating site:", error);
      setManualAddError("Ошибка при обновлении данных сайта.");
    } finally {
      setIsAddingManually(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!user) return;
    try {
      await apiService.deleteSite(id);
      const updated = await apiService.getSites(user.uid);
      setSites(updated);
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting site:", error);
      setDeletingId(null);
    }
  };

  const handleAiAutofill = async () => {
    if (!newSite.name.trim()) return;
    setIsFindingUrl(true);
    setManualAddError(null);
    try {
      const [fullName, url, region, category] = await Promise.all([
        suggestOfficialName(newSite.name),
        suggestOfficialUrl(newSite.name),
        suggestOrgRegion(newSite.name),
        suggestOrgCategory(newSite.name)
      ]);
      
      setNewSite(prev => ({
        ...prev,
        name: fullName || prev.name,
        url: url || prev.url,
        region: (region as KZRegion) || prev.region,
        category: (category as any) || prev.category
      }));

      if (!url && !region && (!fullName || fullName === newSite.name)) {
        setManualAddError("ИИ не смог найти данные автоматически. Введите адрес и регион вручную.");
      }
    } catch (error) {
      console.error("AI Autofill error:", error);
    } finally {
      setIsFindingUrl(false);
    }
  };

  const categoryIcon = (category: string) => {
    switch (category) {
      case "University": return <GraduationCap className="w-6 h-6" />;
      case "Company": return <Building2 className="w-6 h-6" />;
      case "Government": return <ShieldCheck className="w-6 h-6" />;
      case "Healthcare": return <Activity className="w-6 h-6" />;
      case "Finance": return <Calculator className="w-6 h-6" />;
      case "Non-Profit": return <Heart className="w-6 h-6" />;
      default: return <Globe className="w-6 h-6" />;
    }
  };

  const categoryColor = (category: string) => {
    switch (category) {
      case "University": return "from-blue-500 to-indigo-600 shadow-blue-500/20";
      case "Company": return "from-emerald-500 to-teal-600 shadow-emerald-500/20";
      case "Government": return "from-rose-500 to-red-600 shadow-rose-500/20";
      case "Healthcare": return "from-cyan-500 to-blue-600 shadow-cyan-500/20";
      case "Finance": return "from-amber-500 to-orange-600 shadow-amber-500/20";
      case "Non-Profit": return "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/20";
      default: return "from-gray-500 to-gray-600 shadow-gray-500/20";
    }
  };

  const CategorySelect = ({ value, onChange, disabled }: any) => (
    <select
      disabled={disabled}
      value={value}
      onChange={onChange}
      className="w-full px-5 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer"
    >
      <option value="University">Университет</option>
      <option value="Company">Компания</option>
      <option value="Government">Гос. сектор</option>
      <option value="Healthcare">Здравоохранение</option>
      <option value="Finance">Финансы</option>
      <option value="Non-Profit">НПО / Благотворительность</option>
    </select>
  );

  const filteredSites = sites.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-indigo-400 text-sm font-black uppercase tracking-[0.3em] animate-pulse">Syncing System</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {migrationStatus === 'running' && (
        <div className="glass-card p-6 border-indigo-500/30 bg-indigo-500/5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <p className="text-white font-bold">Migration in Progress</p>
              <p className="text-[#707AA1] text-xs">Moving your sites and audits to the new faster engine...</p>
            </div>
          </div>
          <div className="text-indigo-400 font-mono text-sm font-bold">PLEASE WAIT</div>
        </div>
      )}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-[#22293F]">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Organizations</h1>
          <p className="text-[#707AA1] mt-2 font-medium tracking-wide italic">Strategic registry of Kazakhstani digital ecosystem entities</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group w-full lg:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search registry..."
              className="w-full pl-12 pr-6 py-4 bg-[#1F2641]/50 border border-[#2D3558] rounded-2xl text-sm text-white placeholder-[#4F5A85] focus:ring-2 focus:ring-indigo-500 outline-none transition-all backdrop-blur-md"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4F5A85] group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-[0_5px_20px_rgba(79,70,229,0.3)] group active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="tracking-tight">Add Organization</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredSites.map((site, i) => (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-1 group hover:border-indigo-500/50 transition-all duration-500 relative overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl",
                    categoryColor(site.category)
                  )}>
                    <div className="text-white">
                       {categoryIcon(site.category)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingSite(site)}
                      className="p-3 bg-[#111422] text-[#707AA1] hover:text-indigo-400 border border-[#2D3558] rounded-xl transition-all hover:scale-110 active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {deletingId === site.id ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSite(site.id); }}
                          className="px-3 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-500 shadow-lg shadow-rose-600/20"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                          className="px-3 py-2 bg-[#1F2641] text-[#A6AFC9] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#2D3558]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(site.id); }}
                        className="p-3 bg-[#111422] text-[#707AA1] hover:text-rose-400 border border-[#2D3558] rounded-xl transition-all hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors leading-tight">{site.name}</h3>
                  <div className="flex items-center gap-2 text-[#707AA1] mb-8">
                    <Globe className="w-4 h-4 text-[#2D3558]" />
                    <span className="text-xs font-medium tracking-wide truncate max-w-[200px]">{site.url ? site.url.replace(/^https?:\/\//, '') : 'No URL set'}</span>
                  </div>
                </div>
                
                <div className="flex items-end justify-between pt-8 border-t border-[#22293F]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4F5A85]">Strat. Compliance</span>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-3xl font-black text-indigo-400">{site.lastItaIndex || "0.0"}</span>
                       <span className="text-[10px] font-bold text-[#707AA1] uppercase">ITA</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => navigate(`/audits?siteId=${site.id}`)}
                      className="px-5 py-3 bg-[#1F2641] text-[#A6AFC9] hover:bg-[#2D3558] hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Logs
                    </button>
                    <a 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all border border-indigo-500/20"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#0D111D]/80 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 max-w-lg w-full border-[#2D3558]"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">New Entity</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-[#707AA1] hover:text-white transition-colors"
                disabled={isAddingManually}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {manualAddError && (
              <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center gap-3 text-sm font-bold border border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
                {manualAddError}
              </div>
            )}
            
            <form onSubmit={handleAddSite} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em] flex items-center justify-between">
                  <span>Organization Name</span>
                  {isFindingUrl && <span className="text-indigo-400 animate-pulse font-bold lowercase italic">AI Profiling...</span>}
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D3558] group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    required
                    type="text"
                    disabled={isAddingManually}
                    value={newSite.name}
                    onChange={e => setNewSite({...newSite, name: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-white placeholder-[#2D3558] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="E.g. Nazarbayev University"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">Website URL</label>
                  <button
                    type="button"
                    onClick={handleAiAutofill}
                    disabled={isFindingUrl || !newSite.name.trim()}
                    className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 flex items-center gap-2 disabled:opacity-30 transition-all border border-indigo-500/20 px-3 py-1.5 rounded-lg bg-indigo-500/5 shadow-lg shadow-indigo-500/5 group"
                  >
                    {isFindingUrl ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                    AI Intelligence Fill
                  </button>
                </div>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D3558] group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    disabled={isAddingManually}
                    value={newSite.url}
                    onChange={e => setNewSite({...newSite, url: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-white placeholder-[#2D3558] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="https://nu.edu.kz"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">Category</label>
                  <CategorySelect 
                    value={newSite.category} 
                    onChange={(e: any) => setNewSite({...newSite, category: e.target.value as any})}
                    disabled={isAddingManually}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">Region</label>
                  <select
                    required
                    disabled={isAddingManually}
                    value={newSite.region}
                    onChange={e => setNewSite({...newSite, region: e.target.value as KZRegion})}
                    className="w-full px-5 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    <option value="">Select Region</option>
                    {KAZAKHSTAN_REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button
                  type="button"
                  disabled={isAddingManually}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-8 py-4 bg-[#1F2641] text-[#A6AFC9] rounded-2xl font-bold border border-[#2D3558] hover:bg-[#2D3558] hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingManually}
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-500 transition-all shadow-[0_5px_20px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isAddingManually ? (
                    <div className="flex items-center gap-3">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       <span>Processing...</span>
                    </div>
                  ) : (
                    "Authorize Entity"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {editingSite && (
        <div className="fixed inset-0 bg-[#0D111D]/80 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 max-w-lg w-full border-[#2D3558]"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">Edit Entity</h2>
              <button 
                onClick={() => setEditingSite(null)}
                className="p-2 text-[#707AA1] hover:text-white transition-colors"
                disabled={isAddingManually}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSite} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">Organization Name</label>
                <input
                  required
                  type="text"
                  disabled={isAddingManually}
                  value={editingSite.name}
                  onChange={e => setEditingSite({...editingSite, name: e.target.value})}
                  className="w-full px-5 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">Website URL</label>
                <input
                  required
                  type="url"
                  disabled={isAddingManually}
                  value={editingSite.url}
                  onChange={e => setEditingSite({...editingSite, url: e.target.value})}
                  className="w-full px-5 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">Category</label>
                  <CategorySelect 
                    value={editingSite.category} 
                    onChange={(e: any) => setEditingSite({...editingSite, category: e.target.value as any})}
                    disabled={isAddingManually}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.2em]">Region</label>
                  <select
                    required
                    disabled={isAddingManually}
                    value={editingSite.region}
                    onChange={e => setEditingSite({...editingSite, region: e.target.value as KZRegion})}
                    className="w-full px-5 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Region</option>
                    {KAZAKHSTAN_REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 pt-10">
                <button
                  type="button"
                  disabled={isAddingManually}
                  onClick={() => setEditingSite(null)}
                  className="flex-1 px-8 py-4 bg-[#1F2641] text-[#A6AFC9] rounded-2xl font-bold border border-[#2D3558] hover:bg-[#2D3558] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingManually}
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-500 transition-all shadow-[0_5px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3"
                >
                  {isAddingManually ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

