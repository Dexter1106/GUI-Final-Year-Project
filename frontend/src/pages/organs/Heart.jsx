import { useState, useRef, useEffect, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════════
   DESIGN TOKENS — light theme only (fixed, no toggle)
══════════════════════════════════════════════════════════════════ */
const LIGHT = {
  "--bg":      "#f4f6f9",
  "--surface": "#ffffff",
  "--surface2":"#edf0f3",
  "--border":  "#d0d7de",
  "--text":    "#1b1f23",
  "--muted":   "#57606a",
};

/* ══════════════════════════════════════════════════════════════════
   FIELD IMPORTANCE COLOUR SYSTEM
   Colours the label text of every form field by its clinical weight.

   🔴 RED   (#c0392b) — most critical CVD predictors  ★★★
      Age, Systolic BP, Diastolic BP, Cholesterol
      (highest non-modifiable / primary clinical risk drivers)

   🟡 AMBER (#b7791f) — significant modifiable factors ★★
      Glucose, Weight, Smoking

   🟢 GREEN (#276749) — contextual / supportive inputs  ★
      Gender, Height, Alcohol, Physical Activity
══════════════════════════════════════════════════════════════════ */
const IMPORTANCE = {
  age:         { color:"#c0392b", dot:"#e74c3c", stars:"★★★", tag:"Critical" },
  systolic:    { color:"#c0392b", dot:"#e74c3c", stars:"★★★", tag:"Critical" },
  diastolic:   { color:"#c0392b", dot:"#e74c3c", stars:"★★★", tag:"Critical" },
  cholesterol: { color:"#c0392b", dot:"#e74c3c", stars:"★★★", tag:"Critical" },
  glucose:     { color:"#b7791f", dot:"#d69e2e", stars:"★★",  tag:"Important" },
  weight:      { color:"#b7791f", dot:"#d69e2e", stars:"★★",  tag:"Important" },
  smoking:     { color:"#b7791f", dot:"#d69e2e", stars:"★★",  tag:"Important" },
  gender:      { color:"#276749", dot:"#38a169", stars:"★",   tag:"General" },
  height:      { color:"#276749", dot:"#38a169", stars:"★",   tag:"General" },
  alcohol:     { color:"#276749", dot:"#38a169", stars:"★",   tag:"General" },
  active:      { color:"#276749", dot:"#38a169", stars:"★",   tag:"General" },
};

/* ══════════════════════════════════════════════════════════════════
   RISK COLOURS
══════════════════════════════════════════════════════════════════ */
const RISK_COLORS = {
  safe:     { color:"#3fb950", bg:"rgba(63,185,80,.10)",   bgLite:"rgba(63,185,80,.08)" },
  moderate: { color:"#d29922", bg:"rgba(210,153,34,.10)",  bgLite:"rgba(210,153,34,.08)" },
  high:     { color:"#f0883e", bg:"rgba(240,136,62,.10)",  bgLite:"rgba(240,136,62,.08)" },
  critical: { color:"#f85149", bg:"rgba(248,81,73,.10)",   bgLite:"rgba(248,81,73,.08)" },
  extreme:  { color:"#bc8cff", bg:"rgba(188,140,255,.10)", bgLite:"rgba(188,140,255,.08)" },
};

/* ══════════════════════════════════════════════════════════════════
   TREATMENT / TRANSPLANT DECISION ENGINE
══════════════════════════════════════════════════════════════════ */
const TREATMENT_GUIDANCE = {
  safe: {
    requiresTransplant: false,
    verdict: "No Treatment Required",
    verdictIcon: "✅",
    summary: "Your cardiovascular health appears to be in a good range.",
    interventions: [
      { icon:"🥗", title:"Heart-Healthy Diet",   detail:"Mediterranean diet — rich in olive oil, fish, nuts, fruits & vegetables." },
      { icon:"🏃", title:"Regular Exercise",      detail:"150 min/week of moderate aerobic activity (walking, cycling, swimming)." },
      { icon:"🩺", title:"Annual Screening",      detail:"Routine cardiovascular check-up and blood panel every 12 months." },
      { icon:"😴", title:"Lifestyle Balance",     detail:"7–9 hrs sleep, stress management, and avoiding tobacco." },
    ],
  },
  moderate: {
    requiresTransplant: false,
    verdict: "Medical Treatment Recommended",
    verdictIcon: "⚠️",
    summary: "Lifestyle modification and medical evaluation are advised to prevent progression.",
    interventions: [
      { icon:"🩺", title:"GP Consultation",       detail:"Schedule a cardiovascular review with your general practitioner soon." },
      { icon:"💊", title:"Medication Review",      detail:"Discuss whether preventive medications (statins, anti-hypertensives) are appropriate." },
      { icon:"🚭", title:"Quit Smoking",           detail:"Quitting smoking halves cardiovascular risk within the first year." },
      { icon:"🥗", title:"Dietary Overhaul",       detail:"Reduce salt (<2 g/day), saturated fat, and processed foods significantly." },
    ],
  },
  high: {
    requiresTransplant: false,
    verdict: "Active Medical Treatment Required",
    verdictIcon: "🔶",
    summary: "Significant cardiovascular risk detected. Specialist evaluation and pharmacological intervention are likely needed.",
    interventions: [
      { icon:"🔶", title:"Cardiologist Referral", detail:"Request a full cardiac evaluation including ECG, stress test, and echocardiogram." },
      { icon:"💊", title:"Pharmacological Therapy",detail:"Anti-hypertensives, statins, or antiplatelet agents may be prescribed." },
      { icon:"🩸", title:"Comprehensive Labs",     detail:"Lipid panel, HbA1c, CRP, full metabolic panel — track every 3–6 months." },
      { icon:"📉", title:"Supervised Programme",   detail:"Cardiac rehabilitation or supervised exercise programme under medical guidance." },
    ],
  },
  critical: {
    requiresTransplant: false,
    verdict: "Urgent Intervention Required — No Transplant Yet",
    verdictIcon: "🔴",
    summary: "Critical cardiovascular disease detected. Urgent specialist care is mandatory. Advanced cardiac procedures may be considered — transplant is not yet indicated.",
    interventions: [
      { icon:"🔴", title:"Urgent Cardiologist",    detail:"See a cardiologist immediately — do not delay. Bring all prior medical records." },
      { icon:"💉", title:"Diagnostic Imaging",     detail:"Coronary angiography, cardiac MRI, or CT angiography to assess blockage severity." },
      { icon:"🏥", title:"Procedure Evaluation",   detail:"Angioplasty (PCI), stenting, or coronary artery bypass graft (CABG) may be needed." },
      { icon:"📟", title:"Emergency Preparedness", detail:"Keep emergency contacts ready. Call emergency services if chest pain occurs." },
    ],
  },
  extreme: {
    requiresTransplant: true,
    verdict: "Heart Transplant Evaluation Recommended",
    verdictIcon: "🟣",
    summary: "Extremely high cardiovascular risk. End-stage heart failure indicators are present. Evaluation for heart transplant candidacy at a tertiary cardiology centre is suggested.",
    interventions: [
      { icon:"🟣", title:"Transplant Evaluation",  detail:"Referral to a heart transplant centre for candidacy assessment (LVAD bridge or listing)." },
      { icon:"🏥", title:"Tertiary Cardiology",     detail:"Immediate admission to a specialist cardiac unit for advanced haemodynamic support." },
      { icon:"💉", title:"Advanced Therapies",      detail:"IV inotropes, mechanical circulatory support (IABP, Impella, ECMO) may be required." },
      { icon:"📞", title:"Emergency Protocol",      detail:"Dial emergency services (112/911) immediately if symptoms worsen. Do not drive yourself." },
    ],
  },
};

/* ══════════════════════════════════════════════════════════════════
   NEXT STEPS DATA
══════════════════════════════════════════════════════════════════ */
const NEXT_STEPS = {
  safe:     [{ icon:"✅", t:"Maintain habits",     d:"Keep up your healthy lifestyle." },               { icon:"🥦", t:"Eat heart-healthy",     d:"Focus on Mediterranean diet patterns." },           { icon:"🏃", t:"Stay active",          d:"150 min/week of moderate aerobic activity." }, { icon:"🩺", t:"Annual check-up",       d:"Routine cardiovascular screening yearly." }],
  moderate: [{ icon:"🩺", t:"See your GP",          d:"Schedule a cardiovascular check-up soon." },     { icon:"🚭", t:"Quit smoking",          d:"Quitting halves CVD risk within 1 year." },         { icon:"🥗", t:"Improve diet",         d:"Reduce salt, saturated fats, processed foods." }, { icon:"🏃", t:"Move more",             d:"Start with 30-min walks, 5 days/week." }],
  high:     [{ icon:"🔶", t:"Consult cardiologist", d:"Request a full cardiac evaluation." },           { icon:"💊", t:"Medication review",     d:"Discuss BP & cholesterol meds with your doctor." }, { icon:"📉", t:"Lifestyle overhaul",   d:"Strict diet and supervised exercise programme." }, { icon:"🩸", t:"Blood tests",           d:"Lipid panel, HbA1c, CRP, full metabolic panel." }],
  critical: [{ icon:"🔴", t:"Urgent consultation",  d:"See a cardiologist as soon as possible." },      { icon:"💉", t:"Diagnostic tests",     d:"ECG, echocardiogram, coronary angiography." },       { icon:"🚑", t:"Monitor symptoms",     d:"Report chest pain or breathlessness immediately." }, { icon:"💊", t:"Medical therapy",       d:"Discuss pharmacological intervention options." }],
  extreme:  [{ icon:"🟣", t:"Immediate care",       d:"Seek urgent medical attention without delay." }, { icon:"🏥", t:"Specialist referral",   d:"Tertiary cardiology centre evaluation recommended." }, { icon:"📟", t:"Emergency plan",       d:"Keep emergency contacts and plan ready." },        { icon:"🩺", t:"Intensive monitoring",  d:"Frequent follow-ups and daily home BP tracking." }],
};

/* ══════════════════════════════════════════════════════════════════
   VALIDATION RULES
══════════════════════════════════════════════════════════════════ */
function getFieldState(id, value, formValues) {
  const v = parseFloat(value);
  switch (id) {
    case "age":         return v<30?{cls:"ok",hint:"Low age risk"}:v<50?{cls:"ok",hint:"Moderate age — stay active"}:v<65?{cls:"warn",hint:"⚠ Age 50+ — increased risk"}:{cls:"bad",hint:"⚠ Age 65+ — significant risk"};
    case "height":      return v>=140&&v<=220?{cls:"ok",hint:"Valid height ✓"}:{cls:"bad",hint:"Please check this value"};
    case "weight": {
      const h=parseFloat(formValues.height||0); if(!h)return{cls:"",hint:""};
      const bmi=v/((h/100)**2);
      return bmi<18.5?{cls:"warn",hint:`BMI ${bmi.toFixed(1)} — Underweight`}:bmi<25?{cls:"ok",hint:`BMI ${bmi.toFixed(1)} — Healthy ✓`}:bmi<30?{cls:"warn",hint:`BMI ${bmi.toFixed(1)} — Overweight`}:{cls:"bad",hint:`BMI ${bmi.toFixed(1)} — Obese ⚠`};
    }
    case "systolic":    return v<120?{cls:"ok",hint:"Normal blood pressure ✓"}:v<130?{cls:"ok",hint:"Elevated — monitor regularly"}:v<140?{cls:"warn",hint:"⚠ Stage 1 hypertension"}:{cls:"bad",hint:"⚠ Stage 2 hypertension"};
    case "diastolic":   return v<80?{cls:"ok",hint:"Normal ✓"}:v<90?{cls:"warn",hint:"⚠ Stage 1 hypertension"}:{cls:"bad",hint:"⚠ Stage 2 hypertension"};
    case "cholesterol": return {"1":{cls:"ok",hint:"Normal ✓"},"2":{cls:"warn",hint:"⚠ Above normal — monitor"},"3":{cls:"bad",hint:"⚠ Well above — high CVD risk"}}[value]||{cls:"",hint:""};
    case "glucose":     return {"1":{cls:"ok",hint:"Normal ✓"},"2":{cls:"warn",hint:"⚠ Pre-diabetic range"},"3":{cls:"bad",hint:"⚠ Diabetic range — elevated risk"}}[value]||{cls:"",hint:""};
    case "smoking":     return {"0":{cls:"ok",hint:"Non-smoker ✓"},"1":{cls:"bad",hint:"⚠ Smoker — 2–4× CVD risk"}}[value]||{cls:"",hint:""};
    case "alcohol":     return {"0":{cls:"ok",hint:"No regular intake ✓"},"1":{cls:"warn",hint:"⚠ Regular use — monitor BP"}}[value]||{cls:"",hint:""};
    case "active":      return {"0":{cls:"warn",hint:"⚠ Sedentary — increase activity"},"1":{cls:"ok",hint:"Physically active ✓"}}[value]||{cls:"",hint:""};
    default: return {cls:"",hint:""};
  }
}

// getRiskMeta — thresholds MUST stay aligned with PROB_MAP in heart_controller.py
// Low Risk(15) → prediction=0 → "safe"
// Moderate Risk(52) → prob < 60 → "moderate"
// High Risk(68)     → 60 ≤ prob < 75 → "high"
// Critical Risk(83) → 75 ≤ prob < 90 → "critical"
// Extreme Risk      → prob ≥ 90 → "extreme" (reserved for future direct-prob mode)
function getRiskMeta(prediction, prob) {
  if(prediction===0)  return{cls:"safe",    label:"Low Risk",      emoji:"✅"};
  if(prob<60)         return{cls:"moderate", label:"Moderate Risk", emoji:"⚠️"};
  if(prob<75)         return{cls:"high",     label:"High Risk",     emoji:"🔶"};
  if(prob<90)         return{cls:"critical", label:"Critical Risk", emoji:"🔴"};
  return                    {cls:"extreme",  label:"Extreme Risk",  emoji:"🟣"};
}

/* ══════════════════════════════════════════════════════════════════
   TOOLTIP
══════════════════════════════════════════════════════════════════ */
function Tooltip({ title, children }) {
  const [open,setOpen]=useState(false);
  const [flip,setFlip]=useState(false);
  const tipRef=useRef(null);
  useEffect(()=>{
    if(open&&tipRef.current){
      const r=tipRef.current.getBoundingClientRect();
      setFlip(r.right>window.innerWidth-12);
    }
  },[open]);
  return(
    <span style={{position:"relative",display:"inline-flex",marginLeft:"auto",flexShrink:0}}
      onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:"50%",background:"rgba(3,102,214,.15)",color:"#0366d6",fontSize:".65rem",fontWeight:700,cursor:"help",border:"1px solid #0366d6",lineHeight:1}}>?</span>
      {open&&(
        <div ref={tipRef} style={{position:"absolute",top:"calc(100% + 4px)",[flip?"right":"left"]:0,zIndex:9999,background:"#fff",border:"2px solid #0366d6",borderRadius:10,padding:"14px 16px",width:264,fontSize:".78rem",lineHeight:1.55,boxShadow:"0 14px 40px rgba(0,0,0,.15)",color:"#1b1f23"}}>
          <div style={{color:"#0366d6",fontWeight:600,marginBottom:7,fontSize:".8rem"}}>{title}</div>
          {children}
        </div>
      )}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FIELD GROUP
   importanceId → IMPORTANCE map → colours label text + dot
   When field is empty  → show importance colour + stars
   When field is filled → switch to live validation colour
══════════════════════════════════════════════════════════════════ */
const VAL_COLOR = { ok:"#3fb950", warn:"#d29922", bad:"#f85149", "":"#d0d7de" };

function FieldGroup({ label, tooltip, state, hint, children, importanceId }) {
  const imp    = IMPORTANCE[importanceId] || null;
  const filled = Boolean(state?.cls);

  const labelColor = filled ? VAL_COLOR[state.cls] : (imp ? imp.color : "#57606a");
  const dotColor   = filled ? VAL_COLOR[state.cls] : (imp ? imp.dot   : "#d0d7de");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,position:"relative"}}>
      <label style={{
        fontSize:".82rem", fontWeight:700,
        color: labelColor,
        display:"flex", alignItems:"center", gap:6,
        userSelect:"none", transition:"color .25s",
        letterSpacing:".01em",
      }}>
        <span style={{
          width:9, height:9, borderRadius:"50%",
          background: dotColor,
          flexShrink:0, display:"inline-block",
          transition:"background .3s",
          boxShadow: !filled && imp ? `0 0 0 3px ${imp.dot}30` : "none",
        }}/>
        {label}
        {!filled && imp && (
          <span style={{
            display:"inline-block",
            background: imp.color+"18",
            color: imp.color,
            border:`1px solid ${imp.dot}50`,
            borderRadius:4,
            fontSize:".6rem",fontWeight:800,letterSpacing:".07em",
            padding:"1px 6px",lineHeight:1.4,
          }}>
            {imp.tag}
          </span>
        )}
        {tooltip && <Tooltip title={tooltip.title}>{tooltip.body}</Tooltip>}
      </label>
      {children}
      {hint && (
        <span style={{fontSize:".73rem",minHeight:15,transition:"color .3s",
          color: filled ? VAL_COLOR[state.cls] : "#57606a"}}>
          {hint}
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STYLED INPUT / SELECT
══════════════════════════════════════════════════════════════════ */
function StyledInput({ id, type="number", value, onChange, placeholder, min, max, state }) {
  const borderColor = state?.cls ? VAL_COLOR[state.cls] : "#d0d7de";
  return (
    <input id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder} min={min} max={max}
      style={{background:"#edf0f3",border:`1.5px solid ${borderColor}`,borderRadius:8,color:"#1b1f23",fontFamily:"inherit",fontSize:".91rem",padding:"10px 13px",outline:"none",width:"100%",WebkitAppearance:"none",transition:"border-color .22s"}}
      onFocus={e=>(e.target.style.boxShadow="0 0 0 3px rgba(3,102,214,.12)")}
      onBlur={e=>(e.target.style.boxShadow="none")}
    />
  );
}

function StyledSelect({ id, value, onChange, options, state }) {
  const borderColor = state?.cls ? VAL_COLOR[state.cls] : "#d0d7de";
  return (
    <select id={id} value={value} onChange={onChange}
      style={{
        background:"#edf0f3",
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2357606a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:12,
        border:`1.5px solid ${borderColor}`,borderRadius:8,
        color:value?"#1b1f23":"#57606a",
        fontFamily:"inherit",fontSize:".91rem",
        padding:"10px 34px 10px 13px",outline:"none",width:"100%",cursor:"pointer",
        WebkitAppearance:"none",transition:"border-color .22s",
      }}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════════════════════════ */
function SectionLabel({ children }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,fontSize:".68rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".13em",color:"#57606a",marginBottom:18}}>
      {children}
      <span style={{flex:1,height:1,background:"#d0d7de"}}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   IMPORTANCE LEGEND  — shown inside the form card
══════════════════════════════════════════════════════════════════ */
function ImportanceLegend() {
  const items = [
    { color:"#c0392b", dot:"#e74c3c", tag:"CRITICAL",  tagBg:"rgba(192,57,43,.10)", text:"Factor",  desc:"Age, BP, Cholesterol" },
    { color:"#b7791f", dot:"#d69e2e", tag:"IMPORTANT", tagBg:"rgba(183,121,31,.10)", text:"Factor", desc:"Glucose, Weight, Smoking" },
    { color:"#276749", dot:"#38a169", tag:"GENERAL",   tagBg:"rgba(39,103,73,.10)",  text:"Factor", desc:"Gender, Height, Alcohol, Activity" },
  ];
  return (
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"stretch",marginBottom:22}}>
      {items.map((item,i)=>(
        <div key={i} style={{
          display:"flex",alignItems:"center",gap:10,
          background:"#ffffff",border:`1.5px solid ${item.dot}55`,
          borderLeft:`4px solid ${item.dot}`,
          borderRadius:8,padding:"8px 14px",
          flex:"1 1 160px",minWidth:0,
        }}>
          <span style={{width:10,height:10,borderRadius:"50%",background:item.dot,flexShrink:0,boxShadow:`0 0 0 3px ${item.dot}30`}}/>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,lineHeight:1.3}}>
              <span style={{display:"inline-block",background:item.tagBg,color:item.color,border:`1px solid ${item.dot}60`,borderRadius:4,fontSize:".65rem",fontWeight:800,letterSpacing:".08em",padding:"1px 7px"}}>{item.tag}</span>
              <span style={{fontWeight:700,color:item.color,fontSize:".78rem"}}>{item.text}</span>
            </div>
            <div style={{color:"#57606a",fontSize:".7rem",lineHeight:1.3,marginTop:2}}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TREATMENT / TRANSPLANT VERDICT BANNER
══════════════════════════════════════════════════════════════════ */
function TreatmentVerdict({ cls }) {
  const g=TREATMENT_GUIDANCE[cls]; if(!g)return null;
  const rc=RISK_COLORS[cls];
  return(
    <div style={{border:`2px solid ${rc.color}`,borderRadius:12,overflow:"hidden",marginBottom:22}}>
      <div style={{background:rc.bg,borderBottom:`1px solid ${rc.color}30`,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:14}}>
        <span style={{fontSize:"1.8rem",lineHeight:1,flexShrink:0}}>{g.verdictIcon}</span>
        <div>
          <div style={{fontWeight:700,fontSize:"1rem",color:rc.color,marginBottom:4}}>{g.verdict}</div>
          {g.requiresTransplant&&(
            <span style={{display:"inline-block",background:"#bc8cff22",border:"1.5px solid #bc8cff",borderRadius:50,padding:"3px 12px",fontSize:".72rem",fontWeight:700,color:"#bc8cff",letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>
              🫀 Heart Transplant Evaluation Indicated
            </span>
          )}
          <p style={{fontSize:".84rem",color:"#57606a",lineHeight:1.55,marginTop:4}}>{g.summary}</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,padding:"14px 18px",background:"#ffffff"}}>
        {g.interventions.map((item,i)=>(
          <div key={i} style={{background:rc.bgLite,border:"1px solid #d0d7de",borderRadius:8,padding:"10px 13px",display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:"1.1rem",flexShrink:0,marginTop:2}}>{item.icon}</span>
            <div>
              <div style={{fontWeight:600,fontSize:".8rem",color:rc.color,marginBottom:2}}>{item.title}</div>
              <div style={{fontSize:".75rem",color:"#57606a",lineHeight:1.5}}>{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RESULT CARD
══════════════════════════════════════════════════════════════════ */
function ResultCard({ result, formValues }) {
  const probDisease = result.probabilities?.Disease??0;
  const probNo      = result.probabilities?.["No Disease"]??(100-probDisease);
  const meta        = getRiskMeta(result.prediction, probDisease);
  const cl          = meta.cls;
  const rc          = RISK_COLORS[cl];

  const h=parseFloat(formValues.height||0), w=parseFloat(formValues.weight||0);
  const bmi=h?(w/((h/100)**2)).toFixed(1):"—";
  const bmiCls=!h?"ok":(parseFloat(bmi)<18.5||parseFloat(bmi)>30?"bad":parseFloat(bmi)>25?"warn":"ok");
  const chipColor={ok:"#3fb950",warn:"#d29922",bad:"#f85149"};
  const chipBg   ={ok:"rgba(63,185,80,.12)",warn:"rgba(210,153,34,.12)",bad:"rgba(248,81,73,.12)"};

  const chips=[
    {icon:"👤",name:"Age",        value:`${formValues.age} yrs`,      cls:parseFloat(formValues.age)>=65?"bad":parseFloat(formValues.age)>=50?"warn":"ok"},
    {icon:"⚖️",name:"BMI",        value:bmi,                           cls:bmiCls},
    {icon:"💉",name:"Systolic BP", value:`${formValues.systolic} mmHg`, cls:parseFloat(formValues.systolic)>=140?"bad":parseFloat(formValues.systolic)>=130?"warn":"ok"},
    {icon:"💉",name:"Diastolic BP",value:`${formValues.diastolic} mmHg`,cls:parseFloat(formValues.diastolic)>=90?"bad":parseFloat(formValues.diastolic)>=80?"warn":"ok"},
    {icon:"🧪",name:"Cholesterol", value:["","Normal","↑ Above","↑↑ High"][+formValues.cholesterol]||"—",cls:formValues.cholesterol==="3"?"bad":formValues.cholesterol==="2"?"warn":"ok"},
    {icon:"🩸",name:"Glucose",     value:["","Normal","↑ Above","↑↑ High"][+formValues.glucose]||"—",    cls:formValues.glucose==="3"?"bad":formValues.glucose==="2"?"warn":"ok"},
    {icon:"🚬",name:"Smoking",     value:formValues.smoking==="1"?"Smoker":"Non-Smoker",                  cls:formValues.smoking==="1"?"bad":"ok"},
    {icon:"🍷",name:"Alcohol",     value:formValues.alcohol==="1"?"Yes":"No",                             cls:formValues.alcohol==="1"?"warn":"ok"},
    {icon:"🏃",name:"Activity",    value:formValues.active==="1"?"Active":"Inactive",                     cls:formValues.active==="0"?"warn":"ok"},
    {icon:"👤",name:"Gender",      value:formValues.gender==="2"?"Male":"Female",                          cls:"ok"},
  ];

  const [barW,setBarW]=useState({no:0,yes:0});
  useEffect(()=>{
    const t=setTimeout(()=>setBarW({no:probNo,yes:probDisease}),120);
    return()=>clearTimeout(t);
  },[probNo,probDisease]);

  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:22}}>
        <div>
          <div style={{fontSize:".7rem",textTransform:"uppercase",letterSpacing:".1em",color:"#57606a",marginBottom:5}}>Prediction Result</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.4rem,3vw,1.85rem)",fontWeight:400,lineHeight:1.2,color:rc.color}}>
            {meta.emoji} {result.disease_type}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          <span style={{fontSize:".76rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",padding:"6px 15px",borderRadius:50,border:`2px solid ${rc.color}`,color:rc.color,whiteSpace:"nowrap"}}>{meta.label}</span>
          <div style={{fontSize:".73rem",color:"#57606a"}}>Status: <strong style={{color:"#1b1f23"}}>{result.presence||(result.prediction===0?"Absent":"Present")}</strong></div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"128px 1fr",gap:22,alignItems:"center",marginBottom:22}}>
        <div style={{textAlign:"center",padding:"6px 0 14px"}}>
          <div style={{fontSize:".7rem",textTransform:"uppercase",letterSpacing:".1em",color:"#57606a",marginBottom:4}}>Confidence</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"2.8rem",lineHeight:1,color:rc.color}}>{result.confidence??Math.round(Math.max(probDisease,probNo))}%</div>
          <div style={{fontSize:".74rem",color:"#57606a",marginTop:4}}>model certainty</div>
        </div>
        <div>
          {[{label:"No Disease",width:barW.no,val:probNo,color:"#3fb950"},{label:"Disease",width:barW.yes,val:probDisease,color:rc.color}].map(bar=>(
            <div key={bar.label} style={{display:"flex",alignItems:"center",gap:13,marginBottom:10}}>
              <span style={{fontSize:".8rem",width:92,flexShrink:0,color:"#57606a"}}>{bar.label}</span>
              <div style={{flex:1,height:10,background:"#d0d7de",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:99,background:bar.color,width:`${bar.width}%`,transition:"width .85s cubic-bezier(.4,0,.2,1)"}}/>
              </div>
              <span style={{fontSize:".8rem",fontWeight:600,width:44,textAlign:"right",color:bar.color}}>{bar.val.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:rc.bg,borderLeft:`4px solid ${rc.color}`,borderRadius:8,padding:"14px 18px",marginBottom:22}}>
        <div style={{fontWeight:600,fontSize:".86rem",color:rc.color,marginBottom:5}}>🏥 {result.medical_action}</div>
        <p style={{fontSize:".85rem",color:"#57606a"}}>{result.recommendation}</p>
      </div>

      <div style={{height:1,background:"#d0d7de",margin:"22px 0"}}/>
      <SectionLabel>🫀 Treatment &amp; Intervention Verdict</SectionLabel>
      <TreatmentVerdict cls={cl}/>

      <div style={{height:1,background:"#d0d7de",margin:"22px 0"}}/>
      <SectionLabel>📋 Personalised Next Steps</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10,marginBottom:4}}>
        {(NEXT_STEPS[cl]||NEXT_STEPS.safe).map((s,i)=>(
          <div key={i} style={{background:rc.bgLite,border:"1px solid #d0d7de",borderRadius:8,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:"1.05rem",flexShrink:0,marginTop:2}}>{s.icon}</span>
            <div>
              <div style={{fontWeight:600,fontSize:".8rem",color:rc.color,marginBottom:2}}>{s.t}</div>
              <div style={{fontSize:".76rem",color:"#57606a"}}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{height:1,background:"#d0d7de",margin:"22px 0"}}/>
      <SectionLabel>📊 Input Summary &amp; Risk Flags</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10,marginTop:8}}>
        {chips.map((c,i)=>(
          <div key={i} style={{background:"#edf0f3",border:"1px solid #d0d7de",borderRadius:8,padding:"10px 13px",display:"flex",alignItems:"center",gap:10,fontSize:".8rem"}}>
            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,background:chipBg[c.cls],color:chipColor[c.cls]}}>{c.icon}</div>
            <div>
              <div style={{color:"#57606a",fontSize:".72rem"}}>{c.name}</div>
              <div style={{fontWeight:600,color:chipColor[c.cls]}}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{height:1,background:"#d0d7de",margin:"22px 0"}}/>
      <div style={{display:"flex",alignItems:"center",gap:13,flexWrap:"wrap",background:"#edf0f3",border:"1px solid #d0d7de",borderRadius:8,padding:"11px 16px",fontSize:".78rem",color:"#57606a"}}>
        {/* model_info is sent by heart_controller.py — fallback shown if absent */}
        <span>Model: <strong style={{color:"#1b1f23"}}>{result.model_info?.model_name ?? "XGBoost Classifier"}</strong></span>
        {result.model_info?.model_accuracy!=null&&<span>Accuracy: <strong style={{color:"#1b1f23"}}>{(result.model_info.model_accuracy*100).toFixed(2)}%</strong></span>}
        <button onClick={()=>window.print()} style={{marginLeft:"auto",padding:"6px 18px",fontSize:".78rem",background:"#edf0f3",color:"#0366d6",border:"1.5px solid rgba(3,102,214,.28)",borderRadius:50,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
          🖨️ Save as PDF
        </button>
      </div>
      <div style={{marginTop:16,padding:"10px 14px",background:"#f5f5f5",borderRadius:6,fontSize:"8pt",color:"#555",lineHeight:1.55,border:"1px solid #ddd"}}>
        <strong>Medical Disclaimer:</strong> This report is produced by an AI prediction model for educational and research purposes only. It is <strong>not a clinical diagnosis</strong>. Always consult a qualified healthcare professional before making any medical decisions.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRINT REPORT — Red-themed PDF output matching kidney report style
══════════════════════════════════════════════════════════════════ */
function PrintReport({ result, formValues }) {
  if (!result) return null;

  const probDisease = result.probabilities?.Disease ?? 0;
  const meta        = getRiskMeta(result.prediction, probDisease);

  const valCls = (cls) => cls === "ok" ? "pv-ok" : cls === "warn" ? "pv-warn" : cls === "bad" ? "pv-bad" : "";
  const cholLabel = ["","Normal","Above Normal","Well Above Normal"][+formValues.cholesterol] || "—";
  const glucLabel = ["","Normal","Above Normal","Well Above Normal"][+formValues.glucose] || "—";

  const h = parseFloat(formValues.height||0), w = parseFloat(formValues.weight||0);
  const bmi = h ? (w/((h/100)**2)).toFixed(1) : "—";
  const bmiCls = !h ? "" : parseFloat(bmi)<18.5||parseFloat(bmi)>30 ? "bad" : parseFloat(bmi)>25 ? "warn" : "ok";

  const cholCls = formValues.cholesterol==="3"?"bad":formValues.cholesterol==="2"?"warn":"ok";
  const glucCls = formValues.glucose==="3"?"bad":formValues.glucose==="2"?"warn":"ok";
  const bpsCls  = parseFloat(formValues.systolic)>=140?"bad":parseFloat(formValues.systolic)>=130?"warn":"ok";
  const bpdCls  = parseFloat(formValues.diastolic)>=90?"bad":parseFloat(formValues.diastolic)>=80?"warn":"ok";
  const ageCls  = parseFloat(formValues.age)>=65?"bad":parseFloat(formValues.age)>=50?"warn":"ok";
  const smokeCls= formValues.smoking==="1"?"bad":"ok";
  const alcCls  = formValues.alcohol==="1"?"warn":"ok";
  const actCls  = formValues.active==="0"?"warn":"ok";

  const today = new Date().toLocaleDateString("en-GB");

  return (
    <div className="print-report">
      {/* ── Header */}
      <div className="print-header">
        <div>
          <div className="print-header-title">❤️ OnlyHeart AI Diagnostic Report</div>
          <div className="print-header-sub">AI-Powered Heart Disease Prediction System</div>
        </div>
        <div className="print-header-badge">
          <div>Date: {today}</div>
          <div>Age: {formValues.age} yrs</div>
        </div>
      </div>

      <div style={{padding:"0 2px"}}>

        {/* ── General Info */}
        <div className="print-section-heading">General Information</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Observed Value</th>
              <th>Reference / Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Age</td><td className={valCls(ageCls)}>{formValues.age} years</td><td>Risk ↑ after 45 (M) / 55 (F)</td></tr>
            <tr><td>Gender</td><td className="pv-ok">{formValues.gender==="2"?"Male":"Female"}</td><td>Biological sex</td></tr>
            <tr><td>Height</td><td className="pv-ok">{formValues.height} cm</td><td>140 – 220 cm (adult range)</td></tr>
            <tr><td>Weight</td><td className={valCls(bmiCls)}>{formValues.weight} kg</td><td>BMI: {bmi}</td></tr>
          </tbody>
        </table>

        {/* ── Clinical */}
        <div className="print-section-heading">Clinical Measurements</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Observed Value</th>
              <th>Normal Range</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Systolic Blood Pressure</td><td className={valCls(bpsCls)}>{formValues.systolic} mmHg</td><td>&lt; 120 mmHg (Normal)</td></tr>
            <tr><td>Diastolic Blood Pressure</td><td className={valCls(bpdCls)}>{formValues.diastolic} mmHg</td><td>&lt; 80 mmHg (Normal)</td></tr>
            <tr><td>Cholesterol</td><td className={valCls(cholCls)}>{cholLabel}</td><td>Normal / Above Normal / Well Above</td></tr>
            <tr><td>Fasting Glucose</td><td className={valCls(glucCls)}>{glucLabel}</td><td>Normal / Above Normal / Well Above</td></tr>
          </tbody>
        </table>

        {/* ── Lifestyle */}
        <div className="print-section-heading">Lifestyle Factors</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Observed Value</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Smoking</td><td className={valCls(smokeCls)}>{formValues.smoking==="1"?"Yes":"No"}</td><td>Yes / No</td></tr>
            <tr><td>Alcohol Intake</td><td className={valCls(alcCls)}>{formValues.alcohol==="1"?"Regular":"No / Occasionally"}</td><td>No / Occasionally / Regular</td></tr>
            <tr><td>Physical Activity</td><td className={valCls(actCls)}>{formValues.active==="1"?"Regularly Active":"Inactive / Sedentary"}</td><td>Regularly Active / Inactive</td></tr>
          </tbody>
        </table>

        {/* ── AI Summary */}
        <div className="print-section-heading">AI Prediction Summary</div>
        <div className="print-summary">
          <div className="print-summary-row">
            <span className="print-summary-label">Disease Status</span>
            <span className="print-summary-value">{result.disease_type}</span>
          </div>
          <div className="print-summary-row">
            <span className="print-summary-label">Decision</span>
            <span className="print-summary-value">{result.medical_action} ({result.recommendation})</span>
          </div>
          <div className="print-summary-row">
            <span className="print-summary-label">Risk Level</span>
            <span className="print-summary-value">{meta.label?.toUpperCase()}</span>
          </div>
          <div className="print-summary-row">
            <span className="print-summary-label">Confidence</span>
            <span className="print-summary-value">{result.confidence ?? Math.round(Math.max(result.probabilities?.Disease??0, result.probabilities?.["No Disease"]??0))}%</span>
          </div>
        </div>

        {/* ── Disclaimer */}
        <div className="print-disclaimer">
          <strong>Disclaimer:</strong> This report is AI-generated and should not be considered a medical diagnosis. Always consult a qualified healthcare professional before making any clinical decisions.
        </div>

        <div className="print-footer">Page 1 of 1 — OnlyHeart AI Diagnostic Report</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const INITIAL_FORM = { age:"",gender:"",height:"",weight:"",systolic:"",diastolic:"",cholesterol:"",glucose:"",smoking:"",alcohol:"",active:"" };
const SAMPLE       = { age:"55",gender:"2",height:"175",weight:"88",systolic:"142",diastolic:"92",cholesterol:"2",glucose:"2",smoking:"1",alcohol:"0",active:"0" };

export default function HeartDiseasePrediction() {
  const [form,setForm]     = useState(INITIAL_FORM);
  const [loading,setLoad]  = useState(false);
  const [result,setResult] = useState(null);
  const [error,setError]   = useState(null);
  const resultRef          = useRef(null);

  /* Apply light theme CSS variables once on mount */
  useEffect(()=>{
    const root=document.documentElement;
    Object.entries(LIGHT).forEach(([k,v])=>root.style.setProperty(k,v));
    document.body.style.background=LIGHT["--bg"];
    document.body.style.color=LIGHT["--text"];
  },[]);

  const getState=useCallback((id)=>{
    const v=form[id]; if(!v&&v!==0)return{cls:"",hint:""};
    return getFieldState(id,v,form);
  },[form]);

  const set=(id)=>(e)=>setForm(p=>({...p,[id]:e.target.value}));
  const clearAll=()=>{setForm(INITIAL_FORM);setResult(null);setError(null);};
  const fillSample=()=>{setForm(SAMPLE);setResult(null);setError(null);};

  function buildPayload(){
    return{
      Age:parseFloat(form.age), Gender:parseFloat(form.gender),
      "Height(cm)":parseFloat(form.height), "Weight(kg)":parseFloat(form.weight),
      Systolic_Blood_Pressure:parseFloat(form.systolic),
      Diastolic_Blood_Pressure:parseFloat(form.diastolic),
      Cholesterol:parseFloat(form.cholesterol), Glucose:parseFloat(form.glucose),
      Smoking:parseFloat(form.smoking), Alcohol:parseFloat(form.alcohol),
      Physical_Activity:parseFloat(form.active),
    };
  }

  async function handleSubmit(e){
    e.preventDefault(); setLoad(true); setResult(null); setError(null);
    try{
      const payload=buildPayload();
      if(Object.values(payload).some(v=>isNaN(v)))
        throw new Error("Please fill in all fields before submitting.");
      // ── Flask runs on port 5000; React dev server runs on a different port.
      // ── Using an absolute URL avoids the 404 that occurs with "/predict".
      // ── If you add "proxy": "http://127.0.0.1:5000" to package.json you
      //    can revert this back to "/predict" and remove the absolute URL.
      const FLASK_URL = "http://127.0.0.1:5000/api/heart";
      const res=await fetch(`${FLASK_URL}/predict`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
      const data=await res.json();
      if(data.success){ setResult(data.result); setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),80); }
      else setError(data.error||"Prediction failed. Please try again.");
    }catch(err){ setError(err.message); }
    finally{ setLoad(false); }
  }

  const inp=(id,extra={})=>({id,value:form[id],onChange:set(id),state:getState(id),...extra});
  const sel=(id,options) =>({id,value:form[id],onChange:set(id),options,state:getState(id)});

  const tooltipBody=(rows)=>(
    <div>
      {rows.map((r,i)=>
        typeof r==="string"
          ?<p key={i} style={{color:"#1b1f23",marginBottom:6,fontSize:".77rem"}}>{r}</p>
          :<div key={i} style={{borderTop:i===0?"1px solid #d0d7de":undefined,paddingTop:i===0?8:0,marginTop:i===0?4:0}}>
            {r.map((row,j)=>(
              <div key={j} style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:".75rem"}}>
                <span style={{color:"#6a737d"}}>{row[0]}</span>
                <span style={{fontWeight:600,color:row[2]||"#6a737d"}}>{row[1]}</span>
              </div>
            ))}
          </div>
      )}
    </div>
  );

  const secBtn={border:"1.5px solid rgba(3,102,214,.28)",borderRadius:50,cursor:"pointer",fontFamily:"inherit",fontSize:".88rem",fontWeight:600,padding:"11px 28px",background:"#edf0f3",color:"#0366d6"};

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#f4f6f9",color:"#1b1f23",minHeight:"100vh",padding:"32px 16px 80px",lineHeight:1.6}}>

      {/* ════════════════════════════════════════════
          PRINT-ONLY REPORT  (hidden on screen)
      ════════════════════════════════════════════ */}
      {result && <PrintReport result={result} formValues={form}/>}

      {/* ════════════════════════════════════════════
          SCREEN UI  (hidden on print)
      ════════════════════════════════════════════ */}
      <div data-noprint>

      {/* Print button */}
      <div data-noprint style={{position:"fixed",top:18,right:18,zIndex:200}}>
        <button onClick={()=>window.print()} style={{background:"#ffffff",border:"1px solid #d0d7de",borderRadius:8,color:"#57606a",cursor:"pointer",fontSize:".8rem",fontWeight:600,padding:"7px 13px",fontFamily:"inherit"}}>
          🖨️ Print / PDF
        </button>
      </div>

      <div style={{maxWidth:880,margin:"0 auto"}}>

        {/* Header */}
        <div style={{textAlign:"center",paddingBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(3,102,214,.10)",color:"#0366d6",border:"1px solid rgba(3,102,214,.25)",borderRadius:50,fontSize:".74rem",fontWeight:600,letterSpacing:".09em",textTransform:"uppercase",padding:"5px 14px",marginBottom:16}}>
            🫀 OnlyHeart AI
          </div>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,5vw,3rem)",fontWeight:400,letterSpacing:"-.02em",lineHeight:1.15,color:"#1b1f23",marginBottom:10}}>
            Only<em style={{color:"#c0392b",fontStyle:"italic"}}>Heart</em> AI Risk Analyser
          </h1>
          <p style={{color:"#57606a",fontSize:".93rem",maxWidth:430,margin:"0 auto"}}>
            Fill in your health metrics below for an instant cardiovascular risk assessment powered by OnlyHeart AI.
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{background:"rgba(240,136,62,.07)",border:"1px solid rgba(240,136,62,.22)",borderRadius:8,padding:"11px 18px",fontSize:".8rem",color:"#c45c00",textAlign:"center",marginBottom:20}}>
          ⚠️ Risk stages are estimates based on a machine learning model. They do not replace professional medical advice. Always consult a healthcare provider for comprehensive evaluation and guidance.
        </div>

        {/* Risk Legend */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginBottom:22}}>
          {[["#3fb950","Low Risk"],["#d29922","Moderate Risk"],["#f0883e","High Risk"],["#f85149","Critical Risk"],["#bc8cff","Extreme Risk"]].map(([color,label])=>(
            <span key={label} style={{fontSize:".7rem",fontWeight:600,padding:"3px 11px",borderRadius:50,border:`1.5px solid ${color}`,letterSpacing:".06em",color}}>● {label}</span>
          ))}
        </div>

        {/* ══════════════ FORM CARD ══════════════ */}
        <div style={{background:"#ffffff",border:"1px solid #d0d7de",borderRadius:14,padding:30,marginBottom:20}}>

          {/* Importance Legend */}
          <ImportanceLegend/>

          {/* Personal Info */}
          <SectionLabel>👤 Personal Information</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:18}}>

            <FieldGroup importanceId="age" label="Age (years)" state={getState("age")} hint={getState("age").hint}
              tooltip={{title:"🎂 Age",body:tooltipBody(["Age is one of the strongest non-modifiable CVD risk factors. Risk rises sharply after 45 in men and 55 in women.",[["Under 30","Low risk","#3fb950"],["30 – 49","Moderate — stay active","#3fb950"],["50 – 64","⚠ Increased risk","#d29922"],["65 +","⚠ Significant risk","#f85149"]]])}}>
              <StyledInput {...inp("age",{min:1,max:120,placeholder:"e.g. 50"})}/>
            </FieldGroup>

            <FieldGroup importanceId="gender" label="Gender" state={getState("gender")}
              tooltip={{title:"⚧ Biological Sex",body:tooltipBody(["Men generally face higher CVD risk at younger ages. Pre-menopausal women are partly protected by oestrogen.",[["Male (under 55)","Higher baseline risk","#d29922"],["Female (post-menopause)","Risk increases significantly","#d29922"]]])}}>
              <StyledSelect {...sel("gender",[{value:"",label:"Select"},{value:"1",label:"Female"},{value:"2",label:"Male"}])}/>
            </FieldGroup>

            <FieldGroup importanceId="height" label="Height (cm)" state={getState("height")} hint={getState("height").hint}
              tooltip={{title:"📏 Height",body:tooltipBody(["Used with weight to calculate BMI, a key surrogate marker for body fat. Enter your height in centimetres.",[["Valid adult range","140 – 220 cm","#3fb950"],["Outside range","Please check your entry","#f85149"]]])}}>
              <StyledInput {...inp("height",{min:100,max:250,placeholder:"e.g. 175"})}/>
            </FieldGroup>

            <FieldGroup importanceId="weight" label="Weight (kg)" state={getState("weight")} hint={getState("weight").hint}
              tooltip={{title:"⚖️ Weight & BMI",body:tooltipBody(["BMI = weight ÷ height². Excess weight raises blood pressure, LDL cholesterol, and blood glucose.",[["BMI < 18.5","Underweight","#d29922"],["BMI 18.5–24.9","Healthy ✓","#3fb950"],["BMI 25–29.9","Overweight ⚠","#d29922"],["BMI ≥ 30","Obese — high CVD risk","#f85149"]]])}}>
              <StyledInput {...inp("weight",{min:30,max:300,placeholder:"e.g. 75"})}/>
            </FieldGroup>
          </div>

          <div style={{height:1,background:"#d0d7de",margin:"22px 0"}}/>

          {/* Clinical */}
          <SectionLabel>🩺 Clinical Measurements</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:18}}>

            <FieldGroup importanceId="systolic" label="Systolic BP (mmHg)" state={getState("systolic")} hint={getState("systolic").hint}
              tooltip={{title:"💉 Systolic Blood Pressure",body:tooltipBody(["The peak pressure when your heart contracts. The top number in a reading (e.g. 120/80 mmHg).",[["< 120 mmHg","Normal ✓","#3fb950"],["120 – 129","Elevated — monitor","#3fb950"],["130 – 139","Stage 1 hypertension","#d29922"],["≥ 140","Stage 2 hypertension","#f85149"]]])}}>
              <StyledInput {...inp("systolic",{min:80,max:220,placeholder:"e.g. 120"})}/>
            </FieldGroup>

            <FieldGroup importanceId="diastolic" label="Diastolic BP (mmHg)" state={getState("diastolic")} hint={getState("diastolic").hint}
              tooltip={{title:"💉 Diastolic Blood Pressure",body:tooltipBody(["The pressure when your heart rests between beats. The bottom number in a reading (e.g. 120/80 mmHg).",[["< 80 mmHg","Normal ✓","#3fb950"],["80 – 89","Stage 1 hypertension","#d29922"],["≥ 90","Stage 2 hypertension","#f85149"]]])}}>
              <StyledInput {...inp("diastolic",{min:50,max:140,placeholder:"e.g. 80"})}/>
            </FieldGroup>

            <FieldGroup importanceId="cholesterol" label="Cholesterol" state={getState("cholesterol")} hint={getState("cholesterol").hint}
              tooltip={{title:"🧪 Serum Cholesterol",body:tooltipBody(["High LDL deposits fatty plaques in artery walls. HDL transports LDL away from arteries.",[["Normal","< 5.2 mmol/L (200 mg/dL)","#3fb950"],["Above Normal","5.2 – 6.2 mmol/L","#d29922"],["Well Above","> 6.2 mmol/L (240 mg/dL)","#f85149"]]])}}>
              <StyledSelect {...sel("cholesterol",[{value:"",label:"Select level"},{value:"1",label:"Normal"},{value:"2",label:"Above Normal"},{value:"3",label:"Well Above Normal"}])}/>
            </FieldGroup>

            <FieldGroup importanceId="glucose" label="Fasting Glucose" state={getState("glucose")} hint={getState("glucose").hint}
              tooltip={{title:"🩸 Fasting Blood Glucose",body:tooltipBody(["Measured after 8+ hours without food. Elevated levels signal insulin resistance or diabetes.",[["Normal","< 5.6 mmol/L (100 mg/dL)","#3fb950"],["Above Normal","5.6 – 7.0 mmol/L (pre-diabetes)","#d29922"],["Well Above","> 7.0 mmol/L (diabetes range)","#f85149"]]])}}>
              <StyledSelect {...sel("glucose",[{value:"",label:"Select level"},{value:"1",label:"Normal"},{value:"2",label:"Above Normal"},{value:"3",label:"Well Above Normal"}])}/>
            </FieldGroup>
          </div>

          <div style={{height:1,background:"#d0d7de",margin:"22px 0"}}/>

          {/* Lifestyle */}
          <SectionLabel>🏃 Lifestyle Factors</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:18}}>

            <FieldGroup importanceId="smoking" label="Smoking Status" state={getState("smoking")} hint={getState("smoking").hint}
              tooltip={{title:"🚬 Smoking",body:tooltipBody(["One of the most preventable causes of heart disease. Smoking damages blood vessel walls and promotes blood clot formation.",[["Non-Smoker","No added CVD risk ✓","#3fb950"],["Smoker","2–4× increased CVD risk","#f85149"]]])}}>
              <StyledSelect {...sel("smoking",[{value:"",label:"Select"},{value:"0",label:"Non-Smoker"},{value:"1",label:"Smoker"}])}/>
            </FieldGroup>

            <FieldGroup importanceId="alcohol" label="Alcohol Intake" state={getState("alcohol")} hint={getState("alcohol").hint}
              tooltip={{title:"🍷 Alcohol Consumption",body:tooltipBody(["Regular or heavy alcohol intake raises blood pressure and causes irregular heart rhythms.",[["None / Occasional","Minimal impact ✓","#3fb950"],["Regular Drinker","Elevated BP & arrhythmia risk","#d29922"]]])}}>
              <StyledSelect {...sel("alcohol",[{value:"",label:"Select"},{value:"0",label:"No / Occasionally"},{value:"1",label:"Regular Drinker"}])}/>
            </FieldGroup>

            <FieldGroup importanceId="active" label="Physical Activity" state={getState("active")} hint={getState("active").hint}
              tooltip={{title:"🏃 Physical Activity",body:tooltipBody(["Regular aerobic exercise strengthens the heart, lowers resting BP, and improves cholesterol. WHO recommends ≥ 150 min/week.",[["Regularly Active","Reduces CVD risk by ~35% ✓","#3fb950"],["Inactive / Sedentary","~2× risk vs. active adults","#d29922"]]])}}>
              <StyledSelect {...sel("active",[{value:"",label:"Select"},{value:"0",label:"Inactive / Sedentary"},{value:"1",label:"Regularly Active"}])}/>
            </FieldGroup>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:26,flexWrap:"wrap"}}>
            <button onClick={handleSubmit} disabled={loading}
              style={{border:"none",borderRadius:50,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",fontSize:".88rem",fontWeight:600,padding:"11px 28px",background:"linear-gradient(135deg,#c0392b,#922b21)",color:"#fff",boxShadow:"0 4px 18px rgba(192,57,43,.30)",opacity:loading?.5:1,transition:"all .2s"}}>
              {loading?"⏳ Analysing…":"🔍 Analyse Risk"}
            </button>
            <button onClick={fillSample} style={secBtn}>📋 Load Sample</button>
            <button onClick={clearAll}   style={secBtn}>✕ Clear</button>
          </div>
        </div>

        {/* Loading */}
        {loading&&(
          <div style={{textAlign:"center",padding:30,color:"#57606a"}}>
            <div style={{width:50,height:50,borderRadius:"50%",border:"3px solid rgba(192,57,43,.18)",borderTopColor:"#c0392b",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
            <p>Analysing health metrics…</p>
          </div>
        )}

        {/* Error */}
        {error&&(
          <div style={{background:"rgba(192,57,43,.08)",border:"1px solid rgba(192,57,43,.25)",borderRadius:8,padding:"15px 18px",color:"#c0392b",fontSize:".88rem",marginBottom:20}}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Result */}
        {result&&!loading&&(
          <div ref={resultRef} style={{background:"#ffffff",border:"1px solid #d0d7de",borderRadius:14,padding:30,marginBottom:20}}>
            <ResultCard result={result} formValues={form}/>
          </div>
        )}

      </div>

      </div>{/* end data-noprint */}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ═══════════════════════════════════════════════
           PRINT / PDF  — Red theme, kidney-report style
        ═══════════════════════════════════════════════ */
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff !important; color: #111 !important; margin: 0; padding: 0; font-family: 'DM Sans', Arial, sans-serif; }

          /* Hide UI chrome */
          [data-noprint], .no-print { display: none !important; }

          /* ── Page wrapper */
          .print-report {
            display: block !important;
            width: 100%;
            font-size: 9pt;
            color: #111;
            page-break-inside: avoid;
          }

          /* ── Report Header */
          .print-header {
            background: #c0392b !important;
            color: #fff !important;
            padding: 18px 24px 14px;
            display: flex !important;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            border-radius: 0;
          }
          .print-header-title { font-size: 15pt; font-weight: 700; letter-spacing: -.01em; }
          .print-header-sub   { font-size: 8.5pt; opacity: .88; margin-top: 3px; }
          .print-header-badge {
            background: rgba(255,255,255,.18) !important;
            border: 1px solid rgba(255,255,255,.4) !important;
            border-radius: 50px;
            padding: 5px 14px;
            font-size: 8pt;
            font-weight: 700;
            white-space: nowrap;
            text-align: center;
            color: #fff !important;
          }

          /* ── Section heading */
          .print-section-heading {
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .1em;
            color: #c0392b !important;
            border-bottom: 1.5px solid #c0392b !important;
            padding-bottom: 3px;
            margin: 14px 0 8px;
          }

          /* ── Clinical Parameters table (like kidney PDF) */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-bottom: 10px;
          }
          .print-table th {
            background: #f5f5f5 !important;
            color: #333 !important;
            font-weight: 700;
            text-align: left;
            padding: 5px 8px;
            border: 1px solid #ddd !important;
            font-size: 8pt;
          }
          .print-table td {
            padding: 4px 8px;
            border: 1px solid #e8e8e8 !important;
            vertical-align: middle;
          }
          .print-table tr:nth-child(even) td { background: #fafafa !important; }

          /* value cell color coding */
          .pv-ok   { color: #1a7f37 !important; font-weight: 600; }
          .pv-warn { color: #9a6700 !important; font-weight: 600; }
          .pv-bad  { color: #c0392b !important; font-weight: 600; }

          /* ── AI Prediction Summary box */
          .print-summary {
            background: #fdf3f3 !important;
            border: 2px solid #c0392b !important;
            border-radius: 8px;
            padding: 14px 18px;
            margin: 14px 0;
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 8px 20px;
            page-break-inside: avoid;
          }
          .print-summary-row { display: flex; justify-content: space-between; align-items: center; font-size: 9pt; border-bottom: 1px dotted #f0c0c0; padding: 4px 0; }
          .print-summary-row:last-child { border-bottom: none; }
          .print-summary-label { color: #555; font-size: 8.5pt; }
          .print-summary-value { font-weight: 700; color: #c0392b !important; font-size: 9pt; }
          .print-summary-value.ok { color: #1a7f37 !important; }

          /* ── Disclaimer */
          .print-disclaimer {
            margin-top: 14px;
            padding: 9px 13px;
            background: #f5f5f5 !important;
            border: 1px solid #ddd !important;
            border-radius: 5px;
            font-size: 7.5pt;
            color: #555;
            line-height: 1.5;
          }

          /* ── Page number footer */
          .print-footer {
            text-align: center;
            font-size: 7.5pt;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 8px;
            margin-top: 14px;
          }

          /* Hide screen-only elements completely */
          @media print {
  [data-noprint] { display: none !important; }
  .print-report  { display: block !important; }
}
          .print-report { padding: 24px 28px; }
        }

        @media screen { .print-report { display: none; } }
      `}</style>
    </div>
  );
}