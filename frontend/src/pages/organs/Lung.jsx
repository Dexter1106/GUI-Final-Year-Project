////////////////////////////////////////////////////////////////////
//
// File Name : Lung.jsx
// Description : Two-Stage COPD AI Prediction (Stage-1 + Stage-2)
// Author      : Pradhumnya Changdev Kalsait
// Date        : 25/02/26
//
////////////////////////////////////////////////////////////////////

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";

const inputClass =
  "border p-3 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white";

const Lungs = () => {
  const [breathFile, setBreathFile] = useState(null);
  const [clinicalData, setClinicalData] = useState({});
  const [stage1Result, setStage1Result] = useState(null);
  const [stage2Result, setStage2Result] = useState(null);
  const [showStage2, setShowStage2] = useState(false);
  const [loading, setLoading] = useState(false);

  // ================= VALIDATION =================
  const validateClinicalInputs = () => {
    const requiredFields = [
      "Age",
      "Gender",
      "BMI, kg/m2",
      "Height/m",
      "History of Heart Failure",
      "working place",
      "mMRC",
      "status of smoking",
      "Pack History",
      "Vaccination",
      "Depression",
      "Dependent",
      "Temperature",
      "Respiratory Rate",
      "Heart Rate",
      "Blood pressure",
      "Oxygen Saturation",
      "Sputum",
    ];

    for (let field of requiredFields) {
      if (
        clinicalData[field] === undefined ||
        clinicalData[field] === null ||
        clinicalData[field] === ""
      ) {
        alert(`Please fill: ${field}`);
        return false;
      }
    }

    // Range validation
    if (clinicalData["Oxygen Saturation"] < 70 || clinicalData["Oxygen Saturation"] > 100) {
      alert("Oxygen Saturation must be between 70 and 100");
      return false;
    }

    if (clinicalData["mMRC"] < 0 || clinicalData["mMRC"] > 4) {
      alert("mMRC must be between 0 and 4");
      return false;
    }

    return true;
  };

  // ================= STAGE-1 =================
  const handleStage1Submit = async (e) => {
    e.preventDefault();

    if (!breathFile) {
      alert("Please upload breath CSV file");
      return;
    }

    setLoading(true);
    setStage1Result(null);
    setStage2Result(null);
    setShowStage2(false);

    try {
      const formData = new FormData();
      formData.append("file", breathFile);

      const response = await axiosInstance.post(
        "/lung/stage1",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setStage1Result(response.data);

      if (response.data.prediction === "COPD") {
        setShowStage2(true);
      }
    } catch (error) {
      alert("Stage-1 Prediction Failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= STAGE-2 =================
  const handleClinicalChange = (e) => {
    setClinicalData({
      ...clinicalData,
      [e.target.name]: parseFloat(e.target.value),
    });
  };

  const handleStage2Submit = async (e) => {
    e.preventDefault();

    if (!validateClinicalInputs()) return;

    setLoading(true);
    setStage2Result(null);

    try {
      const response = await axiosInstance.post(
        "/lung/stage2",
        clinicalData,
        { headers: { "Content-Type": "application/json" } }
      );

      setStage2Result(response.data);
    } catch {
      alert("Stage-2 Prediction Failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= RISK COLOR =================
  const getRiskColor = (confidence) => {
    if (confidence > 0.75) return "text-red-600";
    if (confidence > 0.50) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = (confidence) => {
    if (confidence > 0.75) return "bg-red-500";
    if (confidence > 0.50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 p-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8"
        >
          <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
            COPD AI Screening System
          </h1>

          {/* ================= STAGE-1 ================= */}
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            Stage-1: Breath Screening
          </h2>

          <form onSubmit={handleStage1Submit} className="mb-6">
            <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center hover:bg-blue-50 transition">
              <UploadCloud className="mx-auto mb-3 text-blue-500" size={40} />
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBreathFile(e.target.files[0])}
                required
              />
              {breathFile && (
                <p className="mt-3 text-green-600 flex items-center justify-center gap-2">
                  <FileText size={18} />
                  {breathFile.name}
                </p>
              )}
            </div>

            <div className="text-center mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
              >
                {loading ? <Loader2 className="animate-spin inline" /> : "Run Stage-1"}
              </button>
            </div>
          </form>

          {/* Stage-1 Result */}
          {stage1Result && (
            <div className="mb-8 bg-slate-50 p-4 rounded-xl">
              <p>
                <strong>Prediction:</strong> {stage1Result.prediction}
              </p>
              <p>
                <strong>Confidence:</strong>{" "}
                {(stage1Result.confidence * 100).toFixed(2)}%
              </p>

              {/* Probability Bars */}
              {stage1Result.probabilities &&
                Object.entries(stage1Result.probabilities).map(
                  ([label, value]) => (
                    <div key={label} className="mt-2">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{(value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
            </div>
          )}

          {/* ================= STAGE-2 ================= */}
          {showStage2 && (
            <>
              <hr className="my-6" />
              <h2 className="text-xl font-semibold mb-4 text-blue-600">
                Stage-2: Severity Prediction
              </h2>

              <form onSubmit={handleStage2Submit}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">

                  <input type="number" name="Age" placeholder="Age" min="18" max="100" required onChange={handleClinicalChange} className={inputClass}/>
                  <select name="Gender" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Gender</option>
                    <option value="1">Male</option>
                    <option value="0">Female</option>
                  </select>
                  <input type="number" name="BMI, kg/m2" placeholder="BMI" step="0.1" required onChange={handleClinicalChange} className={inputClass}/>
                  <input type="number" name="Height/m" placeholder="Height (m)" step="0.01" required onChange={handleClinicalChange} className={inputClass}/>
                  <select name="History of Heart Failure" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Heart Failure</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                  <select name="working place" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Working Place</option>
                    <option value="1">Industrial</option>
                    <option value="0">Non-Industrial</option>
                  </select>
                  <select name="mMRC" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">mMRC</option>
                    {[0,1,2,3,4].map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                  <select name="status of smoking" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Smoking</option>
                    <option value="1">Smoker</option>
                    <option value="0">Non-Smoker</option>
                  </select>
                  <input type="number" name="Pack History" placeholder="Pack Years" required onChange={handleClinicalChange} className={inputClass}/>
                  <select name="Vaccination" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Vaccination</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                  <select name="Depression" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Depression</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                  <select name="Dependent" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Dependent</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                  <input type="number" name="Temperature" placeholder="Temperature" required onChange={handleClinicalChange} className={inputClass}/>
                  <input type="number" name="Respiratory Rate" placeholder="Respiratory Rate" required onChange={handleClinicalChange} className={inputClass}/>
                  <input type="number" name="Heart Rate" placeholder="Heart Rate" required onChange={handleClinicalChange} className={inputClass}/>
                  <input type="number" name="Blood pressure" placeholder="Blood Pressure" required onChange={handleClinicalChange} className={inputClass}/>
                  <input type="number" name="Oxygen Saturation" placeholder="Oxygen Saturation (%)" min="70" max="100" required onChange={handleClinicalChange} className={inputClass}/>
                  <select name="Sputum" required onChange={handleClinicalChange} className={inputClass}>
                    <option value="">Sputum</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>

                </div>

                <div className="text-center">
                  <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl">
                    {loading ? <Loader2 className="animate-spin inline" /> : "Run Stage-2"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Stage-2 Result */}
          {stage2Result && (
            <div className="mt-8 bg-slate-50 p-6 rounded-xl">
              <p className={`text-lg font-semibold ${getRiskColor(stage2Result.confidence)}`}>
                GOLD Stage: {stage2Result.gold_stage}
              </p>
              <p>
                Confidence: {(stage2Result.confidence * 100).toFixed(2)}%
              </p>

              {/* Probability Bars */}
              {stage2Result.probabilities &&
                Object.entries(stage2Result.probabilities).map(
                  ([label, value]) => (
                    <div key={label} className="mt-2">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{(value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`${getProgressColor(value)} h-3 rounded-full`}
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Lungs;