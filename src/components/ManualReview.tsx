import { useState, useEffect } from "react";
import { Audit, Issue, Site } from "../types";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ArrowLeft, Search, Filter, Plus, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { apiService } from "../services/apiService";
import { useAuth } from "../App";

export default function ManualReview() {
  const { user } = useAuth();
  const { auditId } = useParams<{ auditId: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Pending" | "Confirmed" | "Rejected">("Pending");

  const [newIssue, setNewIssue] = useState({
    criterion: "1.1.1",
    severity: "Medium" as const,
    description: "",
    recommendation: "",
    principle: "perceivable" as const
  });
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!auditId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const auditData = await apiService.getAuditById(auditId);
        if (auditData) {
          setAudit(auditData);

          const sitesData = await apiService.getSites(user.id);
          const foundSite = sitesData.find(s => s.id === auditData.siteId);
          if (foundSite) {
            setSite(foundSite);
          }

          const issuesData = await apiService.getIssues(auditId);
          setIssues(issuesData);
          
          // Initialize comments
          const initialComments: Record<string, string> = {};
          issuesData.forEach(i => {
            if (i.comment) initialComments[i.id] = i.comment;
          });
          setComments(initialComments);
        }
      } catch (error) {
        console.error("Error fetching manual review data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auditId, user]);

  const updateStatus = async (issueId: string, status: "Confirmed" | "Rejected") => {
    try {
      const comment = comments[issueId] || "";
      const updatedIssues = issues.map(i => i.id === issueId ? { ...i, status, comment } : i);
      setIssues(updatedIssues);

      // Recalculate Assessment
      const { calculateInternalAssessment } = await import("../services/scoringService");
      const { internalScore, itaIndex, maturityLevel, pourScores, wcagBreakdown } = calculateInternalAssessment(updatedIssues);
      
      const allManualAddressed = updatedIssues
        .filter(i => i.engine === "Manual")
        .every(i => i.status !== "Pending");

      if (auditId && audit) {
        // Save issues back to batch
        await apiService.saveIssues(updatedIssues);

        const updatedAudit = {
          ...audit,
          internalScore,
          itaIndex,
          maturityLevel,
          pourScores,
          wcagBreakdown,
          manualReviewCompleted: allManualAddressed
        };
        await apiService.saveAudit(updatedAudit);
        setAudit(updatedAudit);

        // Update site document
        if (site) {
          await apiService.saveSite({
            ...site,
            lastItaIndex: itaIndex
          });
        }
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    }
  };

  const handleAddManualIssue = async () => {
    if (!auditId || !newIssue.description || !audit) return;
    
    try {
      const issueData = {
        id: `manual_${Math.random().toString(36).substring(2, 11)}`,
        auditId,
        criterion: newIssue.criterion,
        severity: newIssue.severity,
        description: newIssue.description,
        recommendation: newIssue.recommendation,
        principle: newIssue.principle,
        wcagLevel: "A", 
        engine: "Manual",
        status: "Confirmed",
        source: "Expert Review",
        createdAt: new Date().toISOString()
      };

      const updatedIssues = [...issues, issueData as Issue];
      setIssues(updatedIssues);
      setShowAddIssue(false);
      setNewIssue({ criterion: "1.1.1", severity: "Medium", description: "", recommendation: "", principle: "perceivable" });

      // Save issues
      await apiService.saveIssues(updatedIssues);

      // Recalculate
      const { calculateInternalAssessment } = await import("../services/scoringService");
      const { internalScore, itaIndex, maturityLevel, pourScores, wcagBreakdown } = calculateInternalAssessment(updatedIssues);
      
      const updatedAudit = {
        ...audit,
        internalScore,
        itaIndex,
        maturityLevel,
        pourScores,
        wcagBreakdown,
      };
      await apiService.saveAudit(updatedAudit);
      setAudit(updatedAudit);
      
      if (site) {
        await apiService.saveSite({
          ...site,
          lastItaIndex: itaIndex
        });
      }
    } catch (error) {
      console.error("Error adding manual issue:", error);
    }
  };

  const handleCommentChange = (issueId: string, value: string) => {
    setComments(prev => ({ ...prev, [issueId]: value }));
  };

  const filteredIssues = issues.filter(i => {
    if (filter === "All") return true;
    return i.status === filter;
  });

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-indigo-400 text-sm font-black uppercase tracking-[0.3em] animate-pulse">Syncing Review Engine</p>
    </div>
  );
  
  if (!audit || !site) return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-[#161B31] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#2D3558]">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Audit Not Found</h3>
      <p className="text-[#707AA1] font-medium mb-8">The requested assessment does not exist in the local registry.</p>
      <Link to="/audits" className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center justify-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Return to Logs
      </Link>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-[#22293F]">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase tracking-[0.05em]">Expert Validation: <span className="text-indigo-400">{site.name}</span></h1>
          <p className="text-[#707AA1] mt-2 font-medium italic">Validate automated findings or append specific architectural accessibility violations.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddIssue(true)}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Append Finding
          </button>
          <Link to={`/audit/${auditId}`} className="flex items-center gap-2 px-6 py-4 bg-[#111422] text-[#707AA1] rounded-2xl border border-[#2D3558] hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> <span className="font-bold text-sm tracking-tight">To Results</span>
          </Link>
        </div>
      </header>

      {showAddIssue && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 border-indigo-500/30 bg-indigo-500/5 space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">New Expert Finding</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em]">WCAG Success Criterion</label>
              <input 
                type="text" 
                value={newIssue.criterion}
                onChange={e => setNewIssue({...newIssue, criterion: e.target.value})}
                className="w-full px-6 py-4 bg-[#0D111D] rounded-2xl border border-[#2D3558] text-white placeholder-[#2D3558] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. 1.1.1"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em]">Impact Severity</label>
              <select 
                value={newIssue.severity}
                onChange={e => setNewIssue({...newIssue, severity: e.target.value as any})}
                className="w-full px-6 py-4 bg-[#0D111D] rounded-2xl border border-[#2D3558] text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="Low">Low (Optimization)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="High">High (Serious Barrier)</option>
                <option value="Critical (Blocker)">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em]">Issue Description</label>
              <textarea 
                value={newIssue.description}
                onChange={e => setNewIssue({...newIssue, description: e.target.value})}
                className="w-full px-6 py-4 bg-[#0D111D] rounded-2xl border border-[#2D3558] text-white placeholder-[#2D3558] focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none"
                placeholder="Describe the accessibility barrier..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em]">Technical Recommendation</label>
              <textarea 
                value={newIssue.recommendation}
                onChange={e => setNewIssue({...newIssue, recommendation: e.target.value})}
                className="w-full px-6 py-4 bg-[#0D111D] rounded-2xl border border-[#2D3558] text-white placeholder-[#2D3558] focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none"
                placeholder="How to resolve this violation..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleAddManualIssue}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              Commit Finding
            </button>
            <button 
              onClick={() => setShowAddIssue(false)}
              className="px-10 py-4 bg-[#111422] text-[#707AA1] rounded-2xl border border-[#2D3558] font-bold text-sm hover:text-white transition-all shadow-xl"
            >
              Discard
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 glass-card border-[#2D3558]">
        <div className="flex flex-wrap gap-3">
          {(["Pending", "Confirmed", "Rejected", "All"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                filter === f 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                  : "bg-[#111422] text-[#4F5A85] hover:text-white border border-[#2D3558]"
              )}
            >
              {f === "Pending" ? "Awaiting Review" : f === "Confirmed" ? "Verified" : f === "Rejected" ? "Discarded" : "All Results"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[#4F5A85] text-[10px] font-black uppercase tracking-[0.2em] bg-[#111422] px-6 py-3 rounded-2xl border border-[#2D3558]">
          <Filter className="w-4 h-4" />
          Refinement Filter
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-10 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="flex-1 space-y-8">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                      issue.severity === 'Critical' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      issue.severity === 'High' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      issue.severity === 'Medium' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : 
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em] bg-[#111422] px-3 py-1 rounded-lg border border-[#2D3558]">{issue.criterion}</span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{issue.engine} Engine</span>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-colors uppercase mb-4">{issue.description}</h3>
                    <div className="p-6 bg-[#0D111D] rounded-3xl border border-[#1F2641]">
                      <p className="text-[#707AA1] text-sm leading-relaxed font-medium italic mb-2 tracking-wide uppercase text-[10px] font-black tracking-[0.2em]">Strategy for Resolution</p>
                      <p className="text-[#A6AFC9] text-base leading-relaxed">{issue.recommendation}</p>
                    </div>
                  </div>
                  
                  {issue.element && (
                    <div className="p-6 bg-[#090C14] rounded-2xl border border-[#1F2641] shadow-inner overflow-x-auto">
                      <p className="text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.2em] mb-4">DOM Identifier / Node Element</p>
                      <code className="text-xs text-indigo-400 font-mono break-all leading-relaxed whitespace-pre-wrap">{issue.element}</code>
                    </div>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-48 shrink-0">
                  <button
                    onClick={() => updateStatus(issue.id, "Confirmed")}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-3xl font-black uppercase tracking-[0.1em] text-[10px] transition-all shadow-xl shadow-green-900/10 active:scale-95",
                      issue.status === "Confirmed" 
                        ? "bg-green-600 text-white border-none shadow-green-600/20" 
                        : "bg-green-500/5 text-green-400 border border-green-500/20 hover:bg-green-500/10"
                    )}
                  >
                    <CheckCircle2 className="w-8 h-8" /> Commit
                  </button>
                  <button
                    onClick={() => updateStatus(issue.id, "Rejected")}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-3xl font-black uppercase tracking-[0.1em] text-[10px] transition-all shadow-xl shadow-rose-900/10 active:scale-95",
                      issue.status === "Rejected" 
                        ? "bg-rose-600 text-white border-none shadow-rose-600/20" 
                        : "bg-rose-500/5 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10"
                    )}
                  >
                    <XCircle className="w-8 h-8" /> Discard
                  </button>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-[#1F2641]">
                <label className="block text-[10px] font-black text-[#4F5A85] uppercase tracking-[0.3em] mb-4">Expert Justification / Remediation Notes</label>
                <textarea 
                  value={comments[issue.id] || ""}
                  onChange={e => handleCommentChange(issue.id, e.target.value)}
                  className="w-full px-8 py-5 bg-[#0D111D] rounded-3xl border border-[#2D3558] border-dashed text-white placeholder-[#2D3558] focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all h-24 resize-none"
                  placeholder="Append expert context for developers..."
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-card border-dashed border-[#2D3558] py-20 text-center">
            <HelpCircle className="w-20 h-20 text-[#2D3558] mx-auto mb-6" />
            <p className="text-[#707AA1] font-bold text-xl uppercase tracking-tighter">No items matching current refinement.</p>
          </div>
        )}
      </div>
    </div>
  );
}
