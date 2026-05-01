import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Site, Issue, Audit } from "../types";
import { useNavigate } from "react-router-dom";
import { runAxeAudit } from "../services/axeService";
import { runCustomScanner } from "../services/customScanner";
import { runAISemanticAudit, runAIPreAudit, runAIFinalSynthesis } from "../services/geminiAuditService";
import { calculateInternalAssessment, getWCAGMetadata } from "../services/scoringService";
import { 
  ClipboardCheck, Search, Loader2, AlertCircle, ShieldCheck, Zap, 
  Globe, Sparkles, BrainCircuit 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiService } from "../services/apiService";

export default function AuditForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [manualHtml, setManualHtml] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const focusManualInput = () => {
    setTimeout(() => {
      const el = document.getElementById("manual-html-input");
      el?.focus();
    }, 100);
  };

  useEffect(() => {
    const fetchSites = async () => {
      try {
        if (!user) return;
        const data = await apiService.getSites(user.uid);
        setSites(data);
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };
    fetchSites();
  }, [user]);

  const handleStartAudit = async (providedHtml?: string) => {
    if (!selectedSiteId || !user) return;
    
    const site = sites.find(s => s.id === selectedSiteId);
    if (!site) return;

    setIsAuditing(true);
    setError(null);

    try {
      let html = typeof providedHtml === "string" ? providedHtml : "";
      
      if (!html) {
        if (!site.url) {
          setShowManualInput(true);
          throw new Error("System Alert: Entity missing endpoint URL. Procedural manual override required.");
        }
        
        // 1. Fetch HTML
        setAuditStep("Initializing Extraction...");
        const proxyResponse = await fetch(`/api/proxy?url=${encodeURIComponent(site.url)}`);
        
        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json().catch(() => ({ error: "Endpoint unreachable." }));
          setShowManualInput(true);
          throw new Error(errorData.error || "Tactical bypass required: External endpoint shielding detected.");
        }
        
        html = await proxyResponse.text();
      }

      if (!html || html.length < 50) {
        throw new Error("Data corruption: Extracted payload insufficient for analysis.");
      }

      // 1. Stage 1: AI Pre-Audit
      setAuditStep("Neural Contextualization: AI Scanning Architecture...");
      const preAuditStrategicFocus = await runAIPreAudit(html);

      // 2. Stage 2: Technical Scans
      setAuditStep("Axe-Core: Technical Deep Scan...");
      const axeResults = await runAxeAudit(html);

      setAuditStep("Core Engines: Multi-layered Structural Audit...");
      const internalResults = runCustomScanner(html);
      
      const rawIssues: Issue[] = [
        ...axeResults.issues.map(i => ({ ...i, status: "Confirmed", auditId: "temp" } as Issue)),
        ...internalResults.issues.map(i => ({ ...i, status: "Confirmed", auditId: "temp", engine: "Internal" as const } as Issue))
      ];

      // 3. Stage 3: AI Intelligence (Semantic, Logic, Strategy)
      setAuditStep("Neural Process: AI Strategic Pattern Recognition...");
      const aiAnalysis = await runAISemanticAudit(site.url, html, rawIssues);

      // 4. Synthesis & Score Calculation
      setAuditStep("AI Synthesis: Aggregating Multi-Modal Findings...");
      
      const allIssues: Issue[] = [
        ...rawIssues,
        ...aiAnalysis.issues.map(i => ({ 
          ...i, 
          status: "Confirmed", 
          auditId: "temp",
          principle: i.criterion ? getWCAGMetadata(i.criterion).principle : "perceivable"
        } as Issue))
      ];

      const uniqueIssuesMap = new Map<string, Issue>();
      allIssues.forEach(issue => {
          const key = `${issue.criterion}-${issue.element?.substring(0, 50) || issue.description.substring(0, 50)}`;
          if (!uniqueIssuesMap.has(key)) {
              uniqueIssuesMap.set(key, issue);
          }
      });
      const finalIssues = Array.from(uniqueIssuesMap.values());
      const finalAssessment = calculateInternalAssessment(finalIssues);

      // 5. Stage 4: AI Final Report
      setAuditStep("Generating AI Executive Report...");
      const finalSummary = await runAIFinalSynthesis({
        ...finalAssessment,
        aiScore: aiAnalysis.aiScore,
        axeScore: axeResults.score
      }, finalIssues);

      // 6. Save to Database
      setAuditStep("Finalizing Report: Encrypting Strategic Intelligence...");
      const auditId = Math.random().toString(36).substring(2, 15);
      const auditData: Audit = {
        id: auditId,
        siteId: site.id,
        date: new Date().toISOString(),
        internalScore: finalAssessment.internalScore,
        axeScore: axeResults.score,
        aiScore: aiAnalysis.aiScore,
        lighthouseScore: finalAssessment.lighthouseScore,
        contrastScore: finalAssessment.contrastScore,
        itaIndex: finalAssessment.itaIndex,
        maturityLevel: finalAssessment.maturityLevel,
        manualReviewCompleted: false,
        region: site.region,
        wcagBreakdown: finalAssessment.wcagBreakdown,
        aiInsights: {
          semanticAltQuality: aiAnalysis.semanticAltQuality,
          labelClarity: aiAnalysis.labelClarity,
          navigationLogic: aiAnalysis.navigationLogic,
          recommendations: aiAnalysis.recommendations
        },
        strategicReview: aiAnalysis.strategicReview,
        summary: finalSummary,
        wcagVersion: "2.2",
        pourScores: finalAssessment.pourScores,
        ownerId: user.uid
      };

      await apiService.saveAudit(auditData);

      const issuesToSave = finalIssues.map(issue => ({
        ...issue,
        id: issue.id || Math.random().toString(36).substring(2, 15),
        auditId: auditId
      }));
      await apiService.saveIssues(issuesToSave);

      // Update site last scores
      await apiService.saveSite({
        ...site,
        lastInternalScore: finalAssessment.internalScore,
        lastItaIndex: finalAssessment.itaIndex,
      });

      navigate(`/audit/${auditId}`);
    } catch (err: any) {
      console.error("Audit failed:", err);
      const isNetworkError = err.message.includes("bypass") || err.message.includes("shielding") || err.message.includes("unreachable") || err.message.includes("endpoint");
      if (isNetworkError) {
        setShowManualInput(true);
        setTimeout(focusManualInput, 300);
      }
      setError(err.message || "Strategic failure: Connection to target sector severed.");
    } finally {
      setIsAuditing(false);
      setAuditStep("");
    }
  };

  const handleManualToggle = () => {
    setShowManualInput(!showManualInput);
    if (!showManualInput) focusManualInput();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <motion.div 
        layout
        className="glass-card p-12 border-[#2D3558] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8">
           <Zap className="w-8 h-8 text-indigo-500/20" />
        </div>

        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
          <ClipboardCheck className="text-white w-10 h-10" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Initiate StratAudit</h1>
        <p className="text-[#707AA1] mb-12 font-medium tracking-wide">Select target organization for comprehensive WCAG 2.2 analysis.</p>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-[#707AA1] uppercase tracking-[0.3em]">Operational Target</label>
              <button 
                onClick={handleManualToggle}
                className="text-[10px] font-black text-indigo-400 underline decoration-indigo-400/30 underline-offset-4 uppercase tracking-widest hover:text-indigo-300 transition-colors"
              >
                {showManualInput ? "[ Disable Code Inject ]" : "[ Use Code Inject ]"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D3558] group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Filter targets..."
                  value={siteFilter}
                  onChange={e => setSiteFilter(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-sm text-white placeholder-[#2D3558] focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D3558] group-focus-within:text-indigo-400 transition-colors" />
                <select
                  value={selectedSiteId}
                  onChange={e => setSelectedSiteId(e.target.value)}
                  disabled={isAuditing}
                  className="w-full pl-12 pr-6 py-4 bg-[#161B31] border border-[#2D3558] rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select organizational entity...</option>
                  {sites
                    .filter(s => s.name.toLowerCase().includes(siteFilter.toLowerCase()))
                    .map(site => (
                      <option key={site.id} value={site.id}>{site.name} {site.url ? `(${site.url.replace(/^https?:\/\//, '')})` : ""}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div className="p-6 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center gap-4 border border-rose-500/20">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black uppercase tracking-widest text-xs">Security Protocol Alert</p>
                    <p className="text-sm font-medium opacity-80 leading-relaxed truncate max-w-sm">{error}</p>
                  </div>
                </div>
                
                {!showManualInput && (
                  <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 space-y-6">
                    <div className="flex items-start gap-4">
                       <BrainCircuit className="w-6 h-6 text-indigo-400 shrink-0" />
                       <p className="text-xs text-[#707AA1] leading-relaxed font-medium">
                         <span className="text-indigo-400 font-black uppercase tracking-[0.2em] block mb-2">Protocol Insight</span>
                         Public sector endpoints (.gov.kz, .edu.kz) utilize high-level cloud firewall shielding. Automated crawlers are often preemptively terminated.
                       </p>
                    </div>
                    <button 
                      onClick={() => setShowManualInput(true)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-[0_5px_15px_rgba(79,70,229,0.2)]"
                    >
                      Bypass Shielding (Manual Code Inject)
                    </button>
                    <div className="flex items-center justify-center gap-2">
                       <span className="text-[9px] text-[#4F5A85] font-bold uppercase tracking-widest">Guide: Press CTRL+U on target site and copy source</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {showManualInput && !isAuditing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div className="relative group">
                  <div className="absolute top-4 right-4 text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">Source Buffer</div>
                  <textarea 
                    id="manual-html-input"
                    value={manualHtml}
                    onChange={e => setManualHtml(e.target.value)}
                    className="w-full h-64 px-8 py-8 bg-[#111422] border border-[#2D3558] rounded-3xl text-sm text-[#A6AFC9] font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-[#2D3558]"
                    placeholder="<!-- Paste original HTML source code here for neural processing -->"
                  />
                </div>
                <button
                  onClick={() => handleStartAudit(manualHtml)}
                  disabled={!manualHtml.trim() || !selectedSiteId}
                  className="w-full py-5 bg-white text-[#111422] rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                  Confirm Neural Scan
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isAuditing ? (
            <div className="space-y-6 pt-10">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
                </div>
                <div className="text-center">
                  <p className="font-black text-white uppercase tracking-[0.3em] text-sm animate-pulse">{auditStep}</p>
                  <p className="text-[10px] text-[#707AA1] font-bold uppercase tracking-widest mt-2">StratAudit Process in Progress</p>
                </div>
              </div>
              <div className="w-full bg-[#161B31] h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 12, ease: "easeInOut" }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleStartAudit()}
              disabled={!selectedSiteId || isAuditing}
              className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.4em] text-sm hover:bg-indigo-500 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <ShieldCheck className="w-6 h-6 group-hover:scale-125 transition-transform" />
              <span>Analyze Infrastructure</span>
            </button>
          )}
        </div>

        <div className="mt-16 pt-10 border-t border-[#22293F] grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Search className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-widest mb-2">Technical Probing</p>
              <p className="text-xs text-[#A6AFC9] leading-relaxed font-medium">
                Deep structure, contrast differentials, and automated accessibility scans.
              </p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <ClipboardCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#707AA1] uppercase tracking-widest mb-2">Compliance Grade</p>
              <p className="text-xs text-[#A6AFC9] leading-relaxed font-medium">
                Comprehensive verification against finalized WCAG 2.2 standards.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

