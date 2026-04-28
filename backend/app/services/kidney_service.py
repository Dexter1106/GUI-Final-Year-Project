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
    BASE_DIR, "ml_models", "kidney_model", "all_ckd_models.pkl"
)

models_dict = joblib.load(MODEL_PATH)

# Use ANY one model to get feature order (all have same pipeline)
sample_model = list(models_dict.values())[0]
FEATURE_ORDER = sample_model.feature_names_in_

# ================================================================
# Core Prediction Logic
# ================================================================

def predict_kidney_disease(input_data: dict) -> dict:
    """
    Multi-model inference with confidence aggregation
    """

    df = pd.DataFrame([input_data])

    # Ensure correct column order
    df = df.reindex(columns=FEATURE_ORDER)

    all_results = {}
    best_conf = -1
    best_stage = None


    for name, model in models_dict.items():

        try:
            # Handle categorical conversion
            preprocessor = model.named_steps["preprocessing"]
            categorical_cols = preprocessor.transformers_[1][2]

            for col in categorical_cols:
                df[col] = df[col].astype(str)

            pred = int(model.predict(df)[0])

            # Handle models without predict_proba (like SVC sometimes)
            if hasattr(model.named_steps["model"], "predict_proba"):
                prob = model.predict_proba(df)
                confidence = float(np.max(prob))
            else:
                confidence = 0.0  # fallback

            all_results[name] = {
                "stage": pred,
                "confidence": round(confidence * 100, 2)
            }

            # Track best model
            if confidence > best_conf:
                best_conf = confidence
                best_stage = pred

        except Exception as e:
            print(f"Error in model {name}:", e)

    # ================================
    # Final Decision (BEST MODEL)
    # ================================
    stage_map = {
        1: ("No Kidney Disease", "LOW", "NO TRANSPLANT REQUIRED (Treatment)"),
        2: ("CKD Stage 1–2", "MEDIUM", "TREATMENT Required"),
        3: ("CKD Stage 3", "HIGH", "TREATMENT Required"),
        4: ("CKD Stage 4", "VERY HIGH", "TREATMENT REQUIRED"),
        5: ("End Stage Renal Disease", "CRITICAL", "TRANSPLANT REQUIRED"),
    }

    disease, criticality, decision = stage_map[best_stage]

    return {
        "organ": "KIDNEY",
        "disease": disease,
        "criticality": criticality,
        "decision": decision,
        "confidence": f"{best_conf * 100:.2f}%",
        
        # 🔥 NEW: Send all model outputs to frontend
        "model_results": all_results
    }