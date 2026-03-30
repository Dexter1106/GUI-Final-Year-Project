////////////////////////////////////////////////////////////////////
//// File Name : Kidney.jsx
//// Description : Kidney disease prediction UI — Topology-themed
////               light dashboard with full TooltipKit system
//// Updated     : Feature Importance + Streamlit-Style Light Theme
////////////////////////////////////////////////////////////////////

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, HeartPulse, Brain, Info } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";

/* ─────────────────────────────────────────────
   GLOBAL STYLES  (injected once via <style> tag)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  /* swapped to a cleaner sans-serif UI font and simplified spacing */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --k-bg:        #f0f4f8;
    --k-surface:   #ffffff;
    --k-surface2:  #f8fafc;
    --k-border:    #dde3ec;
    --k-border2:   #c8d3e0;
    --k-accent:    #0ea5e9;
    --k-high:      #ef4444;
    --k-high-bg:   #fef2f2;
    --k-high-bd:   #fecaca;
    --k-med:       #f59e0b;
    --k-med-bg:    #fffbeb;
    --k-med-bd:    #fde68a;
    --k-low:       #10b981;
    --k-low-bg:    #f0fdf4;
    --k-low-bd:    #a7f3d0;
    --k-text:      #0f172a;
    --k-muted:     #64748b;
    /* use a modern, neutral sans-serif for both body and display text */
    --k-mono:      'Inter', sans-serif;
    --k-display:   'Inter', sans-serif;
  }

  .kd-root * { box-sizing: border-box; }

  .kd-root {
    font-family: var(--k-mono);
    background: var(--k-bg);
    min-height: 100vh;
    padding: 0 0 80px;
  }

  /* ── Layer sidebar label (topology-style) ── */
  .kd-section {
    position: relative;
    display: flex;
    gap: 0;
    margin-bottom: 28px;
  }
  .kd-layer-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: 0.58rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--k-muted);
    min-width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
    border-right: 2px solid var(--k-border);
    margin-right: 20px;
    flex-shrink: 0;
    font-family: var(--k-mono);
  }
  .kd-section-body { flex: 1; }

  /* ── Section header ── */
  .kd-sec-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--k-border);
  }
  .kd-sec-title {
    font-family: var(--k-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--k-text);
    letter-spacing: 0.3px;
  }
  .kd-sec-icon {
    width: 28px; height: 28px;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .kd-sec-count {
    margin-left: auto;
    font-size: 0.6rem;
    color: var(--k-muted);
    background: var(--k-surface2);
    border: 1px solid var(--k-border);
    padding: 2px 9px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  /* ── Form grids ── */
  .kd-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .kd-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  @media (max-width: 900px) {
    .kd-grid-3, .kd-grid-4 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .kd-grid-3, .kd-grid-4 { grid-template-columns: 1fr; }
  }

  /* ── Field wrapper ── */
  .kd-field { position: relative; }
  .kd-field-inner {
    position: relative;
    padding-left: 9px;
  }
  .kd-field-inner::before {
    content: '';
    position: absolute;
    left: 0; top: 2px; bottom: 2px;
    width: 2.5px;
    border-radius: 2px;
  }
  .kd-stripe-high::before { background: var(--k-high); }
  .kd-stripe-medium::before { background: var(--k-med); }
  .kd-stripe-low::before  { background: var(--k-low); }

  /* ── Label row ── */
  .kd-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
    gap: 4px;
  }
  .kd-label-left {
    display: flex;
    align-items: center;
    gap: 0;
    min-width: 0;
  }
  .kd-label {
    font-size: 0.69rem;
    font-weight: 600;
    color: var(--k-text);
    font-family: var(--k-mono);
    text-align: justify;
    text-justify: inter-word;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .kd-priority-badge {
    font-size: 0.55rem;
    padding: 1px 7px;
    border-radius: 10px;
    border: 1px solid;
    font-family: var(--k-mono);
    letter-spacing: 0.3px;
    cursor: default;
    flex-shrink: 0;
  }
  .kd-badge-high     { color: var(--k-high); background: var(--k-high-bg); border-color: var(--k-high-bd); }
  .kd-badge-medium   { color: #b45309;       background: var(--k-med-bg);  border-color: var(--k-med-bd); }
  .kd-badge-low      { color: #059669;       background: var(--k-low-bg);  border-color: var(--k-low-bd); }

  /* ── Input / Select ── */
  .kd-input, .kd-select {
    width: 100%;
    padding: 8px 10px;
    font-family: var(--k-mono);
    font-size: 0.72rem;
    border-radius: 7px;
    border: 1.5px solid var(--k-border2);
    background: var(--k-surface);
    color: var(--k-text);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }
  .kd-input::placeholder { color: var(--k-muted); font-size: 0.65rem; }
  .kd-input-high   { border-color: #fecaca; }
  .kd-input-high:focus   { border-color: var(--k-high); box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
  .kd-input-medium { border-color: #fde68a; }
  .kd-input-medium:focus { border-color: var(--k-med);  box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
  .kd-input-low    { border-color: #a7f3d0; }
  .kd-input-low:focus    { border-color: var(--k-low);  box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }

  .kd-select-wrap { position: relative; }
  .kd-select-wrap::after {
    content: '▾';
    position: absolute;
    right: 10px; top: 50%;
    transform: translateY(-50%);
    font-size: 0.7rem;
    color: var(--k-muted);
    pointer-events: none;
  }
  .kd-select { padding-right: 28px; cursor: pointer; }

  .kd-hint {
    font-size: 0.58rem;
    color: var(--k-muted);
    margin-top: 3px;
    font-family: var(--k-mono);
  }

  /* ── TooltipKit ── */
  .kd-tip-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }
  .kd-tip-icon {
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--k-surface2);
    border: 1px solid var(--k-border2);
    color: var(--k-muted);
    font-size: 0.55rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: help;
    margin-left: 5px;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;
  }
  .kd-tip-icon:hover { background: #e0f2fe; border-color: var(--k-accent); color: var(--k-accent); }
  .kd-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    z-index: 500;
    background: #0f172a;
    border: 1px solid #1e2d45;
    border-radius: 9px;
    padding: 10px 13px;
    min-width: 230px;
    max-width: 290px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.4);
    pointer-events: none;
  }
  .kd-tooltip::after {
    content: '';
    position: absolute;
    top: 100%; left: 14px;
    border: 5px solid transparent;
    border-top-color: #1e2d45;
  }
  .kd-tt-label {
    font-family: var(--k-display);
    font-size: 0.74rem;
    font-weight: 700;
    color: #e2e8f0;
    margin-bottom: 5px;
  }
  .kd-tt-desc { font-size: 0.62rem; color: #94a3b8; line-height: 1.55; margin-bottom: 6px; }
  .kd-tt-divider { border: none; border-top: 1px solid #1e2d45; margin: 6px 0; }
  .kd-tt-row { display: flex; justify-content: space-between; gap: 6px; margin-top: 3px; }
  .kd-tt-key { font-size: 0.58rem; color: #64748b; }
  .kd-tt-val { font-size: 0.58rem; color: #cbd5e1; text-align: right; }
  .kd-tt-level-row { display: flex; align-items: center; gap: 5px; margin-top: 4px; }
  .kd-tt-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .kd-tt-level { font-size: 0.58rem; color: #94a3b8; }

  /* ── Main card ── */
  .kd-card {
    background: var(--k-surface);
    border: 1px solid var(--k-border);
    border-radius: 12px;
    padding: 22px 24px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    position: relative;
    /* allow tooltips to escape the card instead of being clipped */
    overflow: visible;
  }
  .kd-card::before {
    content: '';
    display: block;
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .kd-card-clinical::before  { background: linear-gradient(90deg, #ef4444, #f97316); }
  .kd-card-history::before   { background: linear-gradient(90deg, #f59e0b, #eab308); }
  .kd-card-lifestyle::before { background: linear-gradient(90deg, #10b981, #0ea5e9); }

  /* ── Stats bar ── */
  .kd-stats {
    display: flex;
    gap: 10px;
    margin-bottom: 28px;
    padding-left: 52px;
  }
  .kd-stat {
    flex: 1;
    background: var(--k-surface);
    border: 1px solid var(--k-border);
    border-radius: 9px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .kd-stat__val {
    font-family: var(--k-display);
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--k-text);
  }
  .kd-stat__val span { color: var(--k-accent); }
  .kd-stat__lbl { font-size: 0.57rem; color: var(--k-muted); letter-spacing: 1.5px; text-transform: uppercase; }

  /* ── Page header ── */
  .kd-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 36px 40px 30px;
    margin-bottom: 36px;
    position: relative;
    overflow: hidden;
  }
  .kd-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #22d3ee, transparent);
  }
  .kd-header-grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(var(--k-border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--k-border) 1px, transparent 1px);
    background-size: 32px 32px;
    opacity: 0.04;
    pointer-events: none;
  }
  .kd-header-inner { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; }
  .kd-logo {
    font-family: var(--k-display);
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .kd-logo span { color: #22d3ee; }
  .kd-logo-sub {
    font-size: 0.66rem;
    color: #475569;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-family: var(--k-mono);
  }
  .kd-version {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 13px;
    padding: 3px 12px;
    background: rgba(14,165,233,0.1);
    border: 1px solid rgba(14,165,233,0.25);
    border-radius: 20px;
    font-size: 0.62rem;
    color: #38bdf8;
    letter-spacing: 0.5px;
    font-family: var(--k-mono);
  }
  .kd-ver-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #22d3ee;
    animation: kd-pulse 2s ease-in-out infinite;
  }
  @keyframes kd-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* ── Connector ── */
  .kd-connector {
    padding-left: 52px;
    height: 30px;
    display: flex;
    align-items: stretch;
  }
  .kd-connector-line {
    width: 1px;
    background: linear-gradient(to bottom, var(--k-border2), #0ea5e9);
    margin-left: 15px;
    position: relative;
  }
  .kd-connector-line::after {
    content: '▼';
    position: absolute;
    bottom: -10px; left: 50%;
    transform: translateX(-50%);
    font-size: 7px;
    color: #0ea5e9;
  }

  /* ── Submit ── */
  .kd-submit {
    width: 100%;
    padding: 13px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    color: #fff;
    font-family: var(--k-display);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 16px rgba(14,165,233,0.28);
  }
  .kd-submit:hover:not(:disabled) {
    opacity: 0.92; transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(14,165,233,0.38);
  }
  .kd-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .kd-submit:active:not(:disabled) { transform: translateY(1px); }

  /* ── Spinner ── */
  @keyframes kd-spin { to { transform: rotate(360deg); } }
  .kd-spinner {
    display: inline-block;
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: kd-spin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 8px;
  }

  /* ── Result ── */
  .kd-result {
    background: var(--k-surface);
    border: 1px solid var(--k-border);
    border-radius: 12px;
    padding: 24px;
    margin-top: 28px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border-left: 4px solid;
  }
  .kd-result-high   { border-left-color: var(--k-high); }
  .kd-result-medium { border-left-color: var(--k-med);  }
  .kd-result-low    { border-left-color: var(--k-low);  }
  .kd-result-title {
    font-family: var(--k-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--k-text);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .kd-crit-badge {
    font-size: 0.62rem;
    padding: 3px 10px;
    border-radius: 20px;
    font-family: var(--k-mono);
    border: 1px solid;
  }
  .kd-result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .kd-result-key { font-size: 0.6rem; color: var(--k-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px; font-family: var(--k-mono); }
  .kd-result-val { font-family: var(--k-display); font-size: 1.05rem; font-weight: 700; color: var(--k-text); }

  /* ── Legend ── */
  .kd-legend {
    display: flex;
    gap: 18px;
    padding-left: 52px;
    margin-top: 40px;
    flex-wrap: wrap;
  }
  .kd-legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.62rem; color: var(--k-muted); }
  .kd-legend-dot  { width: 8px; height: 8px; border-radius: 50%; }
`;

/* ─────────────────────────────────────────────
   FEATURE DATA
───────────────────────────────────────────── */
const FEATURE_PRIORITY = {
  gfr: "high", serum_creatinine: "high", bun: "high",
  serum_calcium: "high", c3_c4: "high", oxalate_levels: "high",
  blood_pressure: "high", urine_ph: "high", water_intake: "high", months: "high",
  ana: "medium", hematuria: "medium", painkiller_usage: "medium", family_history: "medium",
  physical_activity: "low", diet: "low", smoking: "low",
  alcohol: "low", weight_changes: "low", stress_level: "low",
};

const FEATURE_INFO = {
  gfr:               { label: "GFR",                desc: "Glomerular filtration rate — higher is better.", range: ">90 mL/min/1.73m²",   normal: ">90",       medium: "60–89",       critical: "<60" },
  serum_creatinine:  { label: "Serum Creatinine",   desc: "Waste product — elevated values suggest reduced kidney function.", range: "0.6–1.2 mg/dL",  normal: "0.6–1.2",   medium: "1.3–2.0",     critical: ">2.0" },
  bun:               { label: "Blood Urea Nitrogen", desc: "Waste product — higher values may indicate kidney stress.", range: "7–20 mg/dL",      normal: "7–20",      medium: "21–40",       critical: ">40" },
  serum_calcium:     { label: "Serum Calcium",       desc: "Calcium in blood — imbalances affect stone risk.", range: "8.6–10.2 mg/dL",  normal: "8.6–10.2",  medium: "10.3–11.5",   critical: ">11.5" },
  c3_c4:             { label: "C3/C4 Levels",        desc: "Immune complement proteins — depletion signals autoimmune kidney disease.", range: "Lab-specific",    normal: "Lab ref",   medium: "Mild dev.",   critical: "Significant" },
  oxalate_levels:    { label: "Oxalate Levels",      desc: "High levels promote kidney stone formation.", range: "0–0.45 mmol/L",   normal: "<0.45",     medium: "0.45–1.0",    critical: ">1.0" },
  urine_ph:          { label: "Urine pH",             desc: "Acidity of urine — values outside range signal metabolic issues.", range: "4.6–8.0",        normal: "4.6–8.0",   medium: null,          critical: "Outside range" },
  blood_pressure:    { label: "Blood Pressure",      desc: "Systolic pressure — hypertension accelerates nephron damage.", range: "90–140 mmHg",    normal: "90–120",    medium: "121–140",     critical: ">140" },
  water_intake:      { label: "Water Intake",        desc: "Daily consumption — dehydration concentrates nephrotoxins.", range: "1–3 L/day",       normal: "1–3 L",     medium: "0.5–1 / 3–4", critical: "<0.5 or >4" },
  months:            { label: "Symptom Duration",    desc: "Months since onset — longer duration correlates with worse prognosis.", range: "0–120 months",   normal: "0–6",       medium: "7–24",        critical: ">24" },
  ana:               { label: "Anemia (ANA)",         desc: "Anemia is a common complication of chronic kidney disease.", range: "yes / no",        normal: "No",        medium: null,          critical: "Yes" },
  hematuria:         { label: "Hematuria",            desc: "Blood in urine — marker of glomerular or tubular damage.", range: "yes / no",        normal: "No",        medium: null,          critical: "Yes" },
  painkiller_usage:  { label: "Painkiller Usage",    desc: "NSAID overuse is nephrotoxic and worsens kidney perfusion.", range: "yes / no",        normal: "No",        medium: null,          critical: "Yes" },
  family_history:    { label: "Family History",      desc: "Genetic predisposition to CKD, PKD, or nephrolithiasis.", range: "yes / no",        normal: "No",        medium: null,          critical: "Yes" },
  physical_activity: { label: "Physical Activity",  desc: "Regular exercise improves BP control and metabolic health.", range: "daily / weekly / rarely" },
  diet:              { label: "Diet Type",            desc: "High-protein diets increase BUN load on kidneys.", range: "high protein / balanced / low salt" },
  smoking:           { label: "Smoking",              desc: "Smoking accelerates nephropathy and vascular disease.", range: "yes / no" },
  alcohol:           { label: "Alcohol Intake",      desc: "Excess alcohol raises BP and promotes dehydration.", range: "daily / occasionally / never" },
  weight_changes:    { label: "Weight Changes",      desc: "Unexplained changes may signal fluid retention or loss.", range: "stable / loss / gain" },
  stress_level:      { label: "Stress Level",        desc: "Chronic stress elevates cortisol, worsening hypertension.", range: "low / moderate / high" },
};

const BADGE_LABEL = { high: "Must Act", medium: "Allowed", low: "Optional" };

/* ─────────────────────────────────────────────
   TOOLTIP KIT
───────────────────────────────────────────── */
function TooltipKit({ name }) {
  const [show, setShow] = useState(false);
  const info = FEATURE_INFO[name];
  if (!info) return null;
  const p = FEATURE_PRIORITY[name] || "low";

  return (
    <span className="kd-tip-wrap">
      <span
        className="kd-tip-icon"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <Info size={8} />
      </span>
      <AnimatePresence>
        {show && (
          <motion.div
            className="kd-tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
          >
            <div className="kd-tt-label">{info.label}</div>
            <div className="kd-tt-desc">{info.desc}</div>
            <hr className="kd-tt-divider" />
            <div className="kd-tt-row">
              <span className="kd-tt-key">Range</span>
              <span className="kd-tt-val">{info.range}</span>
            </div>
            {info.normal && (
              <>
                <div style={{ marginTop: 6 }}>
                  <div className="kd-tt-level-row">
                    <div className="kd-tt-dot" style={{ background: "#10b981" }} />
                    <span className="kd-tt-level">Normal: {info.normal}</span>
                  </div>
                  {info.medium && (
                    <div className="kd-tt-level-row">
                      <div className="kd-tt-dot" style={{ background: "#f59e0b" }} />
                      <span className="kd-tt-level">Medium: {info.medium}</span>
                    </div>
                  )}
                  {info.critical && (
                    <div className="kd-tt-level-row">
                      <div className="kd-tt-dot" style={{ background: "#ef4444" }} />
                      <span className="kd-tt-level">Critical: {info.critical}</span>
                    </div>
                  )}
                </div>
              </>
            )}
            <hr className="kd-tt-divider" />
            <div className="kd-tt-row">
              <span className="kd-tt-key">Priority</span>
              <span className="kd-tt-val" style={{ color: p === "high" ? "#fca5a5" : p === "medium" ? "#fcd34d" : "#6ee7b7" }}>
                {BADGE_LABEL[p]}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ─────────────────────────────────────────────
   INPUT FIELD
───────────────────────────────────────────── */
function KdInput({ name, value, onChange }) {
  const p = FEATURE_PRIORITY[name] || "low";
  const info = FEATURE_INFO[name];
  const isRequired = p !== "low";

  return (
    <div className="kd-field">
      <div className={`kd-field-inner kd-stripe-${p}`}>
        <div className="kd-label-row">
          <div className="kd-label-left">
            <span className="kd-label">{info?.label || name}</span>
            <TooltipKit name={name} />
          </div>
          <span className={`kd-priority-badge kd-badge-${p}`}>{BADGE_LABEL[p]}</span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          name={name}
          value={value}
          onChange={onChange}
          required={isRequired}
          placeholder={info?.range || "Enter value"}
          className={`kd-input kd-input-${p}`}
        />
        {info?.range && <div className="kd-hint">ref: {info.range}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SELECT FIELD
───────────────────────────────────────────── */
function KdSelect({ name, value, onChange, options }) {
  const p = FEATURE_PRIORITY[name] || "low";
  const info = FEATURE_INFO[name];
  const isRequired = p !== "low";

  return (
    <div className="kd-field">
      <div className={`kd-field-inner kd-stripe-${p}`}>
        <div className="kd-label-row">
          <div className="kd-label-left">
            <span className="kd-label">{info?.label || name}</span>
            <TooltipKit name={name} />
          </div>
          <span className={`kd-priority-badge kd-badge-${p}`}>{BADGE_LABEL[p]}</span>
        </div>
        <div className="kd-select-wrap">
          <select
            name={name}
            value={value}
            onChange={onChange}
            required={isRequired}
            className={`kd-select kd-input-${p}`}
          >
            <option value="">Select</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOPOLOGY SECTION WRAPPER
───────────────────────────────────────────── */
function KdSection({ label, labelColor, icon, iconBg, title, countLabel, cardClass, children }) {
  return (
    <div className="kd-section">
      <div className="kd-layer-label" style={{ color: labelColor }}>{label}</div>
      <div className="kd-section-body">
        <div className={`kd-card ${cardClass}`} style={{ paddingTop: 26 }}>
          <div className="kd-sec-header">
            <div className="kd-sec-icon" style={{ background: iconBg }}>{icon}</div>
            <span className="kd-sec-title">{title}</span>
            <span className="kd-sec-count">{countLabel}</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
function Kidney() {
  const [formData, setFormData] = useState({
    serum_creatinine: "", gfr: "", bun: "", serum_calcium: "",
    c3_c4: "", oxalate_levels: "", urine_ph: "", blood_pressure: "",
    water_intake: "", months: "", ana: "", hematuria: "",
    painkiller_usage: "", family_history: "", physical_activity: "",
    diet: "", smoking: "", alcohol: "", weight_changes: "", stress_level: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const toNumber = (val) => (val === "" ? null : Number(val));
  const yesNoToBinary = (val) => (val === "yes" ? 1 : 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        serum_creatinine: toNumber(formData.serum_creatinine),
        gfr: toNumber(formData.gfr),
        bun: toNumber(formData.bun),
        serum_calcium: toNumber(formData.serum_calcium),
        c3_c4: toNumber(formData.c3_c4),
        oxalate_levels: toNumber(formData.oxalate_levels),
        urine_ph: toNumber(formData.urine_ph),
        blood_pressure: toNumber(formData.blood_pressure),
        water_intake: toNumber(formData.water_intake),
        months: toNumber(formData.months),
        ana: yesNoToBinary(formData.ana),
        hematuria: yesNoToBinary(formData.hematuria),
        painkiller_usage: yesNoToBinary(formData.painkiller_usage),
        family_history: yesNoToBinary(formData.family_history),
        physical_activity: formData.physical_activity,
        diet: formData.diet,
        smoking: formData.smoking,
        alcohol: formData.alcohol,
        weight_changes: formData.weight_changes,
        stress_level: formData.stress_level,
      };
      const response = await axiosInstance.post("/kidney/predict", payload);
      setResult(response.data);
    } catch (error) {
      alert("Prediction failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  }

  const critLevel = result?.criticality?.toLowerCase() || "";
  const critTier = critLevel.includes("high") ? "high"
    : critLevel.includes("medium") ? "medium" : "low";
  const critBadgeStyle = {
    high:   { color: "#dc2626", background: "#fef2f2", borderColor: "#fecaca" },
    medium: { color: "#b45309", background: "#fffbeb", borderColor: "#fde68a" },
    low:    { color: "#059669", background: "#f0fdf4", borderColor: "#a7f3d0" },
  }[critTier];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Navbar />

      <div className="kd-root">

        {/* ── Header ── */}
        <div className="kd-header">
          <div className="kd-header-grid" />
          <div className="kd-header-inner">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="kd-logo">Only<span>Kidney</span> AI</div>
              <div className="kd-logo-sub">Disease Prediction · ML Pipeline · Feature Importance System</div>
              <div className="kd-version">
                <span className="kd-ver-dot" />
                FastAPI + React · 20 Features · 3 Priority Tiers
              </div>
            </motion.div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>

          {/* ── Stats Bar ── */}
         

          <hr style={{ border: "none", borderTop: "1px solid #dde3ec", marginBottom: 28, marginLeft: 52 }} />

          {/* ── Form ── */}
          <form onSubmit={handleSubmit}>

            {/* CLINICAL — HIGH */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
              <KdSection
                label="Clinical"
                labelColor="#ef4444"
                icon={<Activity size={14} color="#ef4444" />}
                iconBg="#fef2f2"
                title="Clinical Measurements"
                countLabel="10 fields · 🔴 HIGH IMPORTANCE"
                cardClass="kd-card-clinical"
              >
                <div className="kd-grid-3">
                  <KdInput name="gfr"             value={formData.gfr}             onChange={handleChange} />
                  <KdInput name="serum_creatinine" value={formData.serum_creatinine} onChange={handleChange} />
                  <KdInput name="bun"              value={formData.bun}              onChange={handleChange} />
                  <KdInput name="serum_calcium"    value={formData.serum_calcium}    onChange={handleChange} />
                  <KdInput name="c3_c4"            value={formData.c3_c4}            onChange={handleChange} />
                  <KdInput name="oxalate_levels"   value={formData.oxalate_levels}   onChange={handleChange} />
                  <KdInput name="urine_ph"         value={formData.urine_ph}         onChange={handleChange} />
                  <KdInput name="blood_pressure"   value={formData.blood_pressure}   onChange={handleChange} />
                  <KdInput name="water_intake"     value={formData.water_intake}     onChange={handleChange} />
                  <KdInput name="months"           value={formData.months}           onChange={handleChange} />
                </div>
              </KdSection>
            </motion.div>

            <div className="kd-connector"><div className="kd-connector-line" /></div>

            {/* HISTORY — MEDIUM */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
              <KdSection
                label="History"
                labelColor="#f59e0b"
                icon={<HeartPulse size={14} color="#b45309" />}
                iconBg="#fffbeb"
                title="Medical History"
                countLabel="4 fields · 🟡 MEDIUM IMPORTANCE"
                cardClass="kd-card-history"
              >
                <div className="kd-grid-4">
                  <KdSelect name="ana"              value={formData.ana}              onChange={handleChange} options={["yes", "no"]} />
                  <KdSelect name="hematuria"        value={formData.hematuria}        onChange={handleChange} options={["yes", "no"]} />
                  <KdSelect name="painkiller_usage" value={formData.painkiller_usage} onChange={handleChange} options={["yes", "no"]} />
                  <KdSelect name="family_history"   value={formData.family_history}   onChange={handleChange} options={["yes", "no"]} />
                </div>
              </KdSection>
            </motion.div>

            <div className="kd-connector"><div className="kd-connector-line" /></div>

            {/* LIFESTYLE — LOW */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
              <KdSection
                label="Lifestyle"
                labelColor="#10b981"
                icon={<Brain size={14} color="#059669" />}
                iconBg="#f0fdf4"
                title="Lifestyle Factors"
                countLabel="6 fields · ⚪ LOW IMPORTANCE"
                cardClass="kd-card-lifestyle"
              >
                <div className="kd-grid-3">
                  <KdSelect name="physical_activity" value={formData.physical_activity} onChange={handleChange} options={["daily", "weekly", "rarely"]} />
                  <KdSelect name="diet"              value={formData.diet}              onChange={handleChange} options={["high protein", "balanced", "low salt"]} />
                  <KdSelect name="smoking"           value={formData.smoking}           onChange={handleChange} options={["yes", "no"]} />
                  <KdSelect name="alcohol"           value={formData.alcohol}           onChange={handleChange} options={["daily", "occasionally", "never"]} />
                  <KdSelect name="weight_changes"    value={formData.weight_changes}    onChange={handleChange} options={["stable", "loss", "gain"]} />
                  <KdSelect name="stress_level"      value={formData.stress_level}      onChange={handleChange} options={["low", "moderate", "high"]} />
                </div>
              </KdSection>
            </motion.div>

            <div className="kd-connector"><div className="kd-connector-line" /></div>

            {/* PREDICT */}
            <div className="kd-section">
              <div className="kd-layer-label" style={{ color: "#0ea5e9" }}>Predict</div>
              <div className="kd-section-body">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="kd-submit"
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  {loading
                    ? <><span className="kd-spinner" />Analysing Patient Data...</>
                    : <>Run Kidney Disease Prediction →</>}
                </motion.button>
              </div>
            </div>

          </form>

          {/* ── Result ── */}
          <AnimatePresence>
            {result && (
              <motion.div
                className={`kd-result kd-result-${critTier}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="kd-result-title">
                  Prediction Result
                  <span className="kd-crit-badge" style={critBadgeStyle}>{result.criticality}</span>
                </div>
                <div className="kd-result-grid">
                  <div>
                    <div className="kd-result-key">Disease</div>
                    <div className="kd-result-val">{result.disease}</div>
                  </div>
                  <div>
                    <div className="kd-result-key">Decision</div>
                    <div className="kd-result-val">{result.decision}</div>
                  </div>
                  <div>
                    <div className="kd-result-key">Confidence</div>
                    <div className="kd-result-val">{result.confidence ?? "N/A"}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Legend ── */}
          <div className="kd-legend">
            <div className="kd-legend-item"><div className="kd-legend-dot" style={{ background: "#ef4444" }} />Must Act — High Priority</div>
            <div className="kd-legend-item"><div className="kd-legend-dot" style={{ background: "#f59e0b" }} />Allowed — Medium Priority</div>
            <div className="kd-legend-item"><div className="kd-legend-dot" style={{ background: "#10b981" }} />Optional — Low Priority</div>
            <div className="kd-legend-item"><div className="kd-legend-dot" style={{ background: "#0ea5e9" }} />ⓘ Hover for clinical tooltip</div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Kidney;
