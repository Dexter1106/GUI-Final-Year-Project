import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

/* ─────────────────────────────────────────────
   FEATURE PRIORITY MAP
───────────────────────────────────────────── */
const FEATURE_PRIORITY = {
  age:              "low",
  gender:           "low",
  alb:              "medium",
  alp:              "medium",
  alt:              "high",
  ast:              "high",
  bil:              "high",
  direct_bilirubin: "medium",
  che:              "low",
  chol:             "low",
  crea:             "high",
  ggt:              "medium",
  prot:             "low",
  inr:              "high",
  sodium:           "medium",
  ascites:          "low",
  encephalopathy:   "low",
};

/* ─────────────────────────────────────────────
   FEATURE TOOLTIP INFO
───────────────────────────────────────────── */
const FEATURE_INFO = {
  age: {
    label: "Age",
    desc: "Patient age in years. Older patients have higher baseline risk for liver fibrosis and cirrhosis.",
    range: "1–120 years",
    normal: "Any",
    medium: null,
    critical: ">60 (elevated risk)",
  },
  gender: {
    label: "Biological Sex",
    desc: "Biological sex influences liver enzyme reference ranges and disease progression rates.",
    range: "Male / Female",
    normal: "N/A",
    medium: null,
    critical: null,
  },
  alb: {
    label: "Albumin",
    desc: "Protein synthesised by the liver — low levels reflect impaired synthetic function and chronic disease.",
    range: "3.5–5.0 g/dL",
    normal: "3.5–5.0",
    medium: "2.8–3.4",
    critical: "<2.8",
  },
  alp: {
    label: "Alkaline Phosphatase (ALP)",
    desc: "Enzyme elevated in cholestatic liver disease, biliary obstruction, and bone disease.",
    range: "44–147 U/L",
    normal: "44–147",
    medium: "148–300",
    critical: ">300",
  },
  alt: {
    label: "Alanine Aminotransferase (ALT)",
    desc: "Liver-specific enzyme — the primary marker of hepatocellular damage and inflammation.",
    range: "7–56 U/L",
    normal: "7–56",
    medium: "57–200",
    critical: ">200",
  },
  ast: {
    label: "Aspartate Aminotransferase (AST)",
    desc: "Enzyme found in liver, heart, and muscle. Elevated in hepatitis, cirrhosis, and alcoholic liver disease.",
    range: "10–40 U/L",
    normal: "10–40",
    medium: "41–120",
    critical: ">120",
  },
  bil: {
    label: "Total Bilirubin",
    desc: "Breakdown product of haemoglobin — elevated levels cause jaundice and signal impaired liver excretion.",
    range: "0.2–1.2 mg/dL",
    normal: "0.2–1.2",
    medium: "1.3–3.0",
    critical: ">3.0",
  },
  direct_bilirubin: {
    label: "Direct Bilirubin",
    desc: "Conjugated fraction — elevated values indicate hepatocellular dysfunction or biliary obstruction.",
    range: "0–0.3 mg/dL",
    normal: "0–0.3",
    medium: "0.4–1.0",
    critical: ">1.0",
  },
  che: {
    label: "Cholinesterase",
    desc: "Enzyme synthesised by the liver — reduced activity reflects decreased synthetic capacity.",
    range: "5.3–12.9 kU/L",
    normal: "5.3–12.9",
    medium: "3.0–5.2",
    critical: "<3.0",
  },
  chol: {
    label: "Cholesterol",
    desc: "Total cholesterol — low levels in liver disease reflect impaired lipid synthesis.",
    range: "<200 mg/dL",
    normal: "<200",
    medium: "200–239",
    critical: ">240 or <100",
  },
  crea: {
    label: "Creatinine",
    desc: "Kidney waste marker — elevated in hepatorenal syndrome, a serious complication of advanced liver disease.",
    range: "0.6–1.2 mg/dL",
    normal: "0.6–1.2",
    medium: "1.3–2.0",
    critical: ">2.0",
  },
  ggt: {
    label: "Gamma-Glutamyl Transferase (GGT)",
    desc: "Sensitive marker of hepatobiliary disease and alcohol-related liver damage.",
    range: "9–48 U/L",
    normal: "9–48",
    medium: "49–150",
    critical: ">150",
  },
  prot: {
    label: "Total Protein",
    desc: "Sum of albumin and globulins — reflects liver synthetic function and nutritional status.",
    range: "6.0–8.3 g/dL",
    normal: "6.0–8.3",
    medium: "5.0–5.9",
    critical: "<5.0",
  },
  inr: {
    label: "INR (Coagulation)",
    desc: "International Normalised Ratio — measures clotting ability. Elevated INR reflects severe synthetic dysfunction and is a MELD component.",
    range: "0.8–1.1",
    normal: "0.8–1.1",
    medium: "1.2–1.5",
    critical: ">1.5",
  },
  sodium: {
    label: "Serum Sodium",
    desc: "Hyponatraemia in liver disease signals portal hypertension and is a key MELD-Na component.",
    range: "136–145 mEq/L",
    normal: "136–145",
    medium: "130–135",
    critical: "<130",
  },
  ascites: {
    label: "Ascites",
    desc: "Fluid accumulation in the peritoneal cavity — a major complication of cirrhosis used in Child-Pugh scoring.",
    range: "None / Mild / Severe",
    normal: "None (0)",
    medium: "Mild (1)",
    critical: "Severe (2)",
  },
  encephalopathy: {
    label: "Encephalopathy",
    desc: "Hepatic encephalopathy — neurological dysfunction caused by liver failure. Graded 0–2 for Child-Pugh scoring.",
    range: "None / Grade 1–2 / Grade 3–4",
    normal: "None (0)",
    medium: "Grade 1–2 (1)",
    critical: "Grade 3–4 (2)",
  },
};

const BADGE_LABEL = { high: "Critical", medium: "Key", low: "Supporting" };

/* ─────────────────────────────────────────────
   TOOLTIP KIT COMPONENT
───────────────────────────────────────────── */
function TooltipKit({ name }) {
  const [show, setShow] = useState(false);
  const info = FEATURE_INFO[name];
  if (!info) return null;
  const p = FEATURE_PRIORITY[name] || "low";

  const dotColor = { high: "#e05252", medium: "#f0b429", low: "#8BAFC8" }[p];

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width: 15, height: 15,
          borderRadius: "50%",
          background: "#f0f4f8",
          border: "1px solid #D8DDE6",
          color: "#5A6A7A",
          fontSize: "0.52rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "help",
          marginLeft: 6,
          flexShrink: 0,
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <Info size={8} />
      </span>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              zIndex: 999,
              background: "#0f172a",
              border: "1px solid #1e2d45",
              borderRadius: 9,
              padding: "10px 13px",
              minWidth: 230,
              maxWidth: 290,
              boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          >
            {/* Arrow */}
            <div style={{
              position: "absolute", top: "100%", left: 14,
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #1e2d45",
            }} />

            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.74rem", fontWeight: 700, color: "#e2e8f0", marginBottom: 5 }}>
              {info.label}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#94a3b8", lineHeight: 1.55, marginBottom: 6 }}>
              {info.desc}
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #1e2d45", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: "0.58rem", color: "#64748b" }}>Range</span>
              <span style={{ fontSize: "0.58rem", color: "#cbd5e1", textAlign: "right" }}>{info.range}</span>
            </div>
            {info.normal && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>Normal: {info.normal}</span>
                </div>
                {info.medium && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>Borderline: {info.medium}</span>
                  </div>
                )}
                {info.critical && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>Critical: {info.critical}</span>
                  </div>
                )}
              </div>
            )}
            <hr style={{ border: "none", borderTop: "1px solid #1e2d45", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
              <span style={{ fontSize: "0.58rem", color: "#64748b" }}>Importance</span>
              <span style={{ fontSize: "0.58rem", color: dotColor, fontWeight: 600 }}>
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
   FIELD LABEL WITH TOOLTIP
───────────────────────────────────────────── */
function FieldLabel({ name, text }) {
  return (
    <label style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--navy)", letterSpacing: "0.02em" }}>
      {text}
      <TooltipKit name={name} />
    </label>
  );
}

/* ─────────────────────────────────────────────
   MAIN LIVER COMPONENT
───────────────────────────────────────────── */
const Liver = () => {
  const [values, setValues] = useState({
    age: "", gender: "",
    alb: "", alp: "", alt: "", ast: "", bil: "", direct_bilirubin: "",
    che: "", chol: "", crea: "", ggt: "", prot: "",
    inr: "", sodium: "", ascites: "", encephalopathy: "",
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
    setGlobalError("");
  };

  const validate = () => {
    const errs = {};
    const required = ["age", "gender", "alb", "alp", "alt", "ast", "bil",
      "direct_bilirubin", "che", "chol", "crea", "ggt", "prot"];

    required.forEach((f) => {
      if (values[f] === "") errs[f] = "Required.";
    });

    const ranges = {
      age: [1, 120], alb: [0.9, 8], bil: [0.01, 80],
      direct_bilirubin: [0, 25], che: [0, 20], chol: [40, 600],
      crea: [0.01, 15], prot: [1, 12],
    };
    Object.entries(ranges).forEach(([f, [min, max]]) => {
      const v = parseFloat(values[f]);
      if (!isNaN(v) && (v < min || v > max))
        errs[f] = `Must be ${min}–${max}.`;
    });

    if (values.inr !== "" && parseFloat(values.inr) < 0.01)
      errs.inr = "Must be ≥ 0.01.";
    if (values.sodium !== "") {
      const s = parseFloat(values.sodium);
      if (s < 100 || s > 180) errs.sodium = "Must be 100–180.";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setGlobalError("Please correct the highlighted fields before submitting.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        age:              parseFloat(values.age),
        gender:           parseInt(values.gender),
        alb:              parseFloat(values.alb),
        alp:              parseFloat(values.alp),
        alt:              parseFloat(values.alt),
        ast:              parseFloat(values.ast),
        bil:              parseFloat(values.bil),
        direct_bilirubin: parseFloat(values.direct_bilirubin),
        che:              parseFloat(values.che),
        chol:             parseFloat(values.chol),
        crea:             parseFloat(values.crea),
        ggt:              parseFloat(values.ggt),
        prot:             parseFloat(values.prot),
        inr:            values.inr            ? parseFloat(values.inr)            : null,
        sodium:         values.sodium         ? parseFloat(values.sodium)         : null,
        ascites:        values.ascites        ? parseInt(values.ascites)          : null,
        encephalopathy: values.encephalopathy ? parseInt(values.encephalopathy)   : null,
      };

      const res = await axiosInstance.post("/liver/predict", payload);
      setResult(res.data);
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const payload = {
        age:              parseFloat(values.age),
        gender:           parseInt(values.gender),
        alb:              parseFloat(values.alb),
        alp:              parseFloat(values.alp),
        alt:              parseFloat(values.alt),
        ast:              parseFloat(values.ast),
        bil:              parseFloat(values.bil),
        direct_bilirubin: parseFloat(values.direct_bilirubin),
        che:              parseFloat(values.che),
        chol:             parseFloat(values.chol),
        crea:             parseFloat(values.crea),
        ggt:              parseFloat(values.ggt),
        prot:             parseFloat(values.prot),
        inr:            values.inr            ? parseFloat(values.inr)            : null,
        sodium:         values.sodium         ? parseFloat(values.sodium)         : null,
        ascites:        values.ascites        !== "" ? parseInt(values.ascites)   : null,
        encephalopathy: values.encephalopathy !== "" ? parseInt(values.encephalopathy) : null,
      };

      const response = await axiosInstance.post("/liver/report", payload, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Liver_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to download PDF. Check your backend console for data type errors.");
    }
  };

  const inp = (field, placeholder, step = "0.01") => (
    <input
      type="number"
      name={field}
      value={values[field]}
      onChange={set(field)}
      placeholder={placeholder}
      step={step}
      style={errors[field] ? { borderColor: "#C0392B", boxShadow: "0 0 0 3px rgba(192,57,43,0.10)" } : {}}
    />
  );

  // Result data helpers
  const getDiagnosis    = (r) => r?.disease || r?.primary_diagnosis || "Unknown";
  const getDecision     = (r) => r?.decision || r?.recommendation || "—";
  const getCriticality  = (r) => {
    if (r?.criticality) return r.criticality;
    const d = getDiagnosis(r);
    if (d === "Healthy") return "NONE";
    if (d === "Early Liver Disease") return "LOW";
    if (["Hepatitis", "Fibrosis", "Cirrhosis"].includes(d)) return "HIGH";
    return "UNKNOWN";
  };
  const getModel1Conf   = (r) => r?.model1_confidence || r?.model1_probabilities || null;
  const getModel2Conf   = (r) => r?.model2_confidence || r?.model2_probabilities || null;
  const isSecondaryUsed = (r) => r?.secondary_model_used ?? (r?.model2_confidence != null);
  const getSeverity     = (r) => r?.severity_assessment || null;

  const criticalityColor = { NONE: "#27ae60", LOW: "#2ecc71", MEDIUM: "#f39c12", HIGH: "#e74c3c", UNKNOWN: "#95a5a6" };
  const severityColor    = { "Low": "#27ae60", "Moderate": "#f39c12", "High": "#e67e22", "Very High": "#e74c3c", "Critical": "#8e1a1a" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root {
          --navy: #1B3A5C; --teal: #1A7A8A; --teal-light: #E8F4F6;
          --teal-mid: #A8D4DA; --red: #C0392B; --grey-50: #F7F9FB;
          --grey-100: #EEF1F5; --grey-200: #D8DDE6; --text: #1E2A38;
          --text-muted: #5A6A7A; --white: #FFFFFF; --radius: 10px;
          --shadow-md: 0 4px 16px rgba(27,58,92,0.10);
          --font-serif: 'Source Serif 4', Georgia, serif;
          --font-sans: 'DM Sans', system-ui, sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-sans); background: var(--grey-50); color: var(--text); }

        .page-header { background: var(--navy); padding: 28px 40px 24px; border-bottom: 3px solid var(--teal); }
        .page-header__logo { font-family: var(--font-serif); font-size: 1.75rem; font-weight: 700; color: var(--white); }
        .page-header__logo span { color: var(--teal-mid); }
        .page-header__sub { font-size: 0.8rem; color: #8BAFC8; margin-top: 2px; font-weight: 300; letter-spacing: 0.04em; text-transform: uppercase; }

        .page-content { max-width: 900px; margin: 0 auto; padding: 36px 24px 60px; }
        .form-intro { margin-bottom: 28px; }
        .form-intro h1 { font-family: var(--font-serif); font-size: 1.55rem; font-weight: 600; color: var(--navy); }
        .units-note { background: #e6f9f4; border-left: 4px solid #00d4aa; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; margin-top: 12px; color: #065f46; }

        .card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow-md); margin-bottom: 24px; overflow: visible; }
        .card__header { background: var(--navy); padding: 14px 22px; display: flex; align-items: center; gap: 10px; border-radius: var(--radius) var(--radius) 0 0; }
        .card__header h2 { font-size: 0.8rem; font-weight: 600; color: var(--white); letter-spacing: 0.08em; text-transform: uppercase; }
        .card__icon { width: 20px; height: 20px; background: var(--teal); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--white); flex-shrink: 0; }
        .card__body { padding: 22px 22px 20px; }

        .field-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 5px; border-radius: 6px; position: relative; }
        .field--high   { background: #fff0f0; border-left: 3px solid #e05252; padding-left: 8px; }
        .field--medium { background: #fffbea; border-left: 3px solid #f0b429; padding-left: 8px; }
        .field--low    { background: var(--white); border-left: 3px solid var(--grey-200); padding-left: 8px; }
        .field input, .field select { height: 40px; padding: 0 12px; border: 1.5px solid var(--grey-200); border-radius: 7px; font-size: 0.88rem; outline: none; width: 100%; transition: border-color 0.15s; }
        .field input:focus, .field select:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(26,122,138,0.12); }
        .field-error { font-size: 0.7rem; color: var(--red); }

        .importance-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; padding: 10px 14px; background: var(--grey-50); border-radius: 6px; border: 1px solid var(--grey-100); }
        .importance-legend span { font-size: 0.72rem; font-weight: 600; padding: 3px 10px; border-radius: 4px; color: var(--text-muted); }
        .leg--high   { background: #fff0f0; border-left: 3px solid #e05252; }
        .leg--medium { background: #fffbea; border-left: 3px solid #f0b429; }
        .leg--low    { background: var(--white); border: 1px solid var(--grey-200); }

        .btn-submit { width: 100%; height: 50px; background: var(--navy); color: var(--white); border: none; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.18s; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-submit:hover { background: var(--teal); }
        .btn-submit:disabled { opacity: 0.75; pointer-events: none; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: var(--white); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .btn-download { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; }
        .btn-download:hover { background: rgba(255,255,255,0.25); border-color: white; }

        .result-card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow-md); margin-top: 28px; overflow: hidden; }
        .result-card__header { background: var(--navy); padding: 16px 22px; display: flex; justify-content: space-between; align-items: center; }
        .result-card__title { font-family: var(--font-serif); font-size: 1.1rem; color: var(--white); }
        .result-badge { padding: 5px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; color: var(--white); }
        .result-card__body { padding: 24px; }
        .result-disease { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
        .result-decision { background: var(--teal-light); border-left: 4px solid var(--teal); padding: 12px 16px; border-radius: 6px; font-size: 0.9rem; color: var(--navy); margin: 16px 0; }
        .result-decision strong { display: block; margin-bottom: 4px; font-size: 0.75rem; text-transform: uppercase; color: var(--teal); }

        .pipeline-pill { display: inline-block; font-size: 0.73rem; color: var(--text-muted); background: var(--grey-100); border-radius: 4px; padding: 3px 10px; margin-bottom: 16px; }

        .confidence-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin: 16px 0 8px; }
        .confidence-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
        .confidence-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--grey-50); border-radius: 6px; font-size: 0.82rem; }
        .confidence-item span:last-child { font-weight: 600; color: var(--navy); }

        .severity-section { margin-top: 20px; border-top: 1px solid var(--grey-100); padding-top: 16px; }
        .severity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .severity-box { background: var(--grey-50); border-radius: 8px; padding: 14px 16px; border: 1px solid var(--grey-100); }
        .severity-score { font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--navy); }
        .transplant-banner { background: #fdf0ee; border: 1.5px solid #e8a09a; border-radius: 8px; padding: 10px 16px; color: var(--red); font-size: 0.88rem; font-weight: 600; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .transplant-banner--safe { background: #eaf7ef; border-color: #a8ddb8; color: #1a7a3a; }

        /* Tooltip legend row */
        .tooltip-legend { display: flex; align-items: center; gap: 16px; margin-top: 6px; flex-wrap: wrap; }
        .tooltip-legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.67rem; color: var(--text-muted); }
        .tooltip-legend-dot { width: 7px; height: 7px; border-radius: 50%; }

        .error-banner { background: #fdf0ee; border: 1.5px solid #e8a09a; border-radius: 8px; padding: 10px 16px; color: var(--red); font-size: 0.88rem; margin-bottom: 18px; }
      `}</style>

      <header className="page-header">
        <div className="page-header__logo">Only<span>Liver</span></div>
        <div className="page-header__sub">Liver Disease Decision Support System</div>
      </header>

      <main className="page-content">
        <div className="form-intro">
          <h1>Patient Evaluation Form</h1>
          <p className="units-note">✅ <strong>Standard Units:</strong> Enter values in conventional clinical units (g/dL, mg/dL).</p>
          {/* Tooltip legend */}
          <div className="tooltip-legend" style={{ marginTop: 14 }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)" }}>ⓘ Hover the info icon next to any label for clinical details</span>
            <span className="tooltip-legend-item"><div className="tooltip-legend-dot" style={{ background: "#e05252" }} />Critical field</span>
            <span className="tooltip-legend-item"><div className="tooltip-legend-dot" style={{ background: "#f0b429" }} />Key field</span>
            <span className="tooltip-legend-item"><div className="tooltip-legend-dot" style={{ background: "#8BAFC8" }} />Supporting field</span>
          </div>
        </div>

        {globalError && <div className="error-banner">{globalError}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Card 1: Patient Information ── */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon">①</div>
              <h2>Patient Information</h2>
            </div>
            <div className="card__body">
              <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className={`field field--${FEATURE_PRIORITY.age}`}>
                  <FieldLabel name="age" text="Age (years)" />
                  <input type="number" value={values.age} onChange={set("age")} style={errors.age ? { borderColor: "#C0392B" } : {}} />
                  {errors.age && <span className="field-error">{errors.age}</span>}
                </div>
                <div className={`field field--${FEATURE_PRIORITY.gender}`}>
                  <FieldLabel name="gender" text="Biological Sex" />
                  <select value={values.gender} onChange={set("gender")} style={errors.gender ? { borderColor: "#C0392B" } : {}}>
                    <option value="" disabled>Select…</option>
                    <option value="1">Male</option>
                    <option value="0">Female</option>
                  </select>
                  {errors.gender && <span className="field-error">{errors.gender}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* ── Card 2: Core Liver Panel ── */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon">②</div>
              <h2>Core Liver Panel</h2>
            </div>
            <div className="card__body">
              <div className="importance-legend">
                <span className="leg--high">🔴 Critical</span>
                <span className="leg--medium">🟡 Key</span>
                <span className="leg--low">⚪ Supporting</span>
              </div>
              <div className="field-grid">

                <div className={`field field--${FEATURE_PRIORITY.alb}`}>
                  <FieldLabel name="alb" text="Albumin (g/dL)" />
                  {inp("alb")}
                  {errors.alb && <span className="field-error">{errors.alb}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.alp}`}>
                  <FieldLabel name="alp" text="ALP (U/L)" />
                  {inp("alp")}
                  {errors.alp && <span className="field-error">{errors.alp}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.alt}`}>
                  <FieldLabel name="alt" text="ALT (U/L)" />
                  {inp("alt")}
                  {errors.alt && <span className="field-error">{errors.alt}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.ast}`}>
                  <FieldLabel name="ast" text="AST (U/L)" />
                  {inp("ast")}
                  {errors.ast && <span className="field-error">{errors.ast}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.bil}`}>
                  <FieldLabel name="bil" text="Total Bilirubin (mg/dL)" />
                  {inp("bil")}
                  {errors.bil && <span className="field-error">{errors.bil}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.direct_bilirubin}`}>
                  <FieldLabel name="direct_bilirubin" text="Direct Bilirubin (mg/dL)" />
                  {inp("direct_bilirubin")}
                  {errors.direct_bilirubin && <span className="field-error">{errors.direct_bilirubin}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.che}`}>
                  <FieldLabel name="che" text="Cholinesterase (kU/L)" />
                  {inp("che")}
                  {errors.che && <span className="field-error">{errors.che}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.chol}`}>
                  <FieldLabel name="chol" text="Cholesterol (mg/dL)" />
                  {inp("chol")}
                  {errors.chol && <span className="field-error">{errors.chol}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.crea}`}>
                  <FieldLabel name="crea" text="Creatinine (mg/dL)" />
                  {inp("crea")}
                  {errors.crea && <span className="field-error">{errors.crea}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.ggt}`}>
                  <FieldLabel name="ggt" text="GGT (U/L)" />
                  {inp("ggt")}
                  {errors.ggt && <span className="field-error">{errors.ggt}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.prot}`}>
                  <FieldLabel name="prot" text="Total Protein (g/dL)" />
                  {inp("prot")}
                  {errors.prot && <span className="field-error">{errors.prot}</span>}
                </div>

              </div>
            </div>
          </div>

          {/* ── Card 3: Severity Scoring ── */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon">③</div>
              <h2>Severity Scoring (Optional)</h2>
            </div>
            <div className="card__body">
              <div className="field-grid">

                <div className={`field field--${FEATURE_PRIORITY.inr}`}>
                  <FieldLabel name="inr" text="INR" />
                  {inp("inr")}
                  {errors.inr && <span className="field-error">{errors.inr}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.sodium}`}>
                  <FieldLabel name="sodium" text="Sodium (mEq/L)" />
                  {inp("sodium")}
                  {errors.sodium && <span className="field-error">{errors.sodium}</span>}
                </div>

                <div className={`field field--${FEATURE_PRIORITY.ascites}`}>
                  <FieldLabel name="ascites" text="Ascites" />
                  <select value={values.ascites} onChange={set("ascites")}>
                    <option value="">Not provided</option>
                    <option value="0">0 — None</option>
                    <option value="1">1 — Mild</option>
                    <option value="2">2 — Severe</option>
                  </select>
                </div>

                <div className={`field field--${FEATURE_PRIORITY.encephalopathy}`}>
                  <FieldLabel name="encephalopathy" text="Encephalopathy" />
                  <select value={values.encephalopathy} onChange={set("encephalopathy")}>
                    <option value="">Not provided</option>
                    <option value="0">0 — None</option>
                    <option value="1">1 — Grade 1–2</option>
                    <option value="2">2 — Grade 3–4</option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Running…</> : "Run Evaluation →"}
          </button>
        </form>

        {/* ── Result ── */}
        {result && (() => {
          const diagnosis   = getDiagnosis(result);
          const decision    = getDecision(result);
          const criticality = getCriticality(result);
          const model1Conf  = getModel1Conf(result);
          const model2Conf  = getModel2Conf(result);
          const secondary   = isSecondaryUsed(result);
          const severity    = getSeverity(result);

          return (
            <div className="result-card">
              <div className="result-card__header">
                <span className="result-card__title">Evaluation Result</span>
                <button onClick={handleDownloadPDF} className="btn-download">⬇ Download PDF</button>
                <span className="result-badge" style={{ backgroundColor: criticalityColor[criticality] || "#95a5a6" }}>{criticality}</span>
              </div>

              <div className="result-card__body">
                <div className="result-disease">{diagnosis}</div>
                <div className="pipeline-pill">{secondary ? "Stage 1 → Stage 2 (Early assessment)" : "Stage 1 (Cirrhosis model)"}</div>
                <div className="result-decision"><strong>Recommended Action</strong>{decision}</div>

                {model1Conf && (
                  <>
                    <div className="confidence-title">Model Confidence Scores</div>
                    <div className="confidence-grid">
                      {Object.entries(model1Conf).map(([key, val]) => (
                        <div key={key} className="confidence-item"><span>{key}</span><span>{val !== null ? `${val}%` : "N/A"}</span></div>
                      ))}
                    </div>
                  </>
                )}

                {secondary && model2Conf && (
                  <>
                    <div className="confidence-title">Stage 2 Submodel Confidence</div>
                    <div className="confidence-grid">
                      {Object.entries(model2Conf).map(([key, val]) => (
                        <div key={key} className="confidence-item"><span>{key}</span><span>{val !== null ? `${val}%` : "N/A"}</span></div>
                      ))}
                    </div>
                  </>
                )}

                {severity && (
                  <div className="severity-section">
                    <h3>Severity Assessment</h3>
                    {severity.transplant_required
                      ? <div className="transplant-banner">⚠ Transplant evaluation recommended</div>
                      : <div className="transplant-banner transplant-banner--safe">✓ Medical management appropriate</div>
                    }
                    <div className="severity-grid">
                      <div className="severity-box">
                        <h4>MELD Score</h4>
                        <div className="severity-score">{severity.meld_score}</div>
                        <div style={{ color: severityColor[severity.meld?.risk_level] || "inherit" }}>{severity.meld?.risk_level} Risk</div>
                        <div className="severity-desc">{severity.meld?.description}</div>
                      </div>
                      <div className="severity-box">
                        <h4>Child-Pugh</h4>
                        <div className="severity-score">{severity.child_pugh?.score}</div>
                        <div>{severity.child_pugh?.classification}</div>
                        <div className="severity-desc">{severity.child_pugh?.description}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>
    </>
  );
};

export default Liver;