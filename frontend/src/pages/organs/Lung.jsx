////////////////////////////////////////////////////////////////////
//
// File Name : Lung.jsx
// Description : COPD Two-Stage AI — Medical Dashboard (Light Theme)
// Author      : Pradhumnya Changdev Kalsait
// Date        : 27/02/26
// Design Ref  : OnlyLiver topology — JetBrains Mono + Syne, card strips,
//               badge chips, stat bars — adapted for clinical light theme
////////////////////////////////////////////////////////////////////

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Loader2, Info, ChevronRight,
  Activity, Download, AlertTriangle, CheckCircle2,
  Wind, FileBarChart2, Stethoscope,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";

/* ═══════════════════════════════════════════════════════════════
   CLINICAL FIELD META  (GOLD 2024 + Kaggle dataset reference)
═══════════════════════════════════════════════════════════════ */
const FIELD_META = {
  "mMRC": {
    level: "critical",
    label: "mMRC Dyspnea Scale",
    type: "select",
    options: [
      { label: "0 — Breathless only with strenuous exercise", value: 0 },
      { label: "1 — Short of breath hurrying / slight incline",  value: 1 },
      { label: "2 — Walks slower than peers / stops on flat",    value: 2 },
      { label: "3 — Stops after ~100 m or few minutes walking",  value: 3 },
      { label: "4 — Too breathless to leave house / dressing",   value: 4 },
    ],
    tooltip: {
      why: "Primary dyspnea severity score. mMRC ≥ 2 = high symptom burden (GOLD Groups B/E).",
      normal: "0–1 (low burden)",
      alert: "≥ 2 = high burden; ≥ 3 = severe disability",
      ref: "GOLD 2024, Table 2.5",
    },
  },
  "Respiratory Rate": {
    level: "critical",
    label: "Respiratory Rate",
    type: "number", min: 8, max: 60, step: 1, unit: "br/min",
    tooltip: {
      why: "Tachypnoea (> 30 br/min) is the primary marker of acute respiratory failure.",
      normal: "12–20 br/min",
      alert: "> 30 br/min = severe exacerbation → consider ICU / NIV",
      ref: "GOLD 2024, §5.3",
    },
  },
  "Oxygen Saturation": {
    level: "critical",
    label: "SpO₂",
    type: "number", min: 70, max: 100, step: 0.5, unit: "%",
    tooltip: {
      why: "Guides O₂ therapy. COPD target 88–92 % to avoid hypercapnia.",
      normal: "88–92 % (COPD)  /  > 94 % general population",
      alert: "< 88 % = O₂ indicated;  < 85 % = acute respiratory failure",
      ref: "GOLD 2024, §5.3",
    },
  },
  "Temperature": {
    level: "key",
    label: "Body Temperature",
    type: "number", min: 35, max: 42, step: 0.1, unit: "°C",
    tooltip: {
      why: "Fever indicates infective exacerbation (bacterial / viral trigger).",
      normal: "36.1–37.2 °C",
      alert: "> 38.0 °C = suspected infection → antibiotic course",
      ref: "GOLD 2024, §5.1",
    },
  },
  "working place": {
    level: "key",
    label: "Workplace Exposure",
    type: "select",
    options: [
      { label: "Industrial / High Dust / Fumes", value: 1 },
      { label: "Non-Industrial",                  value: 0 },
    ],
    tooltip: {
      why: "Occupational dust, fumes & chemicals account for ~15 % of COPD cases.",
      normal: "Non-industrial",
      alert: "Industrial → accelerated FEV₁ decline",
      ref: "GOLD 2024, §1.3",
    },
  },
  "Heart Rate": {
    level: "key",
    label: "Heart Rate",
    type: "number", min: 30, max: 200, step: 1, unit: "bpm",
    tooltip: {
      why: "Tachycardia may reflect hypoxaemia, active infection, or cor pulmonale.",
      normal: "60–100 bpm",
      alert: "> 110 bpm at rest = cardiorespiratory stress",
      ref: "GOLD 2024, §5.1",
    },
  },
  "Blood pressure": {
    level: "key",
    label: "Systolic BP",
    type: "number", min: 60, max: 220, step: 1, unit: "mmHg",
    tooltip: {
      why: "Hypertension is a leading COPD comorbidity; hypotension may signal sepsis.",
      normal: "90–139 mmHg",
      alert: "< 90 = circulatory collapse;  > 180 = hypertensive urgency",
      ref: "GOLD 2024, §5.6",
    },
  },
  "Age": {
    level: "supporting",
    label: "Age",
    type: "number", min: 18, max: 100, step: 1, unit: "yrs",
    tooltip: {
      why: "COPD risk rises after 40; most diagnoses after 50.",
      normal: "18–100",
      alert: "> 65 = higher exacerbation & mortality risk",
      ref: "GOLD 2024, §1.3",
    },
  },
  "BMI, kg/m2": {
    level: "supporting",
    label: "BMI",
    type: "number", min: 10, max: 60, step: 0.1, unit: "kg/m²",
    tooltip: {
      why: "Low BMI (< 21) independently predicts worse outcomes and higher mortality.",
      normal: "18.5–24.9 kg/m²",
      alert: "< 21 = nutritional risk;  > 30 = reduced exercise capacity",
      ref: "GOLD 2024, §4.2",
    },
  },
  "Pack History": {
    level: "supporting",
    label: "Pack-Year History",
    type: "number", min: 0, max: 200, step: 0.5, unit: "pack-yrs",
    tooltip: {
      why: "1 pack-year = 20 cigarettes/day × 1 year.  Cumulative tobacco exposure.",
      normal: "0",
      alert: "> 10 = significant risk;  > 30 = high COPD probability",
      ref: "GOLD 2024, §1.3",
    },
  },
  "status of smoking": {
    level: "supporting",
    label: "Smoking Status",
    type: "select",
    options: [
      { label: "Current Smoker",          value: 1 },
      { label: "Non-Smoker / Ex-Smoker",  value: 0 },
    ],
    tooltip: {
      why: "Smoking is the #1 modifiable risk factor. Cessation slows FEV₁ decline.",
      normal: "Non-smoker",
      alert: "Active smoker ≈ 50 mL/yr additional FEV₁ loss",
      ref: "GOLD 2024, §3.1",
    },
  },
  "Gender": {
    level: "supporting",
    label: "Gender",
    type: "select",
    options: [{ label: "Male", value: 1 }, { label: "Female", value: 0 }],
    tooltip: {
      why: "Historically higher male prevalence; female rates rising due to biomass smoke.",
      normal: "—",
      alert: "Females may be under-diagnosed despite equal severity",
      ref: "GOLD 2024, §1.3",
    },
  },
  "Depression": {
    level: "supporting",
    label: "Depression",
    type: "select",
    options: [{ label: "Yes", value: 1 }, { label: "No", value: 0 }],
    tooltip: {
      why: "Co-occurs in 25–42 % of COPD patients. Amplifies dyspnea, reduces adherence.",
      normal: "Absent",
      alert: "Present → screen with PHQ-9",
      ref: "GOLD 2024, §5.6",
    },
  },
  "History of Heart Failure": {
    level: "supporting",
    label: "Hx of Heart Failure",
    type: "select",
    options: [{ label: "Yes", value: 1 }, { label: "No", value: 0 }],
    tooltip: {
      why: "Cardiac comorbidity worsens dyspnea and complicates COPD treatment.",
      normal: "Absent",
      alert: "Present → screen for cor pulmonale; consider diuretics",
      ref: "GOLD 2024, §5.6",
    },
  },
  "Sputum": {
    level: "supporting",
    label: "Sputum Production",
    type: "select",
    options: [
      { label: "Yes (purulent / increased)", value: 1 },
      { label: "No", value: 0 },
    ],
    tooltip: {
      why: "Purulent sputum = Anthonisen Criterion 3 → antibiotic therapy indicated.",
      normal: "None or minimal",
      alert: "Purulent → 5–7 day antibiotic course",
      ref: "GOLD 2024, §5.2",
    },
  },
  "Vaccination": {
    level: "supporting",
    label: "Influenza Vaccination",
    type: "select",
    options: [{ label: "Vaccinated", value: 1 }, { label: "Not Vaccinated", value: 0 }],
    tooltip: {
      why: "Influenza vaccination reduces serious illness and hospitalisation.",
      normal: "Vaccinated (Evidence B)",
      alert: "Unvaccinated → higher exacerbation & mortality risk",
      ref: "GOLD 2024, Table 3.2",
    },
  },
  "Dependent": {
    level: "supporting",
    label: "Functional Dependence",
    type: "select",
    options: [
      { label: "Dependent (ADL assist needed)", value: 1 },
      { label: "Independent",                   value: 0 },
    ],
    tooltip: {
      why: "Functional dependence marks advanced disease and frailty syndrome.",
      normal: "Independent",
      alert: "Dependent → consider pulmonary rehab & social support",
      ref: "Dataset: functional assessment",
    },
  },
  "Height/m": {
    level: "supporting",
    label: "Height",
    type: "number", min: 1.2, max: 2.2, step: 0.01, unit: "m",
    tooltip: {
      why: "Anthropometric reference. Shorter stature correlates with reduced lung volumes.",
      normal: "1.50–1.90 m",
      alert: "—",
      ref: "Dataset: anthropometric variable",
    },
  },
};

/* ═══════════════════════════════════════════════════
   LEVEL → VISUAL CONFIG  (mirrors topology.html card colors)
   critical = red accent  (like cirrhosis in topology)
   key      = amber accent (like fibrosis)
   supporting = blue accent (like entry layer)
═══════════════════════════════════════════════════ */
const LEVEL_CFG = {
  critical: {
    strip:      "bg-red-500",
    ring:       "ring-red-200 focus-within:ring-red-400",
    inputBg:    "bg-red-50",
    dot:        "bg-red-400",
    tagBg:      "bg-red-50 text-red-700 border-red-200",
    headerTxt:  "text-red-600",
    headerBg:   "bg-red-50 border-red-100",
    label:      "Critical",
  },
  key: {
    strip:      "bg-amber-400",
    ring:       "ring-amber-200 focus-within:ring-amber-400",
    inputBg:    "bg-amber-50",
    dot:        "bg-amber-400",
    tagBg:      "bg-amber-50 text-amber-700 border-amber-200",
    headerTxt:  "text-amber-700",
    headerBg:   "bg-amber-50 border-amber-100",
    label:      "Key",
  },
  supporting: {
    strip:      "bg-blue-500",
    ring:       "ring-blue-200 focus-within:ring-blue-400",
    inputBg:    "bg-blue-50",
    dot:        "bg-blue-400",
    tagBg:      "bg-blue-50 text-blue-700 border-blue-100",
    headerTxt:  "text-blue-700",
    headerBg:   "bg-blue-50 border-blue-100",
    label:      "Supporting",
  },
};

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */

// FIX: parseFloat("") === NaN — never send NaN to the backend
const safeParseFloat = (str) => {
  const t = String(str).trim();
  if (!t) return undefined;
  const n = parseFloat(t);
  return isNaN(n) ? undefined : n;
};

const fmt = (v) => {
  const n = Number(v);
  return isNaN(n) ? "—" : (n * 100).toFixed(1);
};

const riskOf = (confidence) => {
  const c = Number(confidence);
  if (c > 0.75) return {
    color:   "text-red-600",
    barBg:   "bg-red-500",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    strip:   "bg-red-500",
    label:   "High Risk",
    sub:     "Immediate Clinical Attention Recommended",
  };
  if (c > 0.5) return {
    color:   "text-amber-600",
    barBg:   "bg-amber-400",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    strip:   "bg-amber-400",
    label:   "Moderate Risk",
    sub:     "Medical Evaluation Suggested",
  };
  return {
    color:   "text-emerald-600",
    barBg:   "bg-emerald-500",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    strip:   "bg-emerald-500",
    label:   "Low Risk",
    sub:     "Routine Monitoring Recommended",
  };
};

/* ═══════════════════════════════════════════════════
   FIELD INPUT COMPONENT
═══════════════════════════════════════════════════ */
const FieldInput = ({ name, onChange }) => {
  const meta = FIELD_META[name];
  const cfg  = LEVEL_CFG[meta.level];

  const inputCls = [
    "w-full py-2 px-3 text-sm rounded-lg border border-slate-200",
    "text-slate-800 placeholder-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    meta.level === "critical" ? "focus:ring-red-300"
    : meta.level === "key"    ? "focus:ring-amber-300"
    : "focus:ring-blue-300",
    "transition-all bg-white",
  ].join(" ");

  return (
    <div className="relative group">
      {/* Colored left-border accent strip (topology card style) */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${cfg.strip}`} />

      <div className={`pl-2.5 rounded-lg border ${
        meta.level === "critical" ? "border-red-100 bg-red-50/40"
        : meta.level === "key"    ? "border-amber-100 bg-amber-50/40"
        : "border-blue-100 bg-blue-50/30"
      }`}>
        {/* Label row */}
        <div className="flex items-center justify-between px-1 pt-1.5 pb-0.5">
          <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.headerTxt}`}>
            {meta.label}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${cfg.tagBg}`}>
            {cfg.label}
          </span>
        </div>

        {/* Input */}
        {meta.type === "select" ? (
          <select name={name} required onChange={onChange} defaultValue=""
            className={`${inputCls} mb-1.5 border-0 bg-transparent focus:bg-white`}>
            <option value="" disabled>Select…</option>
            {meta.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <div className="relative mb-1.5">
            <input
              type="number" name={name} placeholder={`e.g. ${meta.min}`}
              min={meta.min} max={meta.max} step={meta.step}
              required onChange={onChange}
              className={`${inputCls} border-0 bg-transparent focus:bg-white ${meta.unit ? "pr-14" : ""}`}
            />
            {meta.unit && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400
                               font-mono pointer-events-none select-none">
                {meta.unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute z-50 hidden group-hover:flex flex-col
                      bg-white border border-slate-200 shadow-xl rounded-xl
                      text-slate-700 text-xs p-4 top-full left-0 mt-1 w-72 pointer-events-none"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-900 text-sm">{meta.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${cfg.tagBg}`}>
            {cfg.label}
          </span>
        </div>
        {/* Colored top strip on tooltip (topology style) */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${cfg.strip}`} />

        <p className="text-slate-600 leading-relaxed mb-3 text-xs">{meta.tooltip.why}</p>

        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex gap-2 text-xs">
            <span className="text-slate-400 w-14 flex-shrink-0">Normal</span>
            <span className="text-emerald-600 font-semibold">{meta.tooltip.normal}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-400 w-14 flex-shrink-0">⚠ Alert</span>
            <span className="text-red-600">{meta.tooltip.alert}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-400 w-14 flex-shrink-0">Ref</span>
            <span className="text-blue-600 italic">{meta.tooltip.ref}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   TOPOLOGY-STYLE CARD
   — white surface, subtle border, colored top strip
═══════════════════════════════════════════════════ */
const Card = ({ children, className = "", accentColor = "bg-teal-500" }) => (
  <div className={`relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
    <div className="pt-5 px-6 pb-6">{children}</div>
  </div>
);

/* Topology-style section label (vertical layer label adapted to horizontal) */
const LayerLabel = ({ step, color = "text-slate-400", children }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${color.replace("text-","border-")}
                     flex items-center justify-center font-bold text-xs font-mono ${color}`}>
      {step}
    </div>
    <div className="flex flex-col">
      {children}
    </div>
  </div>
);

/* Topology-style section group header */
const GroupHeader = ({ level, label, count }) => {
  const cfg = LEVEL_CFG[level];
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border mb-3 ${cfg.headerBg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-bold uppercase tracking-wide ${cfg.headerTxt}`}>{label}</span>
      {count && (
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded border font-medium ${cfg.tagBg}`}>
          {count} fields
        </span>
      )}
    </div>
  );
};

/* Topology stat bar item */
const StatItem = ({ value, unit, label, color = "text-teal-600" }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex flex-col gap-1">
    <div className={`font-bold text-xl leading-none ${color}`}
         style={{ fontFamily: "'Syne', sans-serif" }}>
      {value}<span className="text-sm text-slate-400 font-normal ml-0.5">{unit}</span>
    </div>
    <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</div>
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const Lungs = () => {
  const [breathFile, setBreathFile]     = useState(null);
  const [clinicalData, setClinicalData] = useState({});
  const [stage1Result, setStage1Result] = useState(null);
  const [stage2Result, setStage2Result] = useState(null);
  const [showStage2, setShowStage2]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [dragOver, setDragOver]         = useState(false);

  /* ── Validation ── */
  const validateClinical = () => {
    for (const name of Object.keys(FIELD_META)) {
      const v = clinicalData[name];
      if (v === undefined || v === null || (typeof v === "number" && isNaN(v))) {
        alert(`Please fill in: ${FIELD_META[name].label}`);
        return false;
      }
    }
    if (clinicalData["Oxygen Saturation"] < 70 || clinicalData["Oxygen Saturation"] > 100) {
      alert("SpO₂ must be 70–100 %");
      return false;
    }
    if (clinicalData["mMRC"] < 0 || clinicalData["mMRC"] > 4) {
      alert("mMRC must be 0–4");
      return false;
    }
    return true;
  };

  /* ── Stage 1 ── */
  const handleStage1Submit = async (e) => {
    e.preventDefault();
    if (!breathFile) return alert("Please upload a breath CSV file.");
    setLoading(true);
    setStage1Result(null);
    setStage2Result(null);
    setShowStage2(false);
    try {
      const fd = new FormData();
      fd.append("file", breathFile);
      const res = await axiosInstance.post("/lung/stage1", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStage1Result(res.data);
      if (res.data.prediction === "COPD") setShowStage2(true);
    } catch {
      alert("Stage-1 Prediction Failed. Check the CSV and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Stage 2 ── FIX: safeParseFloat prevents NaN from empty inputs */
  const handleClinicalChange = (e) => {
    const parsed = safeParseFloat(e.target.value);
    setClinicalData((prev) => ({ ...prev, [e.target.name]: parsed }));
  };

  const handleStage2Submit = async (e) => {
    e.preventDefault();
    if (!validateClinical()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/lung/stage2", clinicalData, {
        headers: { "Content-Type": "application/json" },
      });
      setStage2Result(res.data);
    } catch {
      alert("Stage-2 Prediction Failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ── PDF download ── */
  const handleDownloadPDF = async () => {
    try {
      const res = await axiosInstance.post(
        "/lung/report/pdf",
        { stage1: stage1Result, stage2: stage2Result },
        { responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href     = url;
      link.download = "COPD_AI_Report.pdf";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("PDF generation failed.");
    }
  };

  const risk = stage2Result ? riskOf(stage2Result.confidence) : null;

  const grouped = {
    critical:   Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "critical"),
    key:        Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "key"),
    supporting: Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "supporting"),
  };

  return (
    // Load topology fonts
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700;800&display=swap');
        .font-syne  { font-family: 'Syne', sans-serif; }
        .font-mono-jb { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen font-mono-jb" style={{
        background: "linear-gradient(135deg, #f0f9ff 0%, #fafafa 50%, #f0fdf4 100%)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 py-10 space-y-5">

          {/* ── PAGE HEADER (topology-style) ── */}
          <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wind size={16} className="text-teal-600" />
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                    Clinical AI System
                  </span>
                </div>
                <h1 className="font-syne text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  COPD <span style={{ color: "#0d9488" }}>Prediction</span> System
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Two-stage AI pipeline · Breath acoustics → GOLD severity grading
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200
                                 text-teal-700 font-semibold uppercase">
                  GOLD 2024
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200
                                 text-blue-700 font-semibold uppercase">
                  v2.0
                </span>
              </div>
            </div>

            {/* Topology-style stat bar */}
            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <StatItem value="2"   unit=" stages"   label="AI Pipeline"       color="text-teal-600" />
              <StatItem value="18"  unit=" fields"   label="Clinical Inputs"   color="text-blue-600" />
              <StatItem value="230" unit=" patients" label="Training Dataset"  color="text-amber-600" />
              <StatItem value="4"   unit=" classes"  label="GOLD Stages"       color="text-red-500" />
            </div> */}
          </motion.div>

          {/* ── STAGE 1 ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}>
            <Card accentColor="bg-blue-500">
              <LayerLabel step="01" color="text-blue-500">
                <span className="font-syne font-bold text-slate-900 text-sm leading-tight">
                  Breath Acoustics Screening
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  Upload a CSV of breath-sound features to detect COPD presence
                </span>
              </LayerLabel>

              <form onSubmit={handleStage1Submit}>
                {/* Drop zone */}
                <label
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed
                               rounded-xl p-8 cursor-pointer select-none transition-all
                    ${dragOver
                      ? "border-blue-400 bg-blue-50"
                      : breathFile
                      ? "border-teal-400 bg-teal-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 bg-slate-50"
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragOver(false);
                    const f = e.dataTransfer.files[0]; if (f) setBreathFile(f);
                  }}
                >
                  {breathFile ? (
                    <>
                      <CheckCircle2 size={28} className="text-teal-500" />
                      <p className="text-teal-700 font-semibold text-sm">{breathFile.name}</p>
                      <p className="text-slate-400 text-xs">{(breathFile.size / 1024).toFixed(1)} KB — click to replace</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={28} className="text-slate-400" />
                      <p className="text-slate-600 text-sm font-semibold">Drop CSV here or click to browse</p>
                      <p className="text-slate-400 text-xs">Accepts .csv breath-sound feature files</p>
                    </>
                  )}
                  <input type="file" accept=".csv" className="hidden"
                    onChange={(e) => setBreathFile(e.target.files[0])} required />
                </label>

                <div className="mt-4 flex justify-end">
                  <button type="submit" disabled={loading}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                               disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5
                               rounded-lg transition-all">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                    Run Stage 1
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Stage 1 Result */}
          <AnimatePresence>
            {stage1Result && (
              <motion.div key="s1r" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <Card accentColor={stage1Result.prediction === "COPD" ? "bg-red-500" : "bg-emerald-500"}>
                  <div className="flex items-center gap-2 mb-4">
                    <FileBarChart2 size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                      Stage 1 Result
                    </span>
                  </div>

                  <div className="flex flex-wrap items-start gap-6 mb-5">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Prediction</p>
                      <p className={`font-syne text-2xl font-bold tracking-tight
                        ${stage1Result.prediction === "COPD" ? "text-red-600" : "text-emerald-600"}`}>
                        {stage1Result.prediction}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Confidence</p>
                      <p className="font-syne text-2xl font-bold text-slate-800">
                        {fmt(stage1Result.confidence)}
                        <span className="text-sm text-slate-400 font-normal ml-0.5">%</span>
                      </p>
                    </div>
                  </div>

                  {stage1Result.probabilities && (
                    <div className="space-y-2.5 mb-4">
                      {Object.entries(stage1Result.probabilities).map(([label, value]) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{label}</span>
                            <span className="font-mono font-semibold">{fmt(value)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <motion.div
                              className="h-1.5 rounded-full bg-blue-500"
                              initial={{ width:0 }}
                              animate={{ width:`${Number(value)*100}%` }}
                              transition={{ duration:0.7, ease:"easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {stage1Result.prediction === "COPD" && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50
                                    border border-amber-200 rounded-lg px-3 py-2.5">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-amber-500" />
                      <span>COPD signal detected — complete Stage 2 severity assessment below.</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STAGE 2 FORM ── */}
          <AnimatePresence>
            {showStage2 && (
              <motion.div key="s2form" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <Card accentColor="bg-gradient-to-r from-blue-500 via-amber-400 to-red-500">
                  <LayerLabel step="02" color="text-teal-600">
                    <span className="font-syne font-bold text-slate-900 text-sm leading-tight">
                      Clinical Severity Assessment
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      All fields required · Hover any field for GOLD 2024 clinical reference
                    </span>
                  </LayerLabel>

                  {/* Legend (topology style) */}
                  <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {(["critical","key","supporting"]).map((lv) => (
                      <div key={lv} className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_CFG[lv].dot}`} />
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${LEVEL_CFG[lv].tagBg}`}>
                          {LEVEL_CFG[lv].label}
                        </span>
                      </div>
                    ))}
                    <span className="text-xs text-slate-400 italic ml-auto hidden sm:block">
                      Hover any field for clinical reference
                    </span>
                  </div>

                  <form onSubmit={handleStage2Submit}>
                    {/* Critical */}
                    <GroupHeader level="critical" label="Critical Parameters — High Impact on Prediction"
                      count={grouped.critical.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      {grouped.critical.map((name) => (
                        <FieldInput key={name} name={name} onChange={handleClinicalChange} />
                      ))}
                    </div>

                    {/* Key */}
                    <GroupHeader level="key" label="Key Parameters — Medium Impact"
                      count={grouped.key.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      {grouped.key.map((name) => (
                        <FieldInput key={name} name={name} onChange={handleClinicalChange} />
                      ))}
                    </div>

                    {/* Supporting */}
                    <GroupHeader level="supporting" label="Supporting Parameters — Demographic & Lifestyle"
                      count={grouped.supporting.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                      {grouped.supporting.map((name) => (
                        <FieldInput key={name} name={name} onChange={handleClinicalChange} />
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" disabled={loading}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700
                                   disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5
                                   rounded-lg transition-all">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                        Run Stage 2
                      </button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STAGE 2 RESULT ── */}
          <AnimatePresence>
            {stage2Result && risk && (
              <motion.div key="s2r" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <Card accentColor={risk.strip}>
                  <div className="flex items-center gap-2 mb-5">
                    <Stethoscope size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                      Stage 2 — Severity Result
                    </span>
                  </div>

                  {/* GOLD badge + confidence */}
                  <div className="flex flex-wrap items-start gap-6 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">GOLD Stage</p>
                      <div className={`font-syne text-4xl font-extrabold tracking-tight leading-none ${risk.color}`}>
                        GOLD {stage2Result.gold_stage}
                      </div>
                      <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg border text-xs font-semibold ${risk.badgeBg}`}>
                        {risk.label}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{risk.sub}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Confidence</p>
                      <p className={`font-syne text-4xl font-extrabold leading-none ${risk.color}`}>
                        {fmt(stage2Result.confidence)}
                        <span className="text-lg text-slate-400 font-normal ml-0.5">%</span>
                      </p>
                    </div>
                  </div>

                  {/* Probability bars */}
                  {stage2Result.probabilities && (
                    <div className="mb-6">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3 font-semibold">
                        Class Probabilities
                      </p>
                      <div className="space-y-2.5">
                        {Object.entries(stage2Result.probabilities).map(([label, value]) => {
                          const pct = Number(value) * 100;
                          const r   = riskOf(value);
                          return (
                            <div key={label} className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2.5">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-slate-600 font-semibold">{label}</span>
                                <span className={`font-mono font-bold ${r.color}`}>
                                  {isNaN(pct) ? "—" : pct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-1.5 rounded-full ${r.barBg}`}
                                  initial={{ width:0 }}
                                  animate={{ width: isNaN(pct) ? "0%" : `${pct}%` }}
                                  transition={{ duration:0.7, ease:"easeOut" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PDF button */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400 italic">
                      Report generated via COPD AI · {new Date().toLocaleDateString("en-IN")}
                    </span>
                    <button onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900
                                 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all">
                      <Download size={14} />
                      Download PDF Report
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </>
  );
};

export default Lungs;
