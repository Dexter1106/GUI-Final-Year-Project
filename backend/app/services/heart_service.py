####################################################################
#
# File Name    : heart_service.py
# Description  : OnlyHeart AI — Core prediction service (NO Flask here)
#                Pipeline: KNNImputer → StandardScaler → XGBClassifier
# Author       : Pradhumnya Changdev Kalsait
# Date         : 20/01/26
#
####################################################################

import os
import joblib
import numpy as np

# ── Model directory ────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR = os.path.join(
    BASE_DIR,
    "ml_models",
    "models_heartcsv"
)


MODEL_FILE   = os.path.join(MODEL_DIR, "best_model.pkl")   # XGBClassifier
IMPUTER_FILE = os.path.join(MODEL_DIR, "imputer.pkl")      # KNNImputer
SCALER_FILE  = os.path.join(MODEL_DIR, "scaler.pkl")       # StandardScaler


# ── Load all three artifacts once at import time ───────────────────
def _load(path, label):
    try:
        with open(path, "rb") as f:
            obj = joblib.load(f)
        print(f"[heart_service] ✅ {label} loaded  → {path}")
        return obj
    except FileNotFoundError:
        print(f"[heart_service] ❌ {label} NOT found at: {path}")
        return None
    except Exception as e:
        print(f"[heart_service] ❌ {label} failed to load: {e}")
        return None


_model   = _load(MODEL_FILE,   "best_model")
_imputer = _load(IMPUTER_FILE, "imputer")
_scaler  = _load(SCALER_FILE,  "scaler")


# ── Feature order MUST match your training data column order ───────
FEATURE_ORDER = [
    "Age",
    "Gender",
    "Height(cm)",
    "Weight(kg)",
    "Systolic_Blood_Pressure",
    "Diastolic_Blood_Pressure",
    "Cholesterol",
    "Glucose",
    "Smoking",
    "Alcohol",
    "Physical_Activity",
]


"""
################################################################
#
# Function Name : predict_heart_disease
# Description   : Runs the full inference pipeline:
#                   1. Build feature array from input dict
#                   2. KNNImputer  (handles missing / NaN values)
#                   3. StandardScaler (normalise)
#                   4. XGBClassifier.predict + predict_proba
#                   5. Map prediction to structured result dict
# Author        : Pradhumnya Changdev Kalsait
# Date          : 20/01/26
# Prototype     : dict predict_heart_disease(dict input_data)
#
################################################################
"""

def predict_heart_disease(input_data: dict) -> dict:
    """
    Parameters
    ----------
    input_data : dict
        Keys from FEATURE_ORDER, values castable to float.

    Returns
    -------
    dict  {organ, disease, criticality, decision}
    On error: {"disease": "Error", "decision": "<message>"}
    """

    # ── Guard: all three artifacts must be loaded ──────────────────
    if _model is None:
        return {"disease": "Error", "decision": f"Model file not found: {MODEL_FILE}"}
    if _imputer is None:
        return {"disease": "Error", "decision": f"Imputer file not found: {IMPUTER_FILE}"}
    if _scaler is None:
        return {"disease": "Error", "decision": f"Scaler file not found: {SCALER_FILE}"}
    
    print("data at service = ",input_data)

    try:
        # ── 1. Build (1 x 11) feature array ───────────────────────
        features = np.array(
            [[input_data[f] for f in FEATURE_ORDER]],
            dtype=float
        )

        # ── 2. Impute — KNNImputer fills any NaN values ───────────
        # features = _imputer.transform(features)

        # ── 3. Scale — StandardScaler normalises features ─────────
        # features = _scaler.transform(features)

        # ── 4. Predict ────────────────────────────────────────────
        prediction   = int(_model.predict(features)[0])   # 0 or 1
        proba        = _model.predict_proba(features)[0]  # [p_class0, p_class1]
        prob_disease = float(proba[1])                    # probability of class 1

        # ── 5. Map to result dict ──────────────────────────────────
        if prediction == 0:
            return {
                "organ":       "Heart",
                "disease":     "No Cardiovascular Disease",
                "criticality": "Low Risk",
                "decision":    "LIFESTYLE: Maintain a heart-healthy lifestyle with regular annual check-ups",
            }

        # Disease present — grade criticality from probability
        if prob_disease < 0.55:
            criticality = "Moderate Risk"
            decision    = "CONSULT: Schedule a cardiovascular review with your GP soon"
        elif prob_disease < 0.70:
            criticality = "High Risk"
            decision    = "REFERRAL: Request a full cardiac evaluation from a cardiologist"
        elif prob_disease < 0.85:
            criticality = "Critical Risk"
            decision    = "URGENT: See a cardiologist immediately — do not delay"
        else:
            criticality = "Critical Risk"
            decision    = "EMERGENCY: Seek urgent specialist care without delay"

            print({"organ":       "Heart",
            "disease":     "Cardiovascular Disease",
            "criticality": criticality,
            "decision":    decision,})

        return {
            "organ":       "Heart",
            "disease":     "Cardiovascular Disease",
            "criticality": criticality,
            "decision":    decision,
        }

    except KeyError as e:
        return {"disease": "Error", "decision": f"Missing feature in input: {e}"}
    except Exception as e:
        return {"disease": "Error", "decision": f"Prediction failed: {str(e)}"}