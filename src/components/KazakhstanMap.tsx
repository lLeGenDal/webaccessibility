import { motion } from "motion/react";
import { useState } from "react";
import { Site, Audit } from "../types";
import { cn } from "../lib/utils";
import { Info, Map as MapIcon, BarChart3, Users } from "lucide-react";
import { normalizeToKzRegion } from "../constants";

interface RegionData {
  id: string;
  name: string;
  path: string;
  cx?: number;
  cy?: number;
}

// Optimized Kazakhstan Regions SVG Paths
const REGIONS: RegionData[] = [
  { id: "WKO", name: "Батыс Қазақстан облысы", path: "M 32,176 L 105,123 L 157,171 L 118,228 L 51,215 Z" },
  { id: "ATY", name: "Атырау облысы", path: "M 40,220 L 115,232 L 135,275 L 75,305 L 35,265 Z" },
  { id: "MAN", name: "Маңғыстау облысы", path: "M 75,310 L 140,280 L 165,355 L 105,425 L 55,385 Z" },
  { id: "AKT", name: "Ақтөбе облысы", path: "M 118,232 L 162,174 L 255,145 L 285,255 L 215,315 L 125,235 Z" },
  { id: "KOS", name: "Қостанай облысы", path: "M 258,55 L 355,85 L 325,215 L 260,235 L 258,145 Z" },
  { id: "ULY", name: "Ұлытау облысы", path: "M 265,240 L 400,225 L 420,315 L 300,345 L 290,260 Z" },
  { id: "KZO", name: "Қызылорда облысы", path: "M 220,320 L 295,350 L 355,415 L 255,445 Z" },
  { id: "SKO", name: "Солтүстік Қазақстан облысы", path: "M 360,35 L 425,45 L 415,90 L 360,85 Z" },
  { id: "AKM", name: "Ақмола облысы", path: "M 360,90 L 445,95 L 455,175 L 330,210 Z" },
  { id: "AST", name: "Астана қ.", cx: 405, cy: 135, path: "" },
  { id: "KAR", name: "Қарағанды облысы", path: "M 405,225 L 545,215 L 575,345 L 420,355 Z" },
  { id: "TUR", name: "Түркістан облысы", path: "M 360,420 L 445,415 L 465,475 L 375,485 Z" },
  { id: "SHY", name: "Шымкент қ.", cx: 415, cy: 455, path: "" },
  { id: "JAM", name: "Жамбыл облысы", path: "M 450,410 L 525,395 L 535,455 L 470,470 Z" },
  { id: "ALM", name: "Алматы облысы", path: "M 540,375 L 605,380 L 610,445 L 540,450 Z" },
  { id: "JET", name: "Жетісу облысы", path: "M 550,265 L 665,275 L 645,375 L 540,370 Z" },
  { id: "ALA", name: "Алматы қ.", cx: 585, cy: 415, path: "" },
  { id: "ABA", name: "Абай облысы", path: "M 600,165 L 725,190 L 675,305 L 585,295 Z" },
  { id: "VKO", name: "Шығыс Қазақстан облысы", path: "M 695,195 L 760,215 L 735,295 L 680,300 Z" },
  { id: "PAV", name: "Павлодар облысы", path: "M 460,80 L 595,100 L 590,195 L 460,170 Z" }
];

const getEnglishRegionName = (name: string): string => {
  const map: Record<string, string> = {
    "West Kazakhstan Region": "West Kazakhstan Region",
    "Atyrau Region": "Atyrau Region",
    "Mangystau Region": "Mangystau Region",
    "Aktobe Region": "Aktobe Region",
    "Kostanay Region": "Kostanay Region",
    "Ulytau Region": "Ulytau Region",
    "Kyzylorda Region": "Kyzylorda Region",
    "North Kazakhstan Region": "North Kazakhstan Region",
    "Akmola Region": "Akmola Region",
    "Astana city": "Astana city",
    "Karaganda Region": "Karaganda Region",
    "Turkestan Region": "Turkestan Region",
    "Shymkent city": "Shymkent city",
    "Zhambyl Region": "Zhambyl Region",
    "Almaty Region": "Almaty Region",
    "Jetisu Region": "Jetisu Region",
    "Almaty city": "Almaty city",
    "Abai Region": "Abai Region",
    "East Kazakhstan Region": "East Kazakhstan Region",
    "Pavlodar Region": "Pavlodar Region",
    
    // Kazakh counterparts
    "Батыс Қазақстан облысы": "West Kazakhstan Region",
    "Атырау облысы": "Atyrau Region",
    "Маңғыстау облысы": "Mangystau Region",
    "Ақтөбе облысы": "Aktobe Region",
    "Қостанай облысы": "Kostanay Region",
    "Ұлытау облысы": "Ulytau Region",
    "Қызылорда облысы": "Kyzylorda Region",
    "Солтүстік Қазақстан облысы": "North Kazakhstan Region",
    "Ақмола облысы": "Akmola Region",
    "Астана қ.": "Astana city",
    "Қарағанды облысы": "Karaganda Region",
    "Түркістан облысы": "Turkestan Region",
    "Шымкент қ.": "Shymkent city",
    "Жамбыл облысы": "Zhambyl Region",
    "Алматы облысы": "Almaty Region",
    "Жетісу облысы": "Jetisu Region",
    "Алматы қ.": "Almaty city",
    "Абай облысы": "Abai Region",
    "Шығыс Қазақстан облысы": "East Kazakhstan Region",
    "Павлодар облысы": "Pavlodar Region"
  };
  return map[name] || name;
};

interface Props {
  sites: Site[];
  audits: Audit[];
}

export default function KazakhstanMap({ sites, audits }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionStats = REGIONS.map(region => {
    const regionSites = sites.filter(s => normalizeToKzRegion(s.region) === region.name);
    const regionAudits = audits.filter(a => regionSites.some(s => s.id === a.siteId));
    
    const avgIta = regionAudits.length > 0 
      ? regionAudits.reduce((acc, curr) => acc + curr.itaIndex, 0) / regionAudits.length 
      : 0;

    return {
      ...region,
      count: regionSites.length,
      avgIta: Number(avgIta.toFixed(1)),
      auditCount: regionAudits.length
    };
  });

  const getRegionColor = (avgIta: number) => {
    if (avgIta === 0) return "fill-slate-100 stroke-slate-200";
    if (avgIta >= 4.0) return "fill-emerald-500 stroke-emerald-600 hover:fill-emerald-400";
    if (avgIta >= 3.0) return "fill-indigo-500 stroke-indigo-600 hover:fill-indigo-400";
    if (avgIta >= 2.0) return "fill-amber-500 stroke-amber-600 hover:fill-amber-400";
    return "fill-rose-500 stroke-rose-600 hover:fill-rose-400";
  };

  const activeRegion = regionStats.find(r => r.name === selectedRegion) || null;

  return (
    <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-indigo-600" />
              Kazakhstan Digital Accessibility Map
            </h2>
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Monitored Sites: {sites.filter(s => s.region).length}</span>
              <span className="text-gray-200">|</span>
              <span>Total Audits: {audits.length}</span>
            </div>
          </div>
          
          <div className="relative bg-slate-50 rounded-2xl p-4 overflow-hidden">
            <svg viewBox="0 0 800 550" className="w-full h-auto drop-shadow-sm">
              {regionStats.filter(r => r.path).map((region) => (
                <motion.path
                  key={region.id}
                  d={region.path}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    getRegionColor(region.avgIta),
                    selectedRegion === region.name ? "opacity-100 stroke-2" : "opacity-80"
                  )}
                  onMouseEnter={() => setSelectedRegion(region.name)}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              ))}
              
              {/* Cities as points */}
              {regionStats.filter(r => r.cx && r.cy).map((city) => (
                <motion.circle
                  key={city.id}
                  cx={city.cx}
                  cy={city.cy}
                  r={8}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    getRegionColor(city.avgIta),
                    selectedRegion === city.name ? "stroke-white stroke-2" : ""
                  )}
                  onMouseEnter={() => setSelectedRegion(city.name)}
                />
              ))}
            </svg>

            <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span>Optimized (4.0+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span>Integrated (3.0+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span>Basic (2.0+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                <span>Critical (&lt;2.0)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-4">Region Statistics</h3>
            {activeRegion ? (
              <motion.div 
                key={activeRegion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <p className="text-xl font-black mb-6 leading-tight">{getEnglishRegionName(activeRegion.name)}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase opacity-60">Avg ITA Index</p>
                    <p className="text-2xl font-black">{activeRegion.avgIta || "—"}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase opacity-60">Sites</p>
                    <p className="text-2xl font-black">{activeRegion.count}</p>
                  </div>
                </div>
                <div className="mt-4 bg-white/10 p-4 rounded-2xl flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 opacity-60" />
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-60">Audits Performed</p>
                    <p className="text-lg font-bold">{activeRegion.auditCount}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center opacity-60">
                <Info className="w-8 h-8 mb-2" />
                <p className="text-sm">Hover over a region name on the map to inspect metrics</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex-1 overflow-y-auto max-h-[300px]">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Top Performing Regions
             </h3>
             <div className="space-y-3">
                {regionStats
                  .filter(r => r.count > 0)
                  .sort((a, b) => b.avgIta - a.avgIta)
                  .map((r, idx) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-300">#0{idx+1}</span>
                        <p className="text-xs font-bold text-gray-700 truncate w-32">{getEnglishRegionName(r.name)}</p>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black",
                        r.avgIta >= 4.0 ? "bg-emerald-100 text-emerald-600" :
                        r.avgIta >= 3.0 ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {r.avgIta}
                      </span>
                    </div>
                  ))
                }
                {regionStats.filter(r => r.count > 0).length === 0 && (
                  <p className="text-center text-xs text-gray-400 mt-10">No ranking data available</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
