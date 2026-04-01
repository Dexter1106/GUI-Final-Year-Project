####################################################################
#
# File Name    : heart_controller.py
# Description  : OnlyHeart AI — /predict endpoint (Flask Blueprint)
# Author       : Pradhumnya Changdev Kalsait
# Date         : 20/01/26
#
####################################################################

from flask import Blueprint, request, jsonify
from app.services.heart_service import predict_heart_disease

heart_blueprint = Blueprint("heart_blueprint", __name__)


"""
################################################################
#
# Function Name : predict_heart
# Description   : OnlyHeart AI — Heart disease prediction REST API
# Author        : Pradhumnya Changdev Kalsait
# Date          : 20/01/26
# Prototype     : dict predict_heart(void)
# Input Output  : (1 input, 1 output)
#
################################################################
"""

# ── Required fields ────────────────────────────────────────────────
REQUIRED_FIELDS = [
    "Age", "Gender", "Height(cm)", "Weight(kg)",
    "Systolic_Blood_Pressure", "Diastolic_Blood_Pressure",
    "Cholesterol", "Glucose", "Smoking", "Alcohol", "Physical_Activity",
]

# ── Criticality → probabilities sent to React UI ──────────────────
#
# ALIGNMENT NOTE — these values MUST agree with getRiskMeta() in Heart.jsx:
#
#   getRiskMeta(prediction, probDisease):
#     prediction === 0          → cls "safe"     (Low Risk)
#     probDisease < 60          → cls "moderate" (Moderate Risk)
#     probDisease < 75          → cls "high"     (High Risk)
#     probDisease < 90          → cls "critical" (Critical Risk)
#     probDisease >= 90         → cls "extreme"  (Extreme Risk)
#
# So each Disease probability below must land inside its own bracket:
#   Low Risk      →  15  (< 60  ✓, but prediction=0 so getRiskMeta returns "safe" regardless)
#   Moderate Risk →  52  (< 60  ✓ → "moderate")
#   High Risk     →  68  (>= 60, < 75 ✓ → "high")
#   Critical Risk →  83  (>= 75, < 90 ✓ → "critical")
#
PROB_MAP = {
    "Low Risk":      {"Disease": 15.0, "No Disease": 85.0, "confidence": 15},
    "Moderate Risk": {"Disease": 52.0, "No Disease": 48.0, "confidence": 52},
    "High Risk":     {"Disease": 68.0, "No Disease": 32.0, "confidence": 68},
    "Critical Risk": {"Disease": 83.0, "No Disease": 17.0, "confidence": 83},
}


@heart_blueprint.route("/predict", methods=["POST"])
def predict_heart():

    body = request.get_json(force=True)
    if body is None:
        return jsonify({"success": False, "error": "Invalid or empty JSON body"}), 400

    # ── Validate presence ──────────────────────────────────────────
    missing = [f for f in REQUIRED_FIELDS if f not in body]
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {missing}"}), 400

    # ── Build + type-check input dict ──────────────────────────────
    input_data = {}
    for field in REQUIRED_FIELDS:
        try:
            input_data[field] = float(body[field])
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": f"Invalid value for '{field}'"}), 400

    # ── Call heart_service ─────────────────────────────────────────
    result = predict_heart_disease(input_data)

    if result.get("disease") == "Error":
        return jsonify({
            "success": False,
            "error": result.get("decision", "Prediction failed")
        }), 500

    criticality = result.get("criticality", "").strip()   # e.g. "High Risk"

    # ── Derive prediction flag (1 = disease present, 0 = absent) ──
    is_disease = "NO CARDIOVASCULAR" not in result.get("disease", "").upper()
    prediction = 1 if is_disease else 0

    # ── Look up probabilities for this criticality level ───────────
    probs = PROB_MAP.get(
        criticality,
        {"Disease": 50.0, "No Disease": 50.0, "confidence": 50}
    )

    # ── Split "ACTION: recommendation text" ────────────────────────
    decision_raw = result.get("decision", "")
    if ":" in decision_raw:
        action_part, _, rec_part = decision_raw.partition(":")
        medical_action = action_part.strip().title()
        recommendation = rec_part.strip().capitalize()
    else:
        medical_action = decision_raw.strip().title()
        recommendation = ""

    return jsonify({
        "success": True,
        "result": {
            # ── Core prediction fields consumed by ResultCard ──────
            "organ":          result.get("organ", "Heart"),
            "disease_type":   result.get("disease", "Unknown"),
            "risk_level":     criticality,
            "prediction":     prediction,                  # 0 or 1
            "probabilities": {
                "Disease":    probs["Disease"],            # used by probability bars
                "No Disease": probs["No Disease"],
            },
            "confidence":     probs["confidence"],         # shown as big % number
            "medical_action": medical_action,              # shown in action banner
            "recommendation": recommendation,              # shown below medical_action
            "presence":       "Present" if is_disease else "Absent",

            # ── model_info — consumed by the info strip at bottom ──
            # Heart.jsx line 470: result.model_info?.model_name
            # Heart.jsx line 471: result.model_info?.model_accuracy
            "model_info": {
                "model_name":     "best_model (VotingClassifier)",
                "model_accuracy": 0.87,       # update with your actual eval accuracy
            },
        }
    }), 200