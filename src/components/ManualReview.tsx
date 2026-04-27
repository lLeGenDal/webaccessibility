import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Audit, Issue, Site } from "../types";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ArrowLeft, Search, Filter, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { cn } from "../lib/utils";

export default function ManualReview() {
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
    if (!auditId) return;

    const fetchData = async () => {
      const auditSnap = await getDoc(doc(db, "audits", auditId));
      if (auditSnap.exists()) {
        const auditData = { id: auditSnap.id, ...auditSnap.data() } as Audit;
        setAudit(auditData);

        const siteSnap = await getDoc(doc(db, "sites", auditData.siteId));
        if (siteSnap.exists()) {
          setSite({ id: siteSnap.id, ...siteSnap.data() } as Site);
        }

        const issuesSnap = await getDocs(query(collection(db, "issues"), where("auditId", "==", auditId)));
        const issuesData = issuesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
        setIssues(issuesData);
        
        // Initialize comments
        const initialComments: Record<string, string> = {};
        issuesData.forEach(i => {
          if (i.comment) initialComments[i.id] = i.comment;
        });
        setComments(initialComments);
      }
      setLoading(false);
    };

    fetchData();
  }, [auditId]);

  const updateStatus = async (issueId: string, status: "Confirmed" | "Rejected") => {
    try {
      const comment = comments[issueId] || "";
      await updateDoc(doc(db, "issues", issueId), { status, comment });
      const updatedIssues = issues.map(i => i.id === issueId ? { ...i, status, comment } : i);
      setIssues(updatedIssues);

      // Recalculate Assessment
      const { calculateInternalAssessment } = await import("../services/scoringService");
      const { internalScore, itaIndex, maturityLevel, pourScores, wcagBreakdown } = calculateInternalAssessment(updatedIssues);
      
      const allManualAddressed = updatedIssues
        .filter(i => i.engine === "Manual")
        .every(i => i.status !== "Pending");

      if (auditId) {
        await updateDoc(doc(db, "audits", auditId), {
          internalScore,
          itaIndex,
          maturityLevel,
          pourScores,
          wcagBreakdown,
          manualReviewCompleted: allManualAddressed
        });

        // Update site document
        if (audit) {
          await updateDoc(doc(db, "sites", audit.siteId), {
            lastItaIndex: itaIndex
          });
        }
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    }
  };

  const handleAddManualIssue = async () => {
    if (!auditId || !newIssue.description) return;
    
    try {
      const issueData = {
        auditId,
        criterion: newIssue.criterion,
        severity: newIssue.severity,
        description: newIssue.description,
        recommendation: newIssue.recommendation,
        principle: newIssue.principle,
        wcagLevel: "A", // Default to A, expert can refine or we could add a selector
        engine: "Manual",
        status: "Confirmed",
        source: "Expert Review",
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "issues"), issueData);
      const addedIssue = { id: docRef.id, ...issueData } as Issue;
      
      const updatedIssues = [...issues, addedIssue];
      setIssues(updatedIssues);
      setShowAddIssue(false);
      setNewIssue({ criterion: "1.1.1", severity: "Medium", description: "", recommendation: "", principle: "perceivable" });

      // Recalculate
      const { calculateInternalAssessment } = await import("../services/scoringService");
      const { internalScore, itaIndex, maturityLevel, pourScores, wcagBreakdown } = calculateInternalAssessment(updatedIssues);
      
      await updateDoc(doc(db, "audits", auditId), {
        internalScore,
        itaIndex,
        maturityLevel,
        pourScores,
        wcagBreakdown
      });
      
      if (audit) {
        await updateDoc(doc(db, "sites", audit.siteId), {
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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!audit || !site) return <div className="text-center py-20 text-gray-500">Аудит не найден.</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ручная проверка: {site.name}</h1>
          <p className="text-gray-500 mt-1">Подтвердите выявленные проблемы или добавьте новые экспертные замечания.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddIssue(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5" /> Добавить замечание
          </button>
          <Link to={`/audit/${auditId}`} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" /> К результатам
          </Link>
        </div>
      </header>

      {showAddIssue && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 space-y-6"
        >
          <h2 className="text-xl font-bold text-indigo-900">Новое экспертное замечание</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-indigo-700 mb-2">Критерий WCAG</label>
              <input 
                type="text" 
                value={newIssue.criterion}
                onChange={e => setNewIssue({...newIssue, criterion: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="например, 1.1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-indigo-700 mb-2">Критичность</label>
              <select 
                value={newIssue.severity}
                onChange={e => setNewIssue({...newIssue, severity: e.target.value as any})}
                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Low">Низкая</option>
                <option value="Medium">Средняя</option>
                <option value="High">Высокая</option>
                <option value="Critical">Критическая</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-indigo-700 mb-2">Описание проблемы</label>
            <textarea 
              value={newIssue.description}
              onChange={e => setNewIssue({...newIssue, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
              placeholder="Опишите, что именно не так..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-indigo-700 mb-2">Рекомендация по исправлению</label>
            <textarea 
              value={newIssue.recommendation}
              onChange={e => setNewIssue({...newIssue, recommendation: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
              placeholder="Как это исправить?"
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleAddManualIssue}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Сохранить замечание
            </button>
            <button 
              onClick={() => setShowAddIssue(false)}
              className="px-8 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-50 transition-all"
            >
              Отмена
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Filter className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2">
          {(["Pending", "Confirmed", "Rejected", "All"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                filter === f 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
            >
              {f === "Pending" ? "Ожидают" : f === "Confirmed" ? "Подтверждены" : f === "Rejected" ? "Отклонены" : "Все"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6"
            >
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      issue.severity === 'Critical' ? "bg-red-100 text-red-600" :
                      issue.severity === 'High' ? "bg-orange-100 text-orange-600" :
                      issue.severity === 'Medium' ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {issue.severity}
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{issue.criterion}</span>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{issue.engine}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900">{issue.description}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{issue.recommendation}</p>
                  
                  {issue.element && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <code className="text-xs text-indigo-600 font-mono break-all">{issue.element}</code>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                  <button
                    onClick={() => updateStatus(issue.id, "Confirmed")}
                    className={cn(
                      "flex-1 md:w-40 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all",
                      issue.status === "Confirmed" 
                        ? "bg-green-600 text-white shadow-lg" 
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5" /> Подтвердить
                  </button>
                  <button
                    onClick={() => updateStatus(issue.id, "Rejected")}
                    className={cn(
                      "flex-1 md:w-40 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all",
                      issue.status === "Rejected" 
                        ? "bg-red-600 text-white shadow-lg" 
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    )}
                  >
                    <XCircle className="w-5 h-5" /> Отклонить
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Комментарий эксперта</label>
                <textarea 
                  value={comments[issue.id] || ""}
                  onChange={e => handleCommentChange(issue.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-gray-50/50"
                  placeholder="Добавьте пояснение к вашему решению..."
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Нет проблем, соответствующих фильтру.</p>
          </div>
        )}
      </div>
    </div>
  );
}
