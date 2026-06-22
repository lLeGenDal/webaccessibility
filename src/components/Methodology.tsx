import { motion } from "motion/react";
import { ChevronLeft, Calculator, Layers, Search, ShieldCheck, BrainCircuit, Landmark, BadgeCheck, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Methodology() {
  const itaLevels = [
    { level: 5, status: "Optimized", color: "text-emerald-600 bg-emerald-50", criteria: "0 errors across all categories (A, AA, AAA)", desc: "Full conformity with WCAG 2.2 AAA guidelines." },
    { level: 4, status: "Integrated", color: "text-blue-600 bg-blue-50", criteria: "0 errors in Level A and AA criteria", desc: "Solid AA compliance. Minor AAA enhancement opportunities permissable." },
    { level: 3, status: "Defined", color: "text-amber-600 bg-amber-50", criteria: "0 errors in Level A criteria", desc: "All critical barriers eliminated. Active work required on Level AA standard." },
    { level: 2, status: "Initial", color: "text-orange-600 bg-orange-50", criteria: "Level A errors between 1 and 10", desc: "Significant barriers exist, periodically blocking users from key segments." },
    { level: 1, status: "Inactive", color: "text-red-600 bg-red-50", criteria: "Level A errors exceed 10", desc: "Heavy violations. Core digital resource is practically inaccessible." },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-900">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Methodology and Formulas</h1>
          <p className="text-gray-500 mt-1">How we calculate digital accessibility and integrate multi-layered audit telemetry streams.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calculator className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">ITA Index Assessment</h2>
          </div>
          
          <div className="space-y-4">
            {itaLevels.map((l) => (
              <div key={l.level} className="p-4 rounded-2xl border border-gray-100 flex items-start gap-4 hover:shadow-md transition-all">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0", l.color)}>
                  {l.level}.0
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{l.status}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">{l.criteria}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase mb-4 tracking-widest">Central ITA Index Formula</h3>
            <div className="font-mono text-xs bg-gray-900 text-gray-300 p-4 rounded-xl leading-relaxed">
              ITA = 5.0 - (Σ A × 0.5) - (Σ AA × 0.2) - (Σ AAA × 0.05)
              <br /><br />
              Deductions:<br />
              - Level A (Critical)  = -0.50<br />
              - Level AA (Standard) = -0.20<br />
              - Level AAA (Enhanced) = -0.05<br /><br />
              Verification Weights:<br />
              - Internal Engine: 0.40 weight<br />
              - Axe Core / Lighthouse: 0.30 weight<br />
              - Gemini AI Semantic Suite: 0.30 weight
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Service Integration Matrix</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Internal Engine", icon: Search, color: "text-indigo-600", desc: "Proprietary parser assessing page hierarchy and code structures against WCAG 2.2.", role: "Architectural Audit" },
                { name: "Axe Core 4.8", icon: ShieldCheck, color: "text-blue-600", desc: "The technical industry standard for deterministic checks. Catches 100% programmatic errors.", role: "Technical Audit" },
                { name: "Gemini AI", icon: BrainCircuit, color: "text-violet-600", desc: "AI assessments of semantic alt text quality and screen reader logical flows.", role: "Semantic Audit" },
                { name: "Lighthouse", icon: Landmark, color: "text-amber-500", desc: "Google tool for scanning baseline web accessibility scores and core vitals.", role: "Google Standards" },
                { name: "Contrast Analyzer", icon: Eye, color: "text-emerald-600", desc: "Multi-layered color contrast rendering checks verifying compliance levels (WCAG 1.4.3 / 1.4.6).", role: "Visual Comfort" },
                { name: "Expert Review", icon: BadgeCheck, color: "text-indigo-600", desc: "Manual validator reviews covering edge cases and complex user interactive state trees.", role: "Final Verification" },
              ].map((s) => (
                <div key={s.name} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm", s.color)}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{s.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">{s.role}</p>
                    <p className="text-sm text-gray-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
            <Calculator className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12" />
            <h2 className="text-xl font-bold mb-4">Data Lifecycle Pipeline</h2>
            <div className="space-y-4 relative z-10">
              <div className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-white text-indigo-900 flex items-center justify-center text-[10px] font-black">1</div>
                  <div className="w-0.5 h-full bg-white/20 my-1"></div>
                </div>
                <div>
                  <p className="font-bold text-sm">1. Data Coalescence</p>
                  <p className="text-xs text-indigo-100">Simultaneous, non-blocking execution of all integrated APIs and scanners to gather raw site metrics.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-white text-indigo-900 flex items-center justify-center text-[10px] font-black">2</div>
                  <div className="w-0.5 h-full bg-white/20 my-1"></div>
                </div>
                <div>
                  <p className="font-bold text-sm">2. Context Normalization</p>
                  <p className="text-xs text-indigo-100">Standardizing and mapping distinct formats of telemetry reports into structured WCAG criterion, principles, and severities.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-white text-indigo-900 flex items-center justify-center text-[10px] font-black">3</div>
                </div>
                <div>
                  <p className="font-bold text-sm">3. Centralized Aggregation</p>
                  <p className="text-xs text-indigo-100">Performing fractional deductions on calculated errors to compute a centralized, weighted ITA compliance value.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
