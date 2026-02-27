####################################################################
#
# File Name :   kidney_service.py
# Description : Kidney disease prediction service using VotingClassifier
# Author      : Pradhumnya Changdev Kalsait
# Date        : 19/01/26
#
####################################################################

import os
import numpy as np
import pandas as pd
import joblib
from flask import Blueprint, request, jsonify

kidney_blueprint = Blueprint("kidney", __name__)

# ================================================================
# Model Loading
# ================================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_PATH = os.path.join(
    BASE_DIR, "ml_models", "kidney_best_model.pkl"
)

model = joblib.load(MODEL_PATH)

# These are the ORIGINAL training columns (before OHE)
FEATURE_ORDER = model.feature_names_in_


# ================================================================
# Core Prediction Logic
# ================================================================

def predict_kidney_disease(input_data: dict) -> dict:
    """
    Final, production-safe inference function.
    """

    df = pd.DataFrame([input_data])

    # Enforce training column order
    df = df.reindex(columns=model.feature_names_in_)

    # 🔥 FORCE categorical columns to STRING (CRITICAL)
    preprocessor = model.named_steps["preprocessing"]
    categorical_cols = preprocessor.transformers_[1][2]

    for col in categorical_cols:
        df[col] = df[col].astype(str)

    # Predict
    stage = int(model.predict(df)[0])
    confidence = float(np.max(model.predict_proba(df)))

    stage_map = {
        0: ("No Kidney Disease", "LOW", "NO TRANSPLANT REQUIRED (Treatment)"),
        1: ("CKD Stage 1–2", "MEDIUM", "MEDICATION & MONITORING (Treatment)"),
        2: ("CKD Stage 3", "HIGH", "STRICT MONITORING (Treatment)"),
        3: ("CKD Stage 4", "VERY HIGH", "DIALYSIS REQUIRED(Treatment)"),
        4: ("End Stage Renal Disease", "CRITICAL", "TRANSPLANT REQUIRED"),
    }

    disease, criticality, decision = stage_map[stage]

    return {
        "organ": "KIDNEY",
        # "stage": stage,
        "disease": disease,
        "criticality": criticality,
        "decision": decision,
        "confidence": f"{confidence * 100:.2f}%"
    }

# ================================================================
# API Route
# ================================================================

# @kidney_blueprint.route("/predict", methods=["POST"])
# def predict():
#     try:
#         data = request.get_json()

#         if not data:
#             return jsonify({"error": "Empty input payload"}), 400

#         result = predict_kidney_disease(data)
#         return jsonify(result), 200

#     except Exception as e:
#         print("Kidney prediction error:", e)
#         return jsonify({"error": str(e)}), 500
